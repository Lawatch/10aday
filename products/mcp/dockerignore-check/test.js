'use strict';
// Compare engine.js with the real Docker code (oracle/main.go).
//   node test.js gen <n> <seed>  -> random cases, one JSON per line
//   node test.js check <cases.jsonl> <expected.jsonl>  -> 0 differences or exit 1
const fs = require('fs');
const E = require('./engine.js');
function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
const NAMES = ['a', 'b', 'c', 'ab', 'x.log', 'y.log', 'keep', 'node_modules', '.git', 'Dockerfile', '.env', 'a.txt', 'b.md', 'dist', 'src', 'é', 'a b', '.dockerignore'];
const SEGS = ['a', 'b', '*', '?', '**', '*.log', 'a*', '*b', '[ab]', '[^a]', '[a-c]*', 'node_modules', '.git', 'keep', 'x.log', 'dist', 'src', '.env', 'Dockerfile', 'é', '\\*', 'a?', '**b', '.', '..', '', 'a b'];
function gen(n, seed) {
  const r = rng(seed), pick = a => a[Math.floor(r() * a.length)];
  const out = [];
  for (let c = 0; c < n; c++) {
    const lines = [];
    const nl = 1 + Math.floor(r() * 6);
    for (let i = 0; i < nl; i++) {
      const ns = 1 + Math.floor(r() * 3);
      let p = Array.from({ length: ns }, () => pick(SEGS)).join('/');
      const f = r();
      if (f < 0.3) p = '!' + p; else if (f < 0.36) p = '/' + p; else if (f < 0.4) p = p + '/'; else if (f < 0.43) p = '# ' + p; else if (f < 0.46) p = '  ' + p + ' '; else if (f < 0.48) p = '! ' + p; else if (f < 0.5) p = './' + p;
      lines.push(p);
    }
    const paths = new Set();
    const np = 1 + Math.floor(r() * 10);
    for (let i = 0; i < np; i++) {
      const d = 1 + Math.floor(r() * 4);
      let p = Array.from({ length: d }, () => pick(NAMES)).join('/');
      if (r() < 0.1) p += '/';
      paths.add(p);
    }
    // a path can't be both a file and a directory
    const arr = Array.from(paths).filter(p => !Array.from(paths).some(q => q !== p && (q.startsWith(p.replace(/\/$/, '') + '/')) && !p.endsWith('/')));
    if (!arr.length) { c--; continue; }
    out.push(JSON.stringify({ dockerignore: lines.join('\n') + (r() < 0.5 ? '\n' : ''), paths: arr }));
  }
  return out.join('\n') + '\n';
}
function run(c) {
  try { const m = E.build(c.dockerignore); return { sent: E.context(m, c.paths).sent }; }
  catch (e) { return { error: e.message }; }
}
const [mode, a, b] = process.argv.slice(2);
if (mode === 'gen') process.stdout.write(gen(+a || 100, +b || 1));
else if (mode === 'check') {
  const cases = fs.readFileSync(a, 'utf8').trim().split('\n').map(JSON.parse);
  const exp = fs.readFileSync(b, 'utf8').trim().split('\n').map(JSON.parse);
  let bad = 0;
  cases.forEach((c, i) => {
    const got = run(c), want = exp[i];
    const ok = want.error ? !!got.error : (!got.error && JSON.stringify(got.sent) === JSON.stringify(want.sent));
    if (!ok) { bad++; if (bad <= 5) console.log('DIFF', JSON.stringify(c), '\n want', JSON.stringify(want), '\n got ', JSON.stringify(got)); }
  });
  console.log(cases.length + ' cases, ' + bad + ' differences with real Docker (BuildKit) code');
  process.exit(bad ? 1 : 0);
}
