'use strict';
// Exact port of how Docker (BuildKit) decides which files go into the build context:
// moby/patternmatcher (ignorefile.ReadAll, New, compile, MatchesUsingParentResults) + tonistiigi/fsutil filter walk.
// Checked against the real Go code (oracle/main.go) on random cases, see test.js.

// Go path.Clean (Unix).
function clean(p) {
  if (p === '') return '.';
  const rooted = p[0] === '/';
  const out = [];
  for (const part of p.split('/')) {
    if (part === '' || part === '.') continue;
    if (part === '..') { if (out.length && out[out.length - 1] !== '..') out.pop(); else if (!rooted) out.push('..'); continue; }
    out.push(part);
  }
  const s = (rooted ? '/' : '') + out.join('/');
  return s === '' ? '.' : s;
}

// ignorefile.ReadAll: returns [{pattern, line, raw}]
function readAll(text) {
  const res = [];
  let lines = text.split('\n');
  if (lines.length && lines[lines.length - 1] === '') lines.pop();
  lines.forEach((l, i) => {
    if (l.endsWith('\r')) l = l.slice(0, -1); // bufio.ScanLines drops a trailing \r
    if (i === 0 && l.charCodeAt(0) === 0xfeff) l = l.slice(1);
    if (l.startsWith('#')) return;
    let p = l.trim();
    if (p === '') return;
    const inv = p[0] === '!';
    if (inv) p = p.slice(1).trim();
    if (p.length > 0) { p = clean(p); if (p.length > 1 && p[0] === '/') p = p.slice(1); }
    if (inv) p = '!' + p;
    res.push({ pattern: p, line: i + 1, raw: l });
  });
  return res;
}

// Go filepath.Match syntax check (pattern against "."): returns error string or null.
function badPattern(p) {
  let i = 0;
  while (i < p.length) {
    const c = p[i];
    if (c === '\\') { i += 2; if (i > p.length) return 'syntax error in pattern'; continue; }
    if (c === '[') {
      i++;
      if (p[i] === '^') i++;
      let n = 0;
      for (;;) {
        if (i >= p.length) return 'syntax error in pattern';
        if (p[i] === ']' && n > 0) { i++; break; }
        let lo = p[i];
        if (lo === '\\') { i++; if (i >= p.length) return 'syntax error in pattern'; lo = p[i]; }
        else if (lo === '-' || lo === ']') return 'syntax error in pattern';
        i++;
        if (p[i] === '-') {
          i++;
          if (i >= p.length) return 'syntax error in pattern';
          let hi = p[i];
          if (hi === '\\') { i++; if (i >= p.length) return 'syntax error in pattern'; hi = p[i]; }
          else if (hi === ']' || hi === '-') return 'syntax error in pattern';
          if (hi < lo) return 'syntax error in pattern';
          i++;
        }
        n++;
      }
      continue;
    }
    i++;
  }
  return null;
}

const ESC = new Set('.+()|{}$'.split(''));
function compile(pat) {
  let re = '^', type = 'exact';
  const ch = Array.from(pat);
  let k = 0;
  for (let i = 0; k < ch.length; i++) {
    const c = ch[k++];
    if (c === '*') {
      if (ch[k] === '*') {
        k++;
        if (ch[k] === '/') k++;
        if (k >= ch.length) { if (type === 'exact') type = 'prefix'; else { re += '.*'; type = 'regexp'; } }
        else { re += '(.*/)?'; type = 'regexp'; }
        if (i === 0) type = 'suffix';
      } else { re += '[^/]*'; type = 'regexp'; }
    } else if (c === '?') { re += '[^/]'; type = 'regexp'; }
    else if (ESC.has(c)) re += '\\' + c;
    else if (c === '\\') {
      if (k < ch.length) { re += '\\' + ch[k++]; type = 'regexp'; } else re += '\\';
    } else if (c === '[' || c === ']') { re += c; type = 'regexp'; }
    else re += c;
  }
  const o = { type, pat };
  if (type === 'regexp') {
    re += '$';
    try { o.re = new RegExp(re, 'su'); } catch (e) { o.bad = true; }
  }
  return o;
}
function match(cp, path) {
  switch (cp.type) {
    case 'exact': return path === cp.pat;
    case 'prefix': return path.startsWith(cp.pat.slice(0, -2));
    case 'suffix': { const s = cp.pat.slice(2); if (path.endsWith(s)) return true; return s[0] === '/' && path === s.slice(1); }
    case 'regexp': return !cp.bad && cp.re.test(path);
  }
  return false;
}

function trimGlob(p) {
  if (p.endsWith('/**')) p = p.slice(0, -3);
  if (p.endsWith('/*')) p = p.slice(0, -2);
  return p;
}

// Build the matcher (patternmatcher.New + fsutil.NewFilterFS).
function build(text) {
  const entries = readAll(text);
  const pats = [];
  for (const e of entries) {
    let p = e.pattern.trim();
    if (p === '') continue;
    p = clean(p);
    let exclusion = false;
    if (p[0] === '!') {
      if (p.length === 1) throw new Error('illegal exclusion pattern: "!" (line ' + e.line + ')');
      exclusion = true; p = p.slice(1);
    }
    const bad = badPattern(p);
    if (bad) throw new Error(bad + ' (line ' + e.line + ': ' + JSON.stringify(e.raw.trim()) + ')');
    pats.push(Object.assign(compile(p), { exclusion, line: e.line, text: e.raw.trim(), cleaned: (exclusion ? '!' : '') + p }));
  }
  const hasExcl = pats.some(p => p.exclusion);
  const onlyPrefix = !pats.some(p => p.exclusion && /[*[\]?^\\]/.test(trimGlob(p.pat)));
  return { pats, hasExcl, onlyPrefix, entries };
}

// MatchesUsingParentResults, also returning which pattern decided.
function matchStep(m, path, parent) {
  let matched = false, by = null, inherited = false;
  const info = new Array(m.pats.length).fill(false);
  m.pats.forEach((p, i) => {
    let mt = parent ? parent[i] : false;
    let inh = mt;
    if (!mt) {
      if (p.exclusion !== matched) return;
      mt = match(p, path);
      if (!mt && !parent) {
        const d = path.lastIndexOf('/');
        if (d > 0) {
          const parts = path.slice(0, d).split('/');
          for (let j = 0; j < parts.length && !mt; j++) mt = match(p, parts.slice(0, j + 1).join('/'));
          inh = mt;
        }
      }
    }
    info[i] = mt;
    if (mt) { matched = !p.exclusion; by = p; inherited = inh; }
  });
  return { matched, info, by, inherited };
}

function canSkipDir(m, dir) {
  if (!m.onlyPrefix) return false;
  if (!m.hasExcl) return true;
  const ds = dir + '/';
  return !m.pats.some(p => p.exclusion && (trimGlob(p.pat) + '/').startsWith(ds));
}

function rule(p) { return p ? { line: p.line, pattern: p.text } : null; }

// Decide for one path (file, or directory if it ends with "/").
function check(m, input) {
  let isDir = input.endsWith('/');
  let path = clean(input.replace(/^\.\//, ''));
  if (path.startsWith('/')) path = path.replace(/^\/+/, '');
  if (path === '.' || path === '' || path.startsWith('..')) throw new Error('path must be inside the build context: ' + JSON.stringify(input));
  const parts = path.split('/');
  let parent = null, excludedDir = null, excludedBy = null;
  for (let i = 0; i < parts.length; i++) {
    const cur = parts.slice(0, i + 1).join('/');
    const last = i === parts.length - 1;
    const r = matchStep(m, cur, parent);
    if (r.matched && (!last || isDir) && canSkipDir(m, cur)) {
      return { path: input, sent: false, rule: rule(r.by), excluded_dir: cur + '/',
        note: 'Not sent: directory "' + cur + '/" is excluded by line ' + r.by.line + ' (' + r.by.text + ') and no "!" rule points inside it, so Docker does not even look inside.' };
    }
    if (last) {
      const res = { path: input, sent: !r.matched, rule: rule(r.by) };
      if (r.matched) res.note = r.inherited && r.by ? 'Not sent: a parent directory matches line ' + r.by.line + ' (' + r.by.text + ').' : 'Not sent: matches line ' + r.by.line + ' (' + r.by.text + ').';
      else if (r.by) res.note = 'Sent: re-included by line ' + r.by.line + ' (' + r.by.text + ').';
      else res.note = 'Sent: no rule matches.';
      if (!r.matched && excludedDir) res.note += ' Its parent directory "' + excludedDir + '" is excluded but still sent, only to hold it.';
      return res;
    }
    if (r.matched && !excludedDir) { excludedDir = cur + '/'; excludedBy = r.by; }
    parent = r.info;
  }
}

// List: every file of a project tree, and the directories that end up in the context.
function context(m, paths) {
  const results = paths.map(p => check(m, p));
  const sent = new Set();
  const dirs = new Set();
  results.forEach(r => {
    const p = clean(r.path.replace(/^\.\//, '')).replace(/^\/+/, '');
    const parts = p.split('/');
    for (let i = 1; i < parts.length; i++) dirs.add(parts.slice(0, i).join('/') + '/');
  });
  dirs.forEach(d => { if (check(m, d).sent) sent.add(d); });
  results.forEach(r => {
    if (!r.sent) return;
    let p = clean(r.path.replace(/^\.\//, '')).replace(/^\/+/, '');
    const parts = p.split('/');
    for (let i = 1; i < parts.length; i++) sent.add(parts.slice(0, i).join('/') + '/');
    sent.add(r.path.endsWith('/') ? p + '/' : p);
  });
  return { results, sent: Array.from(sent).sort() };
}

// Line-by-line explanation and classic mistakes.
function explain(text) {
  const m = build(text);
  const rules = m.pats.map(p => {
    const w = [];
    const body = p.pat;
    let meaning;
    if (body.startsWith('**/')) meaning = 'Matches "' + body.slice(3) + '" at any depth.';
    else if (!body.includes('/')) meaning = 'Matches "' + body + '" ONLY at the root of the build context (not in subdirectories). Use "**/' + body + '" for any depth.';
    else meaning = 'Matches the path "' + body + '" from the root of the build context.';
    if (p.exclusion) meaning = 'Re-includes: ' + meaning.charAt(0).toLowerCase() + meaning.slice(1);
    else meaning += ' Everything inside a matching directory is excluded too.';
    const anchored = p.text.replace(/^!\s*/, '').startsWith('/');
    if (!anchored && !p.exclusion && !body.includes('/') && /[*?[]/.test(body) && !body.startsWith('**')) w.push('Root only: "' + body + '" does not match files in subdirectories (unlike .gitignore). Write "**/' + body + '" if you meant any depth.');
    if (!anchored && !p.exclusion && !body.includes('/') && !/[*?[]/.test(body) && /^(node_modules|\.git|dist|build|target|vendor|__pycache__|\.venv|venv|coverage|\.next|tmp|logs)$/.test(body)) w.push('Root only: a "' + body + '" directory deeper in the tree (e.g. packages/app/' + body + ') is still sent. Add "**/' + body + '" if needed.');
    if (p.text.replace(/^!\s*/, '').startsWith('/')) w.push('The leading "/" is removed: patterns are always relative to the context root.');
    if (/\/$/.test(p.text)) w.push('The trailing "/" is ignored: this also matches a file with that name (unlike .gitignore).');
    if (p.exclusion) {
      const earlier = m.pats.slice(0, m.pats.indexOf(p)).filter(q => !q.exclusion);
      if (!earlier.length) w.push('Nothing before this line excludes anything, so this "!" rule has no effect (order matters: last matching line wins).');
    }
    if (p.text.startsWith('#') || p.text.startsWith('!#')) w.push('Not a comment: "#" must be the very first character of the line. Docker treats this line as a pattern.');
    return { line: p.line, pattern: p.text, meaning, warnings: w };
  });
  rules.sort((a, b) => a.line - b.line);
  return rules;
}

module.exports = { readAll, build, check, context, explain, clean };
