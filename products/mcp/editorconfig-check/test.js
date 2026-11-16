'use strict';
// Oracle test: random .editorconfig files and paths, compared with the reference JavaScript core (npm "editorconfig").
// Usage: ORACLE=<dir with node_modules/editorconfig> node test.js [rounds] [seed]
//        node test.js --fixtures   (replay recorded answers, no network)
//        ORACLE=... node test.js --record N   (write fixtures.json)
const fs = require('fs'), path = require('path');
const E = require('./engine.js');
const args = process.argv.slice(2);
let seed = 4242;
function mulberry() { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }
const rnd = n => Math.floor(mulberry() * n);
const pick = a => a[rnd(a.length)];
const NAMES = ['a', 'b', 'ab', 'x.js', 'y.ts', 'm.min.js', 'Makefile', 'README.md', 'src', 'Src', 'lib', 'test', 'f1', 'f2', 'f10', '.env', 'a b', 'k.json', 'c.yml', '[x]', 'q,r', 'n-1'];
const TOK = ['*', '**', '?', '*.js', '*.{js,ts}', '{a,b}', '{src,lib}', '[ab]', '[!a]', '[^b]', '[a-c]', '[[:digit:]]', 'f{1..3}', 'f{1..10}', 'f{01..10}', '{x,y,{a,b}}', 'x', 'src', 'lib', 'test', '.js', 'Makefile', '\\*', '\\[x]', '{js}', '{}', 'a{b}', '[x]', '*.min.js', 'a\\{b}', '{a..c}', '.env', '*.md', '{f1,f2', 'q,r', '{q\\,r,z}', 'n-1', '{-1..1}', '[]a]', '[a-]', '..', 'a b'];
function randGlob(paths) {
  let g;
  if (rnd(3) === 0) {
    const ps = pick(paths).split('/'); const a = rnd(ps.length); const segs = ps.slice(a, a + 1 + rnd(ps.length - a));
    g = segs.map(s => rnd(3) ? s.replace(/[[\]{}*?\\,]/g, c => rnd(2) ? '\\' + c : c) : pick(TOK)).join('/');
  } else {
    const n = 1 + rnd(3), segs = [];
    for (let i = 0; i < n; i++) { let s = ''; const k = 1 + rnd(2); for (let j = 0; j < k; j++) s += pick(TOK); segs.push(s); }
    g = segs.join('/');
  }
  if (rnd(6) === 0) g = '/' + g;
  if (rnd(10) === 0) g = '**/' + g;
  return g;
}
const KEYS = ['indent_style', 'indent_size', 'tab_width', 'end_of_line', 'charset', 'trim_trailing_whitespace', 'insert_final_newline', 'max_line_length', 'Indent_Style', 'quote_type', 'root'];
const VALS = ['tab', 'space', '2', '4', '8', 'TAB', 'Space', 'lf', 'CRLF', 'utf-8', 'true', 'false', 'True', 'unset', 'off', '80', '1e2', '"x"', '[1]', 'null', '', '4 # comment', 'a=b', 'single'];
function randFile(paths, top) {
  const L = [];
  if (rnd(3) === 0) L.push('root = ' + pick(['true', 'false', 'TRUE', 'yes']));
  if (rnd(8) === 0) L.push(pick(KEYS) + ' = ' + pick(VALS));
  const ns = 1 + rnd(4);
  for (let s = 0; s < ns; s++) {
    L.push((rnd(8) === 0 ? '  ' : '') + '[' + randGlob(paths) + ']');
    const np = rnd(4);
    for (let p = 0; p < np; p++) {
      const r = rnd(30);
      if (r === 0) L.push('# comment');
      else if (r === 1) L.push('; comment');
      else if (r === 2 && rnd(3) === 0) L.push(pick(['oops', '=x', '[]', '[x] ; c']));
      else if (r === 3) L.push('');
      else L.push(pick(KEYS) + pick([' = ', '=', '\t=\t', ' =']) + pick(VALS));
    }
  }
  return L.join(rnd(6) === 0 ? '\r\n' : '\n') + (rnd(3) ? '\n' : '');
}
// Names with braces only as file names: the reference core mishandles folder names with braces.
function randCase() {
  const paths = new Set(); const n = 4 + rnd(8);
  for (let i = 0; i < n; i++) { const d = 1 + rnd(4), parts = []; for (let j = 0; j < d; j++) parts.push(pick(j === d - 1 ? NAMES.concat(['a{b}', 'x{1..2}', '{a,b}']) : NAMES)); paths.add(parts.join('/')); }
  const all = [...paths].filter(f => ![...paths].some(g => g.startsWith(f + '/')));
  const dirs = new Set(['']); all.forEach(f => { const ps = f.split('/'); for (let k = 1; k < ps.length; k++) dirs.add(ps.slice(0, k).join('/') + '/'); });
  const files = {};
  [...dirs].forEach(d => { if (d === '' || rnd(3) === 0) files[d + '.editorconfig'] = randFile(all, d === ''); });
  return { files, paths: all };
}
const canon = o => JSON.stringify(Object.keys(o).sort().reduce((a, k) => (a[k] = o[k], a), {}));
function oracle(ec, c) {
  return c.paths.map(p => {
    const ps = p.split('/'), list = [];
    for (let k = ps.length - 1; k >= 0; k--) { const d = ps.slice(0, k).join('/') + (k ? '/' : ''); if (c.files[d + '.editorconfig'] !== undefined) list.push({ name: '/r/' + d + '.editorconfig', contents: Buffer.from(c.files[d + '.editorconfig']) }); }
    const seen = [];
    const props = ec.parseFromFilesSync('/r/' + p, list, { files: seen, unset: true });
    return { props: canon(props), sections: seen.map(s => s.fileName.slice(3) + ' [' + s.glob + ']') };
  });
}
function mine(c) {
  const b = E.compile(c.files);
  return c.paths.map(p => { const r = E.check(b, p); return { props: canon(r.properties), sections: r.sections.map(s => s.source + ' ' + s.section) }; });
}
let total = 0, bad = 0;
function compare(c, want) {
  const got = mine(c);
  want.forEach((w, i) => {
    total++;
    if (w.props !== got[i].props || w.sections.join('|') !== got[i].sections.join('|')) {
      bad++;
      if (bad <= 8) console.log('MISMATCH', JSON.stringify({ path: c.paths[i], want: w, got: got[i], files: c.files }));
    }
  });
}
const FIX = path.join(__dirname, 'fixtures.json');
if (args[0] === '--fixtures') {
  JSON.parse(fs.readFileSync(FIX, 'utf8')).forEach(x => compare(x.c, x.want));
  console.log(total + ' recorded paths replayed, ' + bad + ' differences');
} else {
  const ec = require(path.join(process.env.ORACLE || '.', 'node_modules', 'editorconfig'));
  const ver = require(path.join(process.env.ORACLE || '.', 'node_modules', 'editorconfig', 'package.json')).version;
  if (args[0] === '--record') {
    seed = 777; const out = [];
    for (let r = 0; r < +(args[1] || 300); r++) { const c = randCase(); out.push({ c, want: oracle(ec, c) }); }
    fs.writeFileSync(FIX, JSON.stringify(out));
    console.log('recorded ' + out.length + ' cases');
  } else {
    const rounds = +(args[0] || 2000); if (args[1]) seed = +args[1];
    for (let r = 0; r < rounds; r++) { const c = randCase(); compare(c, oracle(ec, c)); }
    console.log(total + ' paths compared with editorconfig ' + ver + ' (reference core), ' + bad + ' differences');
  }
}
process.exit(bad ? 1 : 0);
