'use strict';
// Oracle test: random .gitignore files and random trees, compared with the real `git check-ignore -v -n --no-index`.
// Usage: node test.js [rounds] [seed]
const fs = require('fs'), os = require('os'), path = require('path'), cp = require('child_process');
const E = require('./engine.js');
const ROUNDS = +(process.argv[2] || 300);
let seed = +(process.argv[3] || 12345);
function mulberry() { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }
const rnd = n => Math.floor(mulberry() * n);
const pick = a => a[rnd(a.length)];
const NAMES = ['a', 'b', 'ab', 'ba', 'abc', 'x.log', 'y.log', 'build', 'dist', 'doc.pdf', '.env', 'keep.txt', 'src', 'logs', 'a b', 'A', 'n1', 'n2', '[a]', 'a*b', '#c', '!x'];
const TOK = ['a', 'b', 'ab', '*', '**', '?', '[ab]', '[!a]', '[^b]', '[a-c]', '[[:digit:]]', '[[:alpha:]]', 'x', '.log', '*.log', 'build', 'logs', 'src', 'doc', '.pdf', '\\*', '\\[a]', 'n[0-9]', '.env', 'keep.txt', 'A', '\\!x', '\\#c', '[]a]', '[a-]', '*b', 'a*'];
function mutate(seg) {
  switch (rnd(9)) {
    case 0: return '*';
    case 1: return seg.length > 1 ? seg.slice(0, 1) + '*' : seg;
    case 2: return '*' + seg.slice(-1);
    case 3: return seg.replace(/[a-z]/, '?');
    case 4: return seg.replace(/[a-z]/, c => '[' + c + 'z]');
    case 5: return seg.replace(/[a-z]/, c => '[!' + c + ']');
    case 6: return seg.replace(/[*\[\]!#?\\ ]/g, c => '\\' + c);
    case 7: return pick(TOK);
    default: return seg;
  }
}
function randPattern(tree) {
  let segs;
  if (rnd(4) === 0) { segs = []; const n = 1 + rnd(3); for (let i = 0; i < n; i++) { let s = ''; const k = 1 + rnd(2); for (let j = 0; j < k; j++) s += pick(TOK); segs.push(s); } }
  else {
    const ps = pick(tree).split('/'); const a = rnd(ps.length); const b = a + 1 + rnd(ps.length - a);
    segs = ps.slice(a, b).map(x => rnd(2) ? mutate(x) : x.replace(/^[#!]/, c => '\\' + c).replace(/ $/, '\\ '));
    if (rnd(5) === 0) segs.splice(rnd(segs.length + 1), 0, '**');
  }
  let p = segs.join('/');
  if (rnd(5) === 0) p = '/' + p;
  if (rnd(5) === 0) p = p + '/';
  if (rnd(4) === 0) p = '!' + p;
  if (rnd(12) === 0) p = p + '  ';
  if (rnd(15) === 0) p = p + '\\ ';
  if (rnd(20) === 0) p = '**/' + p;
  if (rnd(20) === 0) p = p + '/**';
  if (rnd(25) === 0) p = '# ' + p;
  return p;
}
function randTree() {
  const files = new Set();
  const n = 6 + rnd(12);
  for (let i = 0; i < n; i++) {
    const d = 1 + rnd(4); const parts = [];
    for (let j = 0; j < d; j++) parts.push(pick(NAMES));
    files.add(parts.join('/'));
  }
  // drop files that are also used as directories
  const all = [...files];
  return all.filter(f => !all.some(g => g.startsWith(f + '/')));
}
let total = 0, bad = 0; const stat = { ignored: 0, reincluded: 0, parent: 0, nested: 0 };
const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'gic-'));
for (let r = 0; r < ROUNDS; r++) {
  const dir = path.join(tmpRoot, 'r' + r);
  fs.mkdirSync(dir);
  cp.execSync('git init -q', { cwd: dir });
  const tree = randTree();
  const dirs = new Set();
  tree.forEach(f => { const ps = f.split('/'); for (let k = 1; k < ps.length; k++) dirs.add(ps.slice(0, k).join('/')); });
  const ign = {};
  const gdirs = [''].concat([...dirs].filter(() => rnd(3) === 0));
  gdirs.forEach(d => {
    const lines = []; const n = 1 + rnd(6);
    for (let i = 0; i < n; i++) lines.push(randPattern(tree));
    ign[(d ? d + '/' : '') + '.gitignore'] = lines.join(rnd(6) === 0 ? '\r\n' : '\n') + (rnd(3) ? '\n' : '');
  });
  tree.forEach(f => { fs.mkdirSync(path.join(dir, path.dirname(f)), { recursive: true }); fs.writeFileSync(path.join(dir, f), 'x'); });
  Object.keys(ign).forEach(f => { fs.mkdirSync(path.join(dir, path.dirname(f)), { recursive: true }); fs.writeFileSync(path.join(dir, f), ign[f]); });
  const queries = tree.concat([...dirs]);
  const out = cp.spawnSync('git', ['-c', 'core.excludesFile=/dev/null', 'check-ignore', '-v', '-n', '-z', '--no-index', '--stdin'], { cwd: dir, input: queries.join('\0') + '\0' }).stdout.toString().split('\0');
  const byDir = E.compile(ign);
  for (let q = 0; q < queries.length; q++) {
    const src = out[q * 4], line = out[q * 4 + 1], pat = out[q * 4 + 2], p = out[q * 4 + 3];
    const want = src ? { ignored: pat[0] !== '!', source: src, line: +line } : { ignored: false, source: '', line: 0 };
    const res = E.check(byDir, dirs.has(p) ? p + '/' : p);
    const got = res.rule ? { ignored: res.ignored, source: res.rule.source, line: res.rule.line } : { ignored: false, source: '', line: 0 };
    total++;
    if (got.ignored) stat.ignored++; if (res.rule && !res.ignored) stat.reincluded++; if (res.excluded_parent) stat.parent++; if (res.rule && res.rule.source !== '.gitignore') stat.nested++;
    if (got.ignored !== want.ignored || got.source !== want.source || got.line !== want.line) {
      bad++;
      if (bad <= 10) console.log('MISMATCH', JSON.stringify({ path: p, want, got, rule: src ? ign[src].split('\n')[line - 1] : null, ign }));
    }
  }
}
fs.rmSync(tmpRoot, { recursive: true, force: true });
console.log(total + ' paths compared with git ' + cp.execSync('git --version').toString().trim().split(' ')[2] + ', ' + bad + ' differences (ignored ' + stat.ignored + ', re-included ' + stat.reincluded + ', via ignored parent ' + stat.parent + ', nested .gitignore ' + stat.nested + ')');
process.exit(bad ? 1 : 0);
