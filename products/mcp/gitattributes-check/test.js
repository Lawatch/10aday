'use strict';
// Oracle test: random .gitattributes files and trees, compared with the real `git check-attr -a`.
// Usage: node test.js [rounds] [seed]
const fs = require('fs'), os = require('os'), path = require('path'), cp = require('child_process');
const E = require('./engine.js');
const ROUNDS = +(process.argv[2] || 300);
let seed = +(process.argv[3] || 12345);
function mulberry() { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }
const rnd = n => Math.floor(mulberry() * n);
const pick = a => a[rnd(a.length)];
const NAMES = ['a', 'b', 'ab', 'x.txt', 'y.bin', 'img.png', 'build', 'dist', 'doc.pdf', '.env', 'src', 'logs', 'a b', 'A', 'n1', '[a]', 'gen.js', '#c', '!x', 'q"t'];
const TOK = ['a', 'b', '*', '**', '?', '[ab]', '[!a]', '[a-c]', '[[:digit:]]', 'x', '*.txt', '*.bin', '*.png', 'build', 'logs', 'src', '.pdf', '\\*', 'n[0-9]', '.env', '*b', 'a*', '\\!x', '\\#c'];
const ATTRS = ['text', '-text', '!text', 'text=auto', 'eol=lf', 'eol=crlf', 'binary', '-binary', 'foo', '-foo', '!foo', 'foo=1', 'bar', '-bar=3', 'm1', '-m1', 'm1=x', 'm2', 'diff', '-diff', 'merge=union',
  'filter=lfs', 'linguist-generated', 'linguist-vendored=false', 'export-ignore', 'diff=png', 'zz=a=b', 'm1', 'binary'];
const BAD = ['a^b', '-', '--x', 'builtin_x', 'é', '!-x'];
function mutate(seg) {
  switch (rnd(8)) {
    case 0: return '*';
    case 1: return seg.length > 1 ? seg.slice(0, 1) + '*' : seg;
    case 2: return '*' + seg.slice(-1);
    case 3: return seg.replace(/[a-z]/, '?');
    case 4: return seg.replace(/[a-z]/, c => '[' + c + 'z]');
    case 5: return seg.replace(/[*\[\]?\\]/g, c => '\\' + c);
    case 6: return pick(TOK);
    default: return seg;
  }
}
const cquote = s => '"' + s.replace(/[\\"]/g, c => '\\' + c).replace(/ /g, () => rnd(3) ? ' ' : '\\040') + '"';
function randPattern(tree) {
  let segs;
  if (rnd(4) === 0) { segs = []; const n = 1 + rnd(3); for (let i = 0; i < n; i++) { let s = ''; const k = 1 + rnd(2); for (let j = 0; j < k; j++) s += pick(TOK); segs.push(s); } }
  else {
    const ps = pick(tree).split('/'); const a = rnd(ps.length); const b = a + 1 + rnd(ps.length - a);
    segs = ps.slice(a, b).map(x => rnd(2) ? mutate(x) : x.replace(/^[!]/, c => '\\' + c));
    if (rnd(5) === 0) segs.splice(rnd(segs.length + 1), 0, '**');
  }
  let p = segs.join('/');
  if (rnd(5) === 0) p = '/' + p;
  if (rnd(5) === 0) p = p + '/';
  if (rnd(20) === 0) p = '**/' + p;
  if (rnd(10) === 0) p = p + '/**';
  if (rnd(25) === 0) p = '!' + p;
  if (/[ "]/.test(p) || rnd(15) === 0) p = cquote(p);
  return p;
}
function randLine(tree, root) {
  const r = rnd(30);
  const states = []; const n = rnd(4) + (r ? 1 : 0);
  for (let i = 0; i < n; i++) states.push(rnd(40) ? pick(ATTRS) : pick(BAD));
  if (r === 0) return '# ' + randPattern(tree);
  if (r < 4) return '[attr]' + pick(['m1', 'm2', 'binary', 'm1']) + ' ' + states.join(' ');
  if (r === 4) return '';
  return (rnd(8) ? '' : pick([' ', '\t'])) + randPattern(tree) + (rnd(6) ? ' ' : '\t') + states.join(rnd(5) ? ' ' : '  ') + (rnd(10) ? '' : ' ');
}
function randTree() {
  const files = new Set(); const n = 6 + rnd(12);
  for (let i = 0; i < n; i++) { const d = 1 + rnd(4); const parts = []; for (let j = 0; j < d; j++) parts.push(pick(NAMES)); files.add(parts.join('/')); }
  const all = [...files]; return all.filter(f => !all.some(g => g.startsWith(f + '/')));
}
// Does this git reserve "builtin_*" names? Probe it, and align the engine (the default follows recent git).
{
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'gacp-'));
  cp.execSync('git init -q', { cwd: d }); fs.writeFileSync(path.join(d, '.gitattributes'), '* builtin_zz ok\n');
  const o = cp.spawnSync('git', ['check-attr', 'ok', '--', 'f'], { cwd: d }).stdout.toString();
  E.OPTIONS.reserveBuiltin = !/ok: set/.test(o);
  fs.rmSync(d, { recursive: true, force: true });
}
const fmt = s => s === true ? 'set' : s === false ? 'unset' : s;
let total = 0, bad = 0, attrsSeen = 0; const stat = { macro: 0, nested: 0, info: 0 };
const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'gac-'));
for (let r = 0; r < ROUNDS; r++) {
  const dir = path.join(tmpRoot, 'r' + r);
  fs.mkdirSync(dir); cp.execSync('git init -q', { cwd: dir });
  const tree = randTree(); const dirs = new Set();
  tree.forEach(f => { const ps = f.split('/'); for (let k = 1; k < ps.length; k++) dirs.add(ps.slice(0, k).join('/')); });
  const files = {};
  [''].concat([...dirs].filter(() => rnd(3) === 0)).forEach(d => {
    const lines = []; const n = 1 + rnd(7);
    for (let i = 0; i < n; i++) lines.push(randLine(tree, d === ''));
    files[(d ? d + '/' : '') + '.gitattributes'] = lines.join(rnd(6) === 0 ? '\r\n' : '\n') + (rnd(3) ? '\n' : '');
  });
  if (rnd(5) === 0) files['.git/info/attributes'] = [randLine(tree, true), randLine(tree, true)].join('\n') + '\n';
  tree.forEach(f => { fs.mkdirSync(path.join(dir, path.dirname(f)), { recursive: true }); fs.writeFileSync(path.join(dir, f), 'x'); });
  Object.keys(files).forEach(f => { fs.mkdirSync(path.join(dir, path.dirname(f)), { recursive: true }); fs.writeFileSync(path.join(dir, f), files[f]); });
  const queries = tree.concat([...dirs].map(d => rnd(2) ? d + '/' : d));
  const res = cp.spawnSync('git', ['-c', 'core.attributesFile=/dev/null', 'check-attr', '-a', '-z', '--stdin'], { cwd: dir, input: queries.join('\0') + '\0', env: Object.assign({}, process.env, { GIT_ATTR_NOSYSTEM: '1' }) });
  const out = res.stdout.toString().split('\0');
  const want = {}; queries.forEach(q => want[q] = {});
  for (let i = 0; i + 2 < out.length; i += 3) { if (!want[out[i]]) throw new Error('unexpected path ' + out[i]); if (!out[i + 1].startsWith('builtin_') || /^builtin_x$/.test(out[i + 1])) want[out[i]][out[i + 1]] = out[i + 2]; }
  const c = E.compile(files);
  for (const q of queries) {
    const got = {}; const a = E.check(c, q).attrs;
    Object.keys(a).forEach(n => { if (a[n].state !== null) got[n] = fmt(a[n].state); if (a[n].via_macro) stat.macro++; if (a[n].rule.source !== '.gitattributes') stat[a[n].rule.source === '.git/info/attributes' ? 'info' : a[n].rule.source === '(built-in)' ? 'macro' : 'nested']++; });
    total++; attrsSeen += Object.keys(want[q]).length;
    const w = JSON.stringify(Object.keys(want[q]).sort().map(k => [k, want[q][k]])), g = JSON.stringify(Object.keys(got).sort().map(k => [k, got[k]]));
    if (w !== g) { bad++; if (bad <= 8) console.log('MISMATCH', JSON.stringify({ path: q, want: want[q], got, files })); }
  }
}
fs.rmSync(tmpRoot, { recursive: true, force: true });
console.log(total + ' paths compared with git ' + cp.execSync('git --version').toString().trim().split(' ')[2] + (E.OPTIONS.reserveBuiltin ? ' [reserves builtin_*]' : '') + ' (' + attrsSeen + ' attribute values), ' + bad + ' differences (via macro ' + stat.macro + ', nested file ' + stat.nested + ', info/attributes ' + stat.info + ')');
process.exit(bad ? 1 : 0);
