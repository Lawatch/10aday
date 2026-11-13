// Compares gpv.js with golang.org/x/mod (oracle/main.go). Usage: node test_gpv.js <oracle-binary> [seed] [n]
'use strict';
const G = require('./gpv.js');
const { execFileSync } = require('child_process');
const bin = process.argv[2], seed0 = +(process.argv[3] || 1), N = +(process.argv[4] || 40000);
let s = seed0; const rnd = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
const pick = a => a[Math.floor(rnd() * a.length)];
const nums = ['0', '1', '2', '9', '10', '19', '99', '100', '01', '007', '123456789012345678901234567890'];
const words = ['alpha', 'beta', 'rc', 'pre', '0', '1', '00', 'x-y', 'A', ''];
const ts = () => pick(['20191109021931', '00010101000000', '20240229120000', '20230229120000', '20241131000000', '20241301000000', '20241200000000',
  '20241231235959', '20241231240000', '20241231236000', '20241231235960', '99991231235959', '2019110902193', '201911090219310']) ;
const rev = () => pick(['daa7c04131f5', '000000000000', 'abc', 'ABCdef123456', 'abcdef12345g', 'abc_def', '']);
function sv() {
  let v = pick(['v', 'v', 'v', 'V', '']) + pick(nums);
  if (rnd() < 0.8) v += '.' + pick(nums);
  if (rnd() < 0.7) v += '.' + pick(nums);
  return v;
}
function gen() {
  const r = rnd();
  if (r < 0.25) return sv() + (rnd() < 0.5 ? '-' + pick(words) + (rnd() < 0.4 ? '.' + pick(words) : '') : '') + (rnd() < 0.2 ? '+' + pick(['build', 'incompatible', 'a.b', '', 'x..y']) : '');
  const t = ts(), h = rev(), b = rnd() < 0.15 ? pick(['+incompatible', '+meta.1', '+', '+a..b']) : '';
  if (r < 0.45) return sv() + '-' + t + '-' + h + b;
  if (r < 0.7) return sv() + '-0.' + t + '-' + h + b;
  if (r < 0.9) return sv() + '-' + pick(words) + (rnd() < 0.3 ? '.' + pick(words) : '') + '.0.' + t + '-' + h + b;
  let x = sv() + '-' + t + '-' + h; const i = Math.floor(rnd() * x.length);
  return x.slice(0, i) + pick(['-', '.', '+', '0', 'x', '']) + x.slice(i + 1);
}
const fixed = ['v0.0.0-20191109021931-daa7c04131f5', 'v1.6.1-0.20241114170450-2d3c2a9cc518', 'v1.2.3-pre.0.20191109021931-daa7c04131f5',
  'v1.0.0-0.20191109021931-daa7c04131f5', 'v2.0.0-20191109021931-daa7c04131f5+incompatible', 'v1.2.4-0.20191109021931-daa7c04131f5+incompatible',
  'v0.0.0-00010101000000-000000000000', 'v1.10.0-0.20191109021931-daa7c04131f5', 'v1.2.10-0.20191109021931-daa7c04131f5', 'v0.0.0-2019110902193-daa7c04131f5',
  'v1.2.3', 'v1.2', 'v1', 'v1.2.3-rc.1', 'v1.2.3+incompatible', 'v0.0.0-20230229000000-abcdef123456', 'v0.0.0-20240229000000-abcdef123456'];
const reqs = [];
const strs = fixed.slice(); for (let i = 0; i < N; i++) strs.push(gen());
strs.forEach(v => reqs.push({ op: 'one', v }));
for (let i = 0; i < N; i++) reqs.push({ op: 'cmp', v: rnd() < 0.5 ? pick(strs) : sv(), w: rnd() < 0.5 ? pick(strs) : sv() });
const olders = ['', 'v1.2.3', 'v1.2.9', 'v1.2.99', 'v1.2.3-rc.1', 'v1.2.3-pre', 'v1.2.3+incompatible', 'v2.0.0-beta+incompatible', 'v1.2', 'v1', 'v0.0.0', 'v1.9.19', 'bogus'];
for (let i = 0; i < N / 4; i++) reqs.push({ op: 'make', major: pick(['', 'v0', 'v1', 'v2', 'v10']), older: pick(olders), ts: ts().slice(0, 14).padEnd(14, '0'), rev: pick(['daa7c04131f5', '2d3c2a9cc518', '000000000000']) });
const out = execFileSync(bin, { input: reqs.map(r => JSON.stringify(r)).join('\n') + '\n', maxBuffer: 1 << 28 }).toString().trim().split('\n').map(l => JSON.parse(l));
let checks = 0, diffs = 0;
function eq(r, field, got, want) { checks++; if (got !== want) { diffs++; if (diffs < 20) console.log('DIFF', JSON.stringify(r), field, 'js=', got, 'go=', want); } }
reqs.forEach((r, i) => {
  const o = out[i];
  if (r.op === 'one') {
    const v = r.v;
    eq(r, 'valid', G.isValid(v), o.valid); eq(r, 'canonical', G.canonical(v), o.canonical); eq(r, 'major', G.major(v), o.major);
    eq(r, 'pre', G.prerelease(v), o.pre); eq(r, 'build', G.build(v), o.build); eq(r, 'pseudo', G.isPseudo(v), o.pseudo);
    const t = G.pseudoTime(v); eq(r, 'time', t.err ? 'ERR' : t.iso, o.time);
    const rv = G.pseudoRev(v); eq(r, 'rev', rv.err ? 'ERR' : rv.rev, o.rev);
    const b = G.pseudoBase(v); eq(r, 'base', b.err ? 'ERR' : b.base, o.base);
  } else if (r.op === 'cmp') eq(r, 'cmp', G.compare(r.v, r.w), o.cmp);
  else { const t = G.parseTime(r.ts); eq(r, 'make', t.err ? 'ERR' : G.make(r.major, r.older, r.ts, r.rev), o.make); }
});
const nPseudo = out.filter(o => o.pseudo === true).length;
console.log(`seed ${seed0}: ${checks} checks, ${diffs} differences (${nPseudo} valid pseudo-versions among the inputs)`);
process.exit(diffs ? 1 : 0);
