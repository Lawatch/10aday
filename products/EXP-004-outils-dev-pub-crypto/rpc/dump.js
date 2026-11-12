// Dumps rpc.js verdicts for oracle.py. Specs: fixed list + random combinations (seeded).
const R = require('./rpc.js');
let seed = +(process.argv[2] || 1); const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
const ops = ['>=', '>', '<', '<=', '==', '!=', '~='];
const fixed = ['>=3.10', '==3.10', '<=3.12', '>3.10', '~=3.10', '~=3.10.2', '>=3.9,<3.13', '>=3.12.3', '', '==3.11.*', '!=3.12.1', '>=3.13,<3.12',
  '>=3.8, !=3.9.*', '~=3', '>=2.7,!=3.0.*,!=3.1.*,!=3.2.*,!=3.3.*', '<4', '>=3.6,<4.0', '==3.*', '>=3', '<3.12.0', '<=3.12.*', '>3.10.*', '>=3.10.0rc1', '<3.13.0a1', '~=3.11.0', '===3.12.1'];
const specs = fixed.slice();
for (let i = 0; i < 300; i++) {
  const k = 1 + Math.floor(rnd() * 3), parts = [];
  for (let j = 0; j < k; j++) {
    const op = ops[Math.floor(rnd() * ops.length)];
    let v = (rnd() < 0.1 ? '2' : '3') + '.' + Math.floor(rnd() * 17);
    if (rnd() < 0.4) v += '.' + Math.floor(rnd() * 12);
    if ((op === '==' || op === '!=') && rnd() < 0.4) v += '.*';
    parts.push(op + v);
  }
  specs.push(parts.join(','));
}
const out = specs.map(s => {
  const r = R.analyze(s), grid = {};
  if (r.valid) for (const m of r.minors) m.ok.forEach((b, p) => { grid[m.minor + '.' + p] = b; });
  return { input: s, spec: r.valid ? s : s, valid: r.valid, grid };
});
// Poetry inputs: verify the suggested PEP 440 translation against packaging too
for (const s of ['^3.10', '~3.10', '^3.9.1', '~3', '^2.7', '3.10.*']) {
  const r = R.analyze(s), grid = {};
  if (r.suggestion) { for (const m of r.minors) m.ok.forEach((b, p) => { grid[m.minor + '.' + p] = b; }); out.push({ input: s, spec: r.suggestion, valid: true, grid }); }
}
console.log(JSON.stringify(out));
