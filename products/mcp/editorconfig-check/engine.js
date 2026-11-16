'use strict';
// EditorConfig engine, no dependency. Follows the reference JavaScript core (npm "editorconfig" 4.x, used by
// Prettier, VS Code's extension and many editors): same .editorconfig parser (one-ini), same globs, same merge order,
// same post-processing. Checked against it by test.js.

// ---------- Parser (one-ini rules, as seen in the reference core) ----------
const isWs = c => c === ' ' || c === '\t';
function trimWs(s) { let a = 0, b = s.length; while (a < b && isWs(s[a])) a++; while (b > a && isWs(s[b - 1])) b--; return s.slice(a, b); }

// -> { sections: [{ name, line, props: [{key, value, line, raw}] }], preamble: [{key, value, line}], error: {line, text} | null }
function parseFile(text) {
  text = String(text);
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
  const lines = text.split(/\r\n|\n/);
  const preamble = [], sections = [];
  let cur = null, error = null;
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i], l = trimWs(raw);
    if (l === '' || l[0] === '#' || l[0] === ';') continue;
    if (l[0] === '[' && l[l.length - 1] === ']' && l.length >= 3) {
      cur = { name: l.slice(1, -1), line: i + 1, props: [] }; sections.push(cur); continue;
    }
    const eq = l.indexOf('=');
    const key = eq > 0 ? trimWs(l.slice(0, eq)) : '';
    if (eq < 0 || key === '') { error = { line: i + 1, text: raw }; break; } // the reference parser drops everything from here
    const p = { key, value: trimWs(l.slice(eq + 1)), line: i + 1, raw };
    (cur ? cur.props : preamble).push(p);
  }
  return { preamble, sections, error };
}

// ---------- Globs ----------
// Brace expansion: port of the "brace-expansion" + "balanced-match" packages used by the reference core (bash rules:
// {a,b}, nesting, {1..5}, {a..e}, {01..10}, steps, the "{a},b}" quirk, \{ \} \, \. escapes).
const ESC = { slash: '\0S\0', open: '\0O\0', close: '\0C\0', comma: '\0M\0', period: '\0P\0' };
function range(str) {
  let begs, beg, left, right, result;
  let ai = str.indexOf('{'), bi = str.indexOf('}', ai + 1), i = ai;
  if (ai >= 0 && bi > 0) {
    begs = []; left = str.length;
    while (i >= 0 && !result) {
      if (i === ai) { begs.push(i); ai = str.indexOf('{', i + 1); }
      else if (begs.length === 1) result = [begs.pop(), bi];
      else { beg = begs.pop(); if (beg < left) { left = beg; right = bi; } bi = str.indexOf('}', i + 1); }
      i = ai < bi && ai >= 0 ? ai : bi;
    }
    if (begs.length && right !== undefined) result = [left, right];
  }
  return result;
}
function balanced(str) { const r = range(str); return r && { pre: str.slice(0, r[0]), body: str.slice(r[0] + 1, r[1]), post: str.slice(r[1] + 1) }; }
function commaParts(str) {
  if (!str) return [''];
  const m = balanced(str);
  if (!m) return str.split(',');
  const p = m.pre.split(',');
  p[p.length - 1] += '{' + m.body + '}';
  const postParts = commaParts(m.post);
  if (m.post.length) { p[p.length - 1] += postParts.shift(); p.push(...postParts); }
  return p;
}
const numeric = s => !isNaN(s) ? parseInt(s, 10) : s.charCodeAt(0);
function seq(body, alpha) {
  const n = body.split(/\.\./), x = numeric(n[0]), y = numeric(n[1]), width = Math.max(n[0].length, n[1].length);
  let incr = n.length === 3 ? Math.max(Math.abs(numeric(n[2])), 1) : 1;
  const reverse = y < x; if (reverse) incr *= -1;
  const pad = n.some(el => /^-?0\d/.test(el)), N = [];
  for (let i = x; reverse ? i >= y : i <= y; i += incr) {
    if (N.length > 20000) throw new Error('glob expands to too many alternatives');
    let c;
    if (alpha) { c = String.fromCharCode(i); if (c === '\\') c = ''; }
    else {
      c = String(i);
      if (pad) { const need = width - c.length; if (need > 0) { const z = '0'.repeat(need); c = i < 0 ? '-' + z + c.slice(1) : z + c; } }
    }
    N.push(c);
  }
  return N;
}
function expand_(str, depth) {
  if (depth > 50) return [str];
  const m = balanced(str);
  if (!m) return [str];
  const post = m.post.length ? expand_(m.post, depth + 1) : [''];
  if (/\$$/.test(m.pre)) return post.map(p => m.pre + '{' + m.body + '}' + p);
  const isNum = /^-?\d+\.\.-?\d+(?:\.\.-?\d+)?$/.test(m.body), isAlpha = /^[a-zA-Z]\.\.[a-zA-Z](?:\.\.-?\d+)?$/.test(m.body);
  const isSeq = isNum || isAlpha, isOpt = m.body.indexOf(',') >= 0;
  if (!isSeq && !isOpt) {
    if (/,(?!,).*\}/.test(m.post)) return expand_(m.pre + '{' + m.body + ESC.close + m.post, depth + 1);
    return [str];
  }
  let N;
  if (isSeq) N = seq(m.body, isAlpha);
  else {
    let n = commaParts(m.body);
    if (n.length === 1) {
      n = expand_(n[0], depth + 1).map(s => '{' + s + '}');
      if (n.length === 1) return post.map(p => m.pre + n[0] + p);
    }
    N = [];
    n.forEach(x => N.push(...expand_(x, depth + 1)));
  }
  const out = [];
  for (const a of N) for (const p of post) { out.push(m.pre + a + p); if (out.length > 20000) throw new Error('glob expands to too many alternatives'); }
  return out;
}
function expandBraces(str) {
  if (!str) return [];
  if (str.slice(0, 2) === '{}') str = '\\{\\}' + str.slice(2);
  str = str.split('\\\\').join(ESC.slash).split('\\{').join(ESC.open).split('\\}').join(ESC.close).split('\\,').join(ESC.comma).split('\\.').join(ESC.period);
  return expand_(str, 0).map(s => s.split(ESC.slash).join('\\').split(ESC.open).join('{').split(ESC.close).join('}').split(ESC.comma).join(',').split(ESC.period).join('.'));
}

// One alternative (no braces) -> RegExp source, minimatch rules with dot:true. Segments split on "/".
const POSIX = { alnum: 'a-zA-Z0-9', alpha: 'a-zA-Z', ascii: '\\x00-\\x7f', blank: ' \\t', cntrl: '\\x00-\\x1f\\x7f', digit: '0-9',
  graph: '\\x21-\\x7e', lower: 'a-z', print: '\\x20-\\x7e', punct: '!-\\/:-@\\[-`{-~', space: ' \\t\\r\\n\\v\\f', upper: 'A-Z', word: '\\w', xdigit: 'A-Fa-f0-9' };
const reEsc = c => c.replace(/[\\^$.*+?()[\]{}|\/-]/g, '\\$&');
function classAt(seg, i) {
  // seg[i] === '['; returns [regexSource, nextIndex] or null if not a valid class
  let j = i + 1, neg = false, out = '';
  if (seg[j] === '!' || seg[j] === '^') { neg = true; j++; }
  let first = true;
  while (j < seg.length) {
    const c = seg[j];
    if (c === ']' && !first) { if (!out) return null; return ['(?:(?!\\/)[' + (neg ? '^' : '') + out + '])', j + 1]; }
    first = false;
    if (c === '[' && seg[j + 1] === ':') {
      const k = seg.indexOf(':]', j + 2);
      if (k > 0 && POSIX[seg.slice(j + 2, k)] !== undefined) { out += POSIX[seg.slice(j + 2, k)]; j = k + 2; continue; }
    }
    let ch = c;
    if (c === '\\') { if (j + 1 >= seg.length) return null; ch = seg[++j]; }
    if (seg[j + 1] === '-' && seg[j + 2] !== undefined && seg[j + 2] !== ']') {
      let hi = seg[j + 2], adv = 3;
      if (hi === '\\') { hi = seg[j + 3]; adv = 4; if (hi === undefined) return null; }
      if (hi < ch) return null;
      out += reEsc(ch) + '-' + reEsc(hi); j += adv; continue;
    }
    out += reEsc(ch); j++;
  }
  return null;
}
function segmentRe(seg) {
  if (seg === '**') return null; // globstar
  let re = '', hasMagic = false;
  for (let i = 0; i < seg.length; i++) {
    const c = seg[i];
    if (c === '\\') { if (i + 1 < seg.length) re += reEsc(seg[++i]); else re += '\\\\'; continue; }
    if (c === '*') { while (seg[i + 1] === '*') i++; re += '[^/]*?'; hasMagic = true; continue; }
    if (c === '?') { re += '[^/]'; hasMagic = true; continue; }
    if (c === '[') { const k = classAt(seg, i); if (k) { re += k[0]; i = k[1] - 1; hasMagic = true; continue; } re += '\\['; continue; }
    re += reEsc(c);
  }
  return re;
}
function altRe(alt) {
  const segs = alt.replace(/\/{2,}/g, '/').split('/'); // like minimatch, repeated slashes count as one
  let re = '';
  segs.forEach((seg, k) => {
    const last = k === segs.length - 1, s = segmentRe(seg);
    if (s === null) re += last ? '.*' : '(?:[^/]*\\/)*?'; // globstar: zero or more whole segments
    else re += s + (last ? '' : '\\/');
  });
  return re;
}

// Section name -> matcher for paths relative to the directory of the .editorconfig file.
function hasParentDir(glob) {
  return glob.split('/').some(part => { let n = ''; for (let i = 0; i < part.length; i++) { if (part[i] === '\\') i++; else n += part[i]; } return n === '..'; });
}
function compileGlob(name) {
  if (!name || hasParentDir(name)) return null;
  let g = name;
  const slash = g.indexOf('/');
  if (slash < 0) g = '**/' + g; else if (slash === 0) g = g.slice(1);
  g = g.replace(/\\\\/g, '\\\\\\\\');
  g = g.replace(/\*\*/g, '{*,**/**/**}');
  const alts = expandBraces('/' + g).map(a => a.slice(1)); // the reference expands "<dir>/<glob>": never a leading "{}"
  const res = alts.map(a => new RegExp('^' + altRe(a) + '$'));
  return rel => res.some(r => r.test(rel));
}

// ---------- Properties ----------
const KNOWN = ['charset', 'end_of_line', 'indent_size', 'indent_style', 'insert_final_newline', 'trim_trailing_whitespace'];
function normValue(key, value) {
  const str = KNOWN.includes(key) ? String(value).toLowerCase() : String(value);
  let v = str;
  try { v = JSON.parse(str); } catch (_e) { /* plain string */ }
  if (v === undefined || v === null) v = str;
  return v;
}

// Like the reference core: a key written twice with the exact same spelling keeps its first place and its last value;
// then keys are lower-cased in that order, so "Indent_Style" can override a later "indent_style".
function effective(props) {
  const m = new Map();
  props.forEach(p => m.set(p.key, p));
  return [...m.values()];
}

// files: { ".editorconfig": "...", "src/.editorconfig": "..." } -> compiled set
function compile(files) {
  const byDir = {};
  Object.keys(files || {}).forEach(f => {
    const norm = f.replace(/\\/g, '/').replace(/^\.\//, '').replace(/^\/+/, '');
    if (norm !== '.editorconfig' && !norm.endsWith('/.editorconfig')) throw new Error('not an .editorconfig file name: ' + f + ' (use ".editorconfig" or "dir/.editorconfig")');
    const dir = norm.slice(0, norm.length - '.editorconfig'.length);
    const parsed = parseFile(files[f]);
    const rootProp = effective(parsed.preamble).filter(p => p.key.toLowerCase() === 'root').pop();
    byDir[dir] = { source: norm, dir, parsed, root: !!(rootProp && normValue('root', rootProp.value)),
      sections: parsed.sections.map(s => ({ name: s.name, line: s.line, props: s.props, match: compileGlob(s.name) })) };
  });
  return byDir;
}

function normPath(p) {
  p = String(p).replace(/\\/g, '/').replace(/^\.\//, '').replace(/^\/+/, '');
  if (!p || p.endsWith('/')) throw new Error('give a file path, not a directory: ' + JSON.stringify(p));
  return p;
}

// -> { path, properties: {k: v}, decided_by: {k: {source, section, line, raw}}, sections: [{source, section, line}], files_read: [...], stopped_at_root }
function check(byDir, rawPath, opts) {
  opts = opts || {};
  const path = normPath(rawPath);
  const parts = path.split('/');
  const chain = [];
  for (let k = parts.length - 1; k >= 0; k--) {
    const dir = parts.slice(0, k).join('/') + (k ? '/' : '');
    const f = byDir[dir];
    if (f) { chain.push(f); if (f.root) break; }
  }
  const props = Object.create(null), by = Object.create(null), matched = [];
  chain.slice().reverse().forEach(f => {
    const rel = path.slice(f.dir.length);
    f.sections.forEach(s => {
      if (!s.match || !s.match(rel)) return;
      matched.push({ source: f.source, section: '[' + s.name + ']', line: s.line });
      effective(s.props).forEach(p => {
        const k = p.key.toLowerCase();
        props[k] = normValue(k, p.value);
        by[k] = { source: f.source, section: '[' + s.name + ']', line: p.line, text: p.raw.trim() };
      });
    });
  });
  const derived = {};
  if (opts.unset !== false) Object.keys(props).forEach(k => { if (props[k] === 'unset') { delete props[k]; derived[k] = 'removed: set to "unset"'; } });
  if (props.indent_style === 'tab' && !('indent_size' in props)) { props.indent_size = 'tab'; derived.indent_size = 'set to "tab" because indent_style = tab'; }
  if ('indent_size' in props && !('tab_width' in props) && props.indent_size !== 'tab') { props.tab_width = props.indent_size; derived.tab_width = 'copied from indent_size'; }
  if ('indent_size' in props && 'tab_width' in props && props.indent_size === 'tab') { props.indent_size = props.tab_width; derived.indent_size = 'copied from tab_width because indent_size = tab'; }
  return { path, properties: props, decided_by: by, derived, sections: matched, files_read: chain.map(f => f.source), stopped_at_root: chain.length && chain[chain.length - 1].root ? chain[chain.length - 1].source : null };
}

// ---------- Lint ----------
const VALUES = {
  indent_style: v => v === 'tab' || v === 'space',
  indent_size: v => v === 'tab' || (Number.isInteger(v) && v > 0),
  tab_width: v => Number.isInteger(v) && v > 0,
  end_of_line: v => ['lf', 'cr', 'crlf'].includes(v),
  charset: v => ['latin1', 'utf-8', 'utf-8-bom', 'utf-16be', 'utf-16le'].includes(v),
  trim_trailing_whitespace: v => v === true || v === false,
  insert_final_newline: v => v === true || v === false,
  max_line_length: v => v === 'off' || (Number.isInteger(v) && v > 0),
  spelling_language: v => typeof v === 'string' && /^[a-z]{2}(-[A-Z]{2})?$/.test(v)
};
const HINT = {
  indent_style: '"tab" or "space"', indent_size: 'a positive whole number or "tab"', tab_width: 'a positive whole number',
  end_of_line: '"lf", "crlf" or "cr"', charset: '"utf-8", "utf-8-bom", "latin1", "utf-16be" or "utf-16le"',
  trim_trailing_whitespace: '"true" or "false"', insert_final_newline: '"true" or "false"', max_line_length: 'a positive whole number or "off"',
  spelling_language: 'a language code like "en" or "en-US"'
};
const COMMON = Object.keys(VALUES).concat(['root']);
function lev(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}
function lint(byDir) {
  const out = [];
  Object.keys(byDir).sort().forEach(dir => {
    const f = byDir[dir], src = f.source, P = f.parsed;
    const add = (line, severity, message) => out.push({ source: src, line, severity, message });
    if (P.error) add(P.error.line, 'error', 'Line not understood: ' + JSON.stringify(P.error.text.trim()) + '. It is neither "key = value", a [section] nor a comment, and editors stop reading the file here: every line below it is ignored.');
    P.preamble.forEach(p => {
      const k = p.key.toLowerCase();
      if (k === 'root') { if (!['true', 'false'].includes(p.value.toLowerCase())) add(p.line, 'error', 'root must be "true" or "false".'); }
      else add(p.line, 'warning', '"' + p.key + '" is before any [section], so it applies to no file. Only "root" belongs there.');
    });
    if (dir === '' && !f.root) add(1, 'info', 'No "root = true" at the top: editors keep looking for .editorconfig files in parent folders (outside the project), which can change the result on another machine.');
    f.sections.forEach(s => {
      if (s.props.some(p => p.key.toLowerCase() === 'root')) add(s.line, 'warning', '"root" inside a section has no effect: put "root = true" at the very top, before any [section].');
      if (!s.match) add(s.line, 'warning', 'Section [' + s.name + '] can never match: a ".." in a glob cannot point outside the folder of this file.');
      if (s.name !== s.name.trim()) add(s.line, 'warning', 'Section [' + s.name + '] has spaces inside the brackets; they are part of the glob, so it only matches names with those spaces.');
      if (/\{[^{},]*\}/.test(s.name.replace(/\{-?\d+\.\.-?\d+\}/g, '').replace(/\{[a-zA-Z]\.\.[a-zA-Z]\}/g, ''))) add(s.line, 'warning', 'Section [' + s.name + '] has braces with a single choice, like {js}: they are taken literally. Write *.js, or {js,ts} with at least two choices.');
      s.props.forEach(p => {
        const k = p.key.toLowerCase(), v = normValue(k, p.value);
        if (VALUES[k]) {
          if (p.value.toLowerCase() === 'unset') return;
          if (!VALUES[k](v)) {
            let msg = k + ' = ' + JSON.stringify(p.value) + ' is not valid: use ' + HINT[k] + '.';
            if (/\s[#;]/.test(p.value)) msg += ' Comments are not allowed at the end of a line: "' + p.value.replace(/\s*[#;].*$/, '') + '" plus the comment is read as one value.';
            add(p.line, 'error', msg);
          }
          return;
        }
        if (k === 'root') return;
        const near = COMMON.filter(c => lev(c, k) <= 2).sort((a, b) => lev(a, k) - lev(b, k))[0];
        if (near) add(p.line, 'warning', 'Unknown property "' + p.key + '". Did you mean "' + near + '"?');
      });
      const ks = s.props.map(p => p.key.toLowerCase());
      ks.forEach((k, i) => { if (ks.indexOf(k) !== i) add(s.props[i].line, 'info', '"' + k + '" is set twice in [' + s.name + ']; the last one wins.'); });
    });
  });
  return out;
}

module.exports = { parseFile, compileGlob, expandBraces, compile, check, lint, normValue };
