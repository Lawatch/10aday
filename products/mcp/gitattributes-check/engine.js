'use strict';
// Exact port of git's attribute rules: wildmatch.c (glob matching) and attr.c (line parsing, macros, precedence
// between nested .gitattributes files). Checked against the real `git check-attr` by test.js.

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

const simpleLength = s => { for (let i = 0; i < s.length; i++) if (isGlobSpecial(s[i])) return i; return s.length; };
const BLANK = ' \t\r\n';
const isBlank = c => BLANK.indexOf(c) >= 0 && c !== '';
const span = (s, i) => { while (i < s.length && isBlank(s[i])) i++; return i; };
const cspan = (s, i) => { while (i < s.length && !isBlank(s[i])) i++; return i; };
const validName = n => n.length > 0 && n[0] !== '-' && /^[-._0-9A-Za-z]+$/.test(n);
// Names starting with "builtin_" are reserved by recent git versions (whole line ignored); older ones (2.43) accept them.
const OPTIONS = { reserveBuiltin: true, keepPrefix: true };
const reserved = n => OPTIONS.reserveBuiltin && n.startsWith('builtin_');

// C-style unquoting as in git's quote.c (unquote_c_style). Returns { value, end } or null.
function unquoteC(s, i) {
  if (s[i] !== '"') return null;
  let out = []; i++;
  const enc = new TextEncoder();
  for (;;) {
    const c = s[i];
    if (c === undefined) return null;
    if (c === '"') return { value: Buffer.from(out).toString('utf8'), end: i + 1 };
    if (c !== '\\') { out.push(...enc.encode(c)); i++; continue; }
    const d = s[++i];
    if (d === undefined) return null;
    const simple = { a: 7, b: 8, f: 12, n: 10, r: 13, t: 9, v: 11, '\\': 92, '"': 34 };
    if (d in simple) { out.push(simple[d]); i++; continue; }
    if (d >= '0' && d <= '3') {
      const o1 = s[i + 1], o2 = s[i + 2];
      if (!(o1 >= '0' && o1 <= '7') || !(o2 >= '0' && o2 <= '7')) return null;
      out.push(parseInt(d + o1 + o2, 8)); i += 3; continue;
    }
    return null;
  }
}

// One attribute token -> { name, state } or { error }. state: true (set), false (unset), null (unspecified), string (value).
function parseState(tok) {
  const eq = tok.indexOf('=');
  let name = eq >= 0 ? tok.slice(0, eq) : tok, state;
  if (name[0] === '-' || name[0] === '!') { state = name[0] === '-' ? false : null; name = name.slice(1); }
  else state = eq >= 0 ? tok.slice(eq + 1) : true;
  if (!validName(name) || reserved(name)) return { error: name };
  return { name, state };
}

// One attributes file -> { rules, problems }. base = "" or "dir/sub/"; macroOk for the root file and .git/info/attributes.
function parseFile(text, base, source, macroOk) {
  const rules = [], problems = [];
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
  const lines = text.split('\n');
  lines.forEach((raw, idx) => {
    if (idx === lines.length - 1 && raw === '') return;
    const lineNo = idx + 1, shown = raw.replace(/\r$/, '');
    const prob = msg => problems.push({ source, line: lineNo, text: shown, problem: msg });
    let i = span(raw, 0);
    if (i >= raw.length || raw[i] === '#') return;
    if (raw.length >= 2048) return prob('Line is 2048 characters or longer: git ignores it.');
    let name, statesAt, quoted = false;
    const uq = raw[i] === '"' ? unquoteC(raw, i) : null;
    if (uq) { name = uq.value; statesAt = uq.end; quoted = true; }
    else { const e = cspan(raw, i); name = raw.slice(i, e); statesAt = e; }
    let isMacro = false;
    if (name.length > 6 && name.startsWith('[attr]')) {
      if (!macroOk) return prob('Macro definitions ([attr]) are only allowed in the root .gitattributes (or .git/info/attributes): git ignores this line.');
      isMacro = true;
      let j = span(name, 6); const k = cspan(name, j); name = name.slice(j, k);
      if (!validName(name) || reserved(name)) return prob('"' + name + '" is not a valid attribute name: git ignores this line.');
    }
    const states = [];
    let j = span(raw, statesAt);
    while (j < raw.length) {
      const e = cspan(raw, j);
      const st = parseState(raw.slice(j, e));
      if (st.error !== undefined) return prob('"' + st.error + '" is not a valid attribute name (letters, digits, "-", ".", "_" only, not starting with "-"): git ignores the whole line.');
      states.push(st);
      j = span(raw, e);
    }
    const rule = { source, line: lineNo, text: shown, states, base };
    if (isMacro) { rule.macro = name; rules.push(rule); return; }
    let p = name;
    if (p[0] === '!') return prob('Negative patterns ("!") are not supported in .gitattributes: git ignores this line. To unset an attribute, write "-attr" (unset) or "!attr" (unspecified) after the pattern.');
    let mustBeDir = false;
    if (p.endsWith('/')) { mustBeDir = true; p = p.slice(0, -1); }
    const noDir = p.indexOf('/') < 0;
    const endsWith = noDir && p[0] === '*' && simpleLength(p.slice(1)) === p.length - 1;
    Object.assign(rule, { pattern: p, mustBeDir, noDir, endsWith, prefix: Math.min(simpleLength(p), p.length) });
    rules.push(rule);
  });
  return { rules, problems };
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
    if (prefix === pat.length && prefix === name.length) return true;
    // Recent git (seen in 2.56) matches the rest with the literal prefix still in place, so a "**" glued to it
    // (".env**/**") acts like "*". Git 2.43 cut the prefix first, turning it into a leading "**/".
    if (OPTIONS.keepPrefix) return wildmatch(pat, name, true);
    pat = pat.slice(prefix); name = name.slice(prefix);
    if (!pat.length && !name.length) return true;
  }
  return wildmatch(pat, name, true);
}
const matches = (x, path, basename, isDir) => !(x.mustBeDir && !isDir) && (x.noDir ? matchBasename(basename, x) : matchPathname(path, x));

const BUILTIN = parseFile('[attr]binary -diff -merge -text\n', '', '(built-in)', true).rules;

// files: { ".gitattributes": "...", "src/.gitattributes": "...", ".git/info/attributes": "..." }
function compile(files) {
  const byDir = {}, problems = [];
  let info = null;
  Object.keys(files || {}).forEach(f => {
    const norm = f.replace(/\\/g, '/').replace(/^\.\//, '').replace(/^\/+/, '');
    if (norm === '.git/info/attributes') { info = parseFile(String(files[f]), '', norm, true); problems.push(...info.problems); return; }
    if (norm !== '.gitattributes' && !norm.endsWith('/.gitattributes')) throw new Error('not a .gitattributes file name: ' + f + ' (use ".gitattributes", "dir/.gitattributes" or ".git/info/attributes")');
    const dir = norm.slice(0, norm.length - '.gitattributes'.length);
    const r = parseFile(String(files[f]), dir, norm, dir === '');
    byDir[dir] = r.rules; problems.push(...r.problems);
  });
  return { byDir, info: info ? info.rules : [], problems };
}

function normPath(rawPath) {
  let p = String(rawPath).replace(/\\/g, '/').replace(/^\.\//, '').replace(/^\/+/, '');
  let isDir = false;
  if (p.endsWith('/')) { isDir = true; p = p.replace(/\/+$/, ''); }
  if (!p) throw new Error('empty path');
  const parts = p.split('/').filter(s => s && s !== '.');
  if (parts.some(s => s === '..')) throw new Error('path goes outside the repository: ' + rawPath);
  return { parts, isDir };
}

// Attributes of one path, exactly as git check-attr. Returns { path, attrs: { name: { state, rule, via } } }.
function check(c, rawPath) {
  const { parts, isDir } = normPath(rawPath);
  const p = parts.join('/'), basename = parts[parts.length - 1];
  // Stack, highest priority first: .git/info/attributes, deepest directory ... root, built-in.
  const stack = [c.info];
  let acc = '';
  const dirs = [''];
  for (let k = 0; k < parts.length - 1; k++) { acc += parts[k] + '/'; dirs.push(acc); }
  for (let k = dirs.length - 1; k >= 0; k--) if (c.byDir[dirs[k]]) stack.push(c.byDir[dirs[k]]);
  stack.push(BUILTIN);
  const macros = {};
  stack.forEach(list => { for (let i = list.length - 1; i >= 0; i--) { const r = list[i]; if (r.macro && !macros[r.macro]) macros[r.macro] = r; } });
  const attrs = {};
  const fillOne = (rule, via, origin, def) => {
    for (let i = rule.states.length - 1; i >= 0; i--) {
      const st = rule.states[i];
      if (Object.prototype.hasOwnProperty.call(attrs, st.name)) continue;
      const a = { state: st.state, rule: ruleOf(origin) };
      if (via) { a.via_macro = via; a.macro_defined_at = ruleOf(def); }
      attrs[st.name] = a;
      const m = macros[st.name];
      if (m && st.state === true) fillOne(m, (via ? via + ' > ' : '') + st.name, origin, m);
    }
  };
  stack.forEach(list => { for (let i = list.length - 1; i >= 0; i--) { const r = list[i]; if (!r.macro && matches(r, p, basename, isDir)) fillOne(r, null, r, null); } });
  // The classic trap: a "dir/" rule matches the parent directory, but attributes are not inherited by its content.
  const notes = [];
  let d = '';
  for (let k = 0; k < parts.length - 1; k++) {
    d = d ? d + '/' + parts[k] : parts[k];
    stack.forEach(list => list.forEach(r => {
      if (!r.macro && r.mustBeDir && r.states.length && matches(r, d, parts[k], true))
        notes.push(r.source + ':' + r.line + ' ("' + r.text + '") matches the parent directory ' + d + '/, but git attributes are not inherited by the files inside, so it does not apply to this path. To cover the content, use "' + r.pattern + '/**".');
    }));
  }
  return { path: p + (isDir ? '/' : ''), attrs, notes };
}
const ruleOf = r => ({ source: r.source, line: r.line, text: r.text });
const stateWord = s => s === true ? 'set' : s === false ? 'unset' : s === null ? 'unspecified' : s;

// What the attributes do, in plain English (the parts that change git or GitHub behaviour).
function effects(attrs) {
  const g = n => attrs[n] ? attrs[n].state : undefined;
  const out = [];
  const text = g('text'), eol = g('eol'), crlf = g('crlf');
  if (text === false) out.push('Line endings: never converted (-text).');
  else if (text === 'auto') out.push('Line endings: git decides from the content; if it is text, stored with LF in the repository' + (eol === 'crlf' ? ', checked out with CRLF.' : eol === 'lf' ? ', checked out with LF.' : ', checked out with the platform default (core.eol / core.autocrlf).'));
  else if (text === true || ((text === undefined || text === null) && (eol === 'lf' || eol === 'crlf'))) out.push('Line endings: always treated as text, stored with LF in the repository' + (eol === 'crlf' ? ', checked out with CRLF.' : eol === 'lf' ? ', checked out with LF.' : ', checked out with the platform default (core.eol / core.autocrlf).'));
  else if (typeof text === 'string') out.push('Line endings: text=' + text + ' is not a known value; git treats the file as if text were unspecified.');
  else if (crlf !== undefined && crlf !== null) out.push('Uses the old "crlf" attribute: prefer "text" / "eol".');
  else out.push('Line endings: not set by .gitattributes; core.autocrlf decides.');
  const diff = g('diff');
  if (diff === false) out.push('Diffs: shown as "Binary files differ".');
  else if (typeof diff === 'string') out.push('Diffs: use the "' + diff + '" diff driver (diff.' + diff + '.* in git config).');
  const merge = g('merge');
  if (merge === false) out.push('Merges: never merged line by line; a conflict keeps the current version and marks a conflict.');
  else if (merge === 'union') out.push('Merges: union merge, both sides\' lines are kept without conflict markers.');
  else if (merge === 'binary') out.push('Merges: treated as binary (keep current version, mark conflict).');
  else if (typeof merge === 'string' && merge !== 'text') out.push('Merges: use the "' + merge + '" merge driver.');
  const filter = g('filter');
  if (filter === 'lfs') out.push('Stored with Git LFS (the repository keeps a small pointer; needs git-lfs installed).');
  else if (typeof filter === 'string') out.push('Content goes through the "' + filter + '" filter (filter.' + filter + '.clean/smudge in git config).');
  if (g('export-ignore') === true) out.push('Left out of git archive and of GitHub "Download ZIP" / release source archives.');
  if (g('export-subst') === true) out.push('$Format:...$ placeholders are expanded by git archive.');
  if (g('ident') === true) out.push('$Id$ is replaced by the blob id on checkout.');
  const wte = g('working-tree-encoding');
  if (typeof wte === 'string') out.push('Checked out in ' + wte + ', stored as UTF-8 in the repository.');
  const ws = g('whitespace');
  if (ws === false) out.push('git diff/apply do not flag whitespace errors.');
  else if (typeof ws === 'string') out.push('Whitespace checks: ' + ws + '.');
  const lg = n => { const v = g(n); return v === true || v === 'true' ? true : v === false || v === 'false' ? false : undefined; };
  if (lg('linguist-vendored')) out.push('GitHub: counted as vendored code, excluded from the language bar.');
  if (lg('linguist-vendored') === false) out.push('GitHub: not treated as vendored (counted in the language bar).');
  if (lg('linguist-generated')) out.push('GitHub: marked as generated, excluded from the language bar and collapsed in pull request diffs.');
  if (lg('linguist-generated') === false) out.push('GitHub: not treated as generated.');
  if (lg('linguist-documentation')) out.push('GitHub: counted as documentation, excluded from the language bar.');
  if (lg('linguist-detectable')) out.push('GitHub: counted in the language bar even if its language is usually hidden.');
  if (lg('linguist-detectable') === false) out.push('GitHub: excluded from the language bar.');
  const ll = g('linguist-language');
  if (typeof ll === 'string') out.push('GitHub: highlighted and counted as ' + ll + '.');
  return out;
}

const KNOWN = ['text', 'eol', 'crlf', 'diff', 'merge', 'filter', 'binary', 'export-ignore', 'export-subst', 'ident', 'whitespace', 'working-tree-encoding', 'delta', 'encoding', 'conflict-marker-size',
  'linguist-vendored', 'linguist-generated', 'linguist-documentation', 'linguist-detectable', 'linguist-language', 'lockable', 'lfs'];

function describeRule(r, macros) {
  const states = r.states.map(s => s.state === true ? s.name : s.state === false ? '-' + s.name : s.state === null ? '!' + s.name : s.name + '=' + s.state);
  if (r.macro) return 'Defines the macro "' + r.macro + '": writing "' + r.macro + '" after a pattern sets ' + (states.join(' ') || 'nothing') + '.';
  let where;
  if (r.noDir) where = (r.mustBeDir ? 'directories' : 'files and directories') + ' whose name matches "' + r.pattern + '" at any depth' + (r.base ? ' under ' + r.base : '');
  else where = (r.mustBeDir ? 'the directory' : 'paths matching') + ' "' + r.pattern.replace(/^\//, '') + '" relative to ' + (r.base || 'the repository root');
  return 'For ' + where + ': ' + (r.states.map(s => (s.state === true ? 'set ' + s.name : s.state === false ? 'unset ' + s.name : s.state === null ? 'reset ' + s.name + ' to unspecified' : s.name + ' = ' + s.state) + (macros[s.name] && s.state === true ? ' (macro: ' + macros[s.name] + ')' : '')).join(', ') || 'nothing (no attribute)') + '.';
}

function explain(c) {
  const out = [];
  const macros = { binary: '-diff -merge -text' };
  const all = [].concat(c.byDir[''] || [], c.info);
  all.forEach(r => { if (r.macro) macros[r.macro] = r.states.map(s => s.state === true ? s.name : s.state === false ? '-' + s.name : s.state === null ? '!' + s.name : s.name + '=' + s.state).join(' '); });
  const lists = Object.keys(c.byDir).sort().map(d => c.byDir[d]).concat([c.info]);
  lists.forEach(list => list.forEach(r => {
    const w = [];
    const st = n => { const s = r.states.find(x => x.name === n); return s ? s.state : undefined; };
    if (r.mustBeDir) w.push('A pattern ending with "/" only matches the directory itself, never the files inside: attributes are not inherited. Use "' + (r.pattern) + '/**" to target its content.');
    if (!r.states.length) w.push('No attribute after the pattern: this line does nothing.');
    if (st('filter') === 'lfs' && st('text') !== false) w.push('Git LFS files should also have "-text" (git lfs track writes "filter=lfs diff=lfs merge=lfs -text"), or line-ending conversion can corrupt them.');
    const eol = st('eol');
    if (eol !== undefined && eol !== 'lf' && eol !== 'crlf') w.push('eol only accepts "lf" or "crlf".');
    const t = st('text');
    if (typeof t === 'string' && t !== 'auto') w.push('text only accepts "auto" as a value (text=' + t + ' is ignored by git).');
    if (st('crlf') !== undefined) w.push('"crlf" is the old name: use text / eol instead.');
    if (t === false && (eol === 'lf' || eol === 'crlf')) w.push('eol has no effect with -text.');
    r.states.forEach(s => {
      if (/^linguist-(vendored|generated|documentation|detectable)$/.test(s.name) && typeof s.state === 'string' && s.state !== 'true' && s.state !== 'false') w.push(s.name + ' expects no value, "true" or "false".');
      if (/\.[A-Za-z0-9]+$/.test(s.name) && s.state === true && KNOWN.indexOf(s.name) < 0 && !macros[s.name]) w.push('"' + s.name + '" looks like a file name, not an attribute. If the pattern has spaces, put it in double quotes: "' + (r.pattern || '') + ' ' + s.name + '".');
    });
    if (r.states.some(s => s.name.startsWith('builtin_'))) w.push('Attribute names starting with "builtin_" are reserved: recent git versions ignore this whole line.');
    if (!r.macro && r.pattern && /^\*\*\/[^/]+$/.test(r.pattern)) w.push('"**/" in front is useless: a pattern without "/" already matches at any depth.');
    out.push({ source: r.source, line: r.line, text: r.text, meaning: describeRule(r, macros), warnings: w });
  }));
  c.problems.forEach(p => out.push({ source: p.source, line: p.line, text: p.text, meaning: 'Ignored by git.', warnings: [p.problem] }));
  out.sort((a, b) => a.source < b.source ? -1 : a.source > b.source ? 1 : a.line - b.line);
  return out;
}

module.exports = { OPTIONS, wildmatch, parseFile, compile, check, effects, explain, stateWord, KNOWN };
