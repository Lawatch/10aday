'use strict';
// Exact port of git's ignore rules: wildmatch.c (glob matching) and dir.c (pattern parsing, precedence,
// excluded parent directories). Checked against the real `git check-ignore` by test.js.

const NOMATCH = 1, MATCH = 0, ABORT_ALL = -1, ABORT_TO_STARSTAR = -2;
const isGlobSpecial = c => c === '*' || c === '?' || c === '[' || c === '\\';
const CLASSES = {
  alnum: c => /[A-Za-z0-9]/.test(c), alpha: c => /[A-Za-z]/.test(c), blank: c => c === ' ' || c === '\t',
  cntrl: c => c.charCodeAt(0) < 32 || c.charCodeAt(0) === 127, digit: c => /[0-9]/.test(c),
  graph: c => c.charCodeAt(0) > 32 && c.charCodeAt(0) < 127, lower: c => /[a-z]/.test(c),
  print: c => c.charCodeAt(0) >= 32 && c.charCodeAt(0) < 127, punct: c => /[!-\/:-@\[-`{-~]/.test(c),
  space: c => /[ \t\n\r\f\v]/.test(c), upper: c => /[A-Z]/.test(c), xdigit: c => /[0-9A-Fa-f]/.test(c)
};

// dowild(pattern, text, pathname): pattern and text are strings; indexes play the role of C pointers.
function dowild(P, pi, T, ti, pathname) {
  const start = pi;
  for (; pi < P.length; ti++, pi++) {
    let pch = P[pi];
    let tch = ti < T.length ? T[ti] : '';
    if (tch === '' && pch !== '*') return ABORT_ALL;
    switch (pch) {
      case '\\':
        pi++; pch = pi < P.length ? P[pi] : '';
        if (tch !== pch) return NOMATCH;
        continue;
      case '?':
        if (pathname && tch === '/') return NOMATCH;
        continue;
      case '*': {
        let matchSlash;
        if (P[++pi] === '*') {
          const prev = pi - 2;
          while (P[++pi] === '*') {}
          if ((prev < start || P[prev] === '/') && (pi >= P.length || P[pi] === '/' || (P[pi] === '\\' && P[pi + 1] === '/'))) {
            if (P[pi] === '/' && dowild(P, pi + 1, T, ti, pathname) === MATCH) return MATCH;
            matchSlash = true;
          } else matchSlash = false;
        } else matchSlash = !pathname;
        if (pi >= P.length) {
          if (!matchSlash && T.indexOf('/', ti) >= 0) return NOMATCH;
          return MATCH;
        } else if (!matchSlash && P[pi] === '/') {
          const slash = T.indexOf('/', ti);
          if (slash < 0) return NOMATCH;
          ti = slash; // the slash is consumed by the loop
          break;
        }
        for (;;) {
          if (tch === '') break;
          if (!isGlobSpecial(P[pi])) {
            const want = P[pi];
            while (ti < T.length && (tch = T[ti], matchSlash || tch !== '/')) { if (tch === want) break; ti++; }
            if (ti >= T.length) tch = '';
            if (tch !== want) return NOMATCH;
          }
          const m = dowild(P, pi, T, ti, pathname);
          if (m !== NOMATCH) { if (!matchSlash || m !== ABORT_TO_STARSTAR) return m; }
          else if (!matchSlash && tch === '/') return ABORT_TO_STARSTAR;
          ti++; tch = ti < T.length ? T[ti] : '';
        }
        return ABORT_ALL;
      }
      case '[': {
        pch = P[++pi] || '';
        if (pch === '^') pch = '!';
        const negated = pch === '!';
        if (negated) pch = P[++pi] || '';
        let prev = '', matched = false;
        do {
          if (!pch) return ABORT_ALL;
          if (pch === '\\') {
            pch = P[++pi] || '';
            if (!pch) return ABORT_ALL;
            if (tch === pch) matched = true;
          } else if (pch === '-' && prev && P[pi + 1] && P[pi + 1] !== ']') {
            pch = P[++pi];
            if (pch === '\\') { pch = P[++pi] || ''; if (!pch) return ABORT_ALL; }
            if (tch <= pch && tch >= prev) matched = true;
            pch = '';
          } else if (pch === '[' && P[pi + 1] === ':') {
            const s = pi += 2;
            while (pi < P.length && P[pi] !== ']') pi++;
            if (pi >= P.length) return ABORT_ALL;
            pch = ']';
            const len = pi - s - 1;
            if (len < 0 || P[pi - 1] !== ':') { pi = s - 2; pch = '['; if (tch === pch) matched = true; continue; }
            const fn = CLASSES[P.slice(s, s + len)];
            if (!fn) return ABORT_ALL;
            if (fn(tch)) matched = true;
            pch = '';
          } else if (tch === pch) matched = true;
        } while (prev = pch, pch = P[++pi] || '', pch !== ']');
        if (matched === negated || (pathname && tch === '/')) return NOMATCH;
        continue;
      }
      default:
        if (tch !== pch) return NOMATCH;
        continue;
    }
  }
  return ti < T.length ? NOMATCH : MATCH;
}
const wildmatch = (pattern, text, pathname) => dowild(pattern, 0, text, 0, pathname) === MATCH;

function trimTrailingSpaces(s) {
  let last = -1;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === ' ') { if (last < 0) last = i; }
    else if (c === '\\') { i++; if (i >= s.length) return s; last = -1; }
    else last = -1;
  }
  return last >= 0 ? s.slice(0, last) : s;
}
const simpleLength = s => { for (let i = 0; i < s.length; i++) if (isGlobSpecial(s[i])) return i; return s.length; };

// One .gitignore file -> list of patterns. base = directory of the file, "" or "dir/sub/".
function parseGitignore(text, base, source) {
  const out = [];
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
  const lines = text.split('\n');
  lines.forEach((raw, idx) => {
    if (idx === lines.length - 1 && raw === '') return;
    if (raw === '' || raw[0] === '#') return;
    let line = raw.endsWith('\r') ? raw.slice(0, -1) : raw;
    line = trimTrailingSpaces(line);
    if (line === '') return;
    let p = line, negative = false, mustBeDir = false;
    if (p[0] === '!') { negative = true; p = p.slice(1); }
    if (p.endsWith('/')) { mustBeDir = true; p = p.slice(0, -1); }
    const noDir = p.indexOf('/') < 0;
    let prefix = Math.min(simpleLength(p), p.length);
    const endsWith = !noDir ? false : (p[0] === '*' && simpleLength(p.slice(1)) === p.length - 1);
    out.push({ pattern: p, negative, mustBeDir, noDir, endsWith, prefix, base, source, line: idx + 1, text: raw.replace(/\r$/, '') });
  });
  return out;
}

function matchBasename(basename, x) {
  if (x.prefix === x.pattern.length) return basename === x.pattern;
  if (x.endsWith) return basename.endsWith(x.pattern.slice(1));
  return wildmatch(x.pattern, basename, false);
}
function matchPathname(path, x) {
  let pat = x.pattern, prefix = x.prefix;
  if (pat[0] === '/') { pat = pat.slice(1); prefix--; }
  if (path.length < x.base.length || !path.startsWith(x.base)) return false;
  let name = path.slice(x.base.length);
  if (prefix > 0) {
    if (prefix > name.length) return false;
    if (name.slice(0, prefix) !== pat.slice(0, prefix)) return false;
    pat = pat.slice(prefix); name = name.slice(prefix);
    if (!pat.length && !name.length) return true;
  }
  return wildmatch(pat, name, true);
}
function lastMatchInList(list, path, basename, isDir) {
  for (let i = list.length - 1; i >= 0; i--) {
    const x = list[i];
    if (x.mustBeDir && !isDir) continue;
    if (x.noDir ? matchBasename(basename, x) : matchPathname(path, x)) return x;
  }
  return null;
}

// files: { ".gitignore": "...", "src/.gitignore": "..." } (only files named .gitignore are read, like git).
function compile(files) {
  const byDir = {};
  Object.keys(files || {}).forEach(f => {
    const norm = f.replace(/\\/g, '/').replace(/^\.\//, '').replace(/^\/+/, '');
    if (norm !== '.gitignore' && !norm.endsWith('/.gitignore')) throw new Error('not a .gitignore file name: ' + f + ' (use ".gitignore" or "dir/.gitignore")');
    const dir = norm.slice(0, norm.length - '.gitignore'.length);
    byDir[dir] = parseGitignore(String(files[f]), dir, norm);
  });
  return byDir;
}

// Path rules: relative to the repository root, "/" separators, a trailing "/" means a directory.
function check(byDir, rawPath) {
  let p = String(rawPath).replace(/\\/g, '/').replace(/^\.\//, '').replace(/^\/+/, '');
  let isDir = false;
  if (p.endsWith('/')) { isDir = true; p = p.replace(/\/+$/, ''); }
  if (!p) throw new Error('empty path');
  const parts = p.split('/').filter(s => s && s !== '.');
  if (parts.some(s => s === '..')) throw new Error('path goes outside the repository: ' + rawPath);
  p = parts.join('/');
  const stack = [];
  if (byDir['']) stack.push(byDir['']);
  const lookup = (path, basename, dir) => { for (let j = stack.length - 1; j >= 0; j--) { const m = lastMatchInList(stack[j], path, basename, dir); if (m) return m; } return null; };
  let acc = '';
  for (let k = 0; k < parts.length - 1; k++) {
    acc = acc ? acc + '/' + parts[k] : parts[k];
    const m = lookup(acc, parts[k], true);
    if (m && !m.negative) {
      const own = lookup(p, parts[parts.length - 1], isDir);
      return { path: p + (isDir ? '/' : ''), ignored: true, rule: ruleOf(m), excluded_parent: acc + '/',
        note: 'Ignored because its parent directory ' + acc + '/ is ignored. Git never looks inside an ignored directory, so rules for files in it have no effect' +
          (own && own.negative ? ' (your re-include rule "' + own.text + '" on ' + own.source + ':' + own.line + ' cannot work. Fix: replace "' + m.text + '" with "' + acc + '/*", which ignores the content but not the directory itself)' : '') + '.' };
    }
    if (byDir[acc + '/']) stack.push(byDir[acc + '/']);
  }
  const m = lookup(p, parts[parts.length - 1], isDir);
  if (!m) return { path: p + (isDir ? '/' : ''), ignored: false, rule: null, note: 'No rule matches: the path is not ignored.' };
  return { path: p + (isDir ? '/' : ''), ignored: !m.negative, rule: ruleOf(m),
    note: m.negative ? 'Re-included by a "!" rule: not ignored.' : 'Ignored by this rule (the last matching rule wins).' };
}
const ruleOf = m => ({ source: m.source, line: m.line, pattern: m.text });

function describe(x) {
  const bits = [];
  const what = x.mustBeDir ? 'directories' : 'files and directories';
  let p = x.pattern, where;
  if (x.noDir) where = 'named "' + p + '" at any depth' + (x.base ? ' under ' + x.base : '');
  else where = 'at the path "' + p.replace(/^\//, '') + '" relative to ' + (x.base || 'the repository root') + ' (anchored)';
  bits.push((x.negative ? 'Re-includes (un-ignores) ' : 'Ignores ') + what + ' ' + where + '.');
  if (x.mustBeDir) bits.push('Everything inside a matching directory is ignored too, and cannot be re-included.');
  if (/(^|\/)\*\*\//.test(p)) bits.push('"**/" matches zero or more directories.');
  if (/\/\*\*$/.test(p)) bits.push('"/**" matches everything inside, but not the directory itself.');
  if (/\*/.test(p.replace(/\*\*/g, ''))) bits.push('"*" matches anything except "/".');
  return bits.join(' ');
}

function explain(byDir) {
  const out = [];
  Object.keys(byDir).sort().forEach(dir => {
    const list = byDir[dir];
    list.forEach((x, i) => {
      const warnings = [];
      if (/[^\\] +$/.test(x.text) || /^ +$/.test(x.text)) warnings.push('Trailing spaces are removed by git. Escape them with "\\ " if they are part of the name.');
      if (/^\s+#/.test(x.text)) warnings.push('This is not a comment: "#" starts a comment only at the very beginning of the line.');
      if (/[^\/*]\*\*|\*\*[^\/*]/.test(x.pattern)) warnings.push('"**" next to other characters acts like a single "*" (it does not cross "/").');
      if (/\\$/.test(x.pattern)) warnings.push('A pattern ending with a backslash never matches.');
      if (x.pattern.indexOf('[') >= 0 && wildmatchBroken(x.pattern)) warnings.push('Unclosed "[" : this pattern never matches.');
      if (x.negative) {
        // A re-include under a directory excluded by an earlier rule cannot work.
        const target = (x.pattern[0] === '/' ? x.pattern.slice(1) : x.pattern);
        if (!x.noDir) {
          const segs = target.split('/');
          let acc = x.base.replace(/\/$/, '');
          for (let k = 0; k < segs.length - 1; k++) {
            if (/[*?\[\\]/.test(segs[k])) break;
            acc = acc ? acc + '/' + segs[k] : segs[k];
            const before = list.slice(0, i);
            const m = lastMatchInList(before, acc, segs[k], true);
            if (m && !m.negative) { warnings.push('Has no effect: the parent directory ' + acc + '/ is already ignored by line ' + m.line + ' ("' + m.text + '"). Fix: replace "' + m.text + '" with "' + acc + '/*" (ignores the content, not the directory), then this rule works.'); break; }
          }
        }
      }
      out.push({ source: x.source, line: x.line, pattern: x.text, meaning: describe(x), warnings });
    });
  });
  return out;
}
function wildmatchBroken(p) { return dowild(p, 0, 'x', 0, true) === ABORT_ALL && dowild(p, 0, '[', 0, true) === ABORT_ALL && dowild(p, 0, ']', 0, true) === ABORT_ALL; }

module.exports = { wildmatch, parseGitignore, compile, check, explain };
