// node nvr/test_nvr.js [seed ...] — compares nvr.js with the real NuGet.Versioning (oracle, built to $ORACLE_DLL).
const N = require('./nvr.js'); const { execFileSync } = require('child_process');
const DLL = process.env.ORACLE_DLL || '/tmp/claude-0/nu/obin/oracle.dll';
let seed = 1; const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
const pick = a => a[Math.floor(rnd() * a.length)];
const NUMS = ['0', '1', '2', '10', '01', '2147483647', '2147483648', ' 1', '1 '];
const LABELS = ['alpha', 'beta', 'Beta', 'rc', 'rc1', 'rc.1', 'rc.2', 'beta.10', 'beta.9', '0', '1', '01', 'a-b', '-1', '--', 'x.y', 'preview.1.25', 'BETA'];
function ver() {
  const k = 1 + Math.floor(rnd() * 4); let s = Array.from({ length: k }, () => pick(NUMS.slice(0, 6))).join('.');
  if (rnd() < 0.4) s += '-' + pick(LABELS);
  if (rnd() < 0.1) s += '+' + pick(['build.5', 'sha', '01', 'x..y']);
  if (rnd() < 0.03) s = pick(['', ' ', 'v1.0', '1.', '.1', '1..2', '1.0.0-', '1.0.0+', '1 .2', '1.2.3.4.5', '1.0-beta_2']);
  return s;
}
function flt() {
  return pick(['*', '*-*', '1.*', '1.2.*', '1.2.3.*', '1.*-*', '1.2.*-*', '1.2.3.*-*', '1.2.3.4.*-*', '*-beta*', '1.*-rc*', '1.2.*-rc.*',
    '1.0.0-*', '1.0.0-beta*', '1.0.0-beta.*', '1.0.0-rc.1*', '1.*.*', '*.1', '1.**', '1.0.0-*-*', '1.0.0-a-*', '1.2.3.4-*', '1-*', '1.*+meta', '1.0.0-*.1', ' 1.* ', '1.0.*-']);
}
function range() {
  const x = rnd();
  if (x < 0.25) return rnd() < 0.5 ? flt() : ver();
  const a = rnd() < 0.2 ? '' : (rnd() < 0.25 ? flt() : ver()), b = rnd() < 0.2 ? '' : ver();
  const o = pick(['[', '(']), c = pick([']', ')']);
  if (rnd() < 0.15) return o + a + c;
  if (rnd() < 0.05) return pick(['[1.0,2.0,3.0]', '[,]', '(1.0)', '[1.0', '1.0]', '[]', '()', '[ ]', '(,)', '[2.0,1.0]', '(1.0,1.0)', '[1.0,1.0)', '[1.0 , 2.0 ]', ' [1.0,2.0) ']);
  return o + a + (rnd() < 0.7 ? ',' : ', ') + b + c;
}
function cases(n) { return Array.from({ length: n }, () => ({ r: range(), v: Array.from({ length: 2 + Math.floor(rnd() * 10) }, ver) })); }
const FIXED = require('./fixed_cases.json');
const ST = { parsed: 0, floating: 0, withBest: 0, prereleaseSkipped: 0 };
function check(cs) {
  const out = JSON.parse(execFileSync('dotnet', [DLL], { input: JSON.stringify(cs), maxBuffer: 1 << 30 }).toString());
  let n = 0, bad = 0;
  const fail = (c, what, a, b) => { if (bad++ < 15) console.log('MISMATCH', JSON.stringify(c), what, JSON.stringify(a), '≠', JSON.stringify(b)); };
  cs.forEach((c, i) => {
    const o = out[i]; const vs = c.v.map(N.parseVersion);
    vs.forEach((v, j) => { n++; const e = o.v[j]; const g = v ? { n: N.normalized(v), f: N.full(v) } : null; if (JSON.stringify(e) !== JSON.stringify(g)) fail(c, 'ver' + j, g, e); });
    let r; try { r = N.parseRange(c.r); } catch (e) { r = 'ERR'; }
    n++;
    if (o.err) { if (r !== 'ERR') fail(c, 'err', r, o.err); return; }
    if (!o.r) { if (r) fail(c, 'parse', N.rangeNormalized(r), null); return; }
    if (!r || r === 'ERR') { fail(c, 'parse', null, o.r.n); return; }
    const g = { n: N.rangeNormalized(r), a: N.rangeShort(r), p: N.prettyPrint(r, false), F: N.prettyPrint(r, true), fl: N.isFloating(r) };
    for (const k of Object.keys(g)) { n++; if (g[k] !== o.r[k]) fail(c, k, g[k], o.r[k]); }
    vs.forEach((v, j) => { if (!v) return; n += 2;
      if (N.satisfies(r, v) !== o.r.sat[j]) fail(c, 'sat' + j, N.satisfies(r, v), o.r.sat[j]);
      if ((N.exclusion(r, v) === null) !== o.r.cand[j]) fail(c, 'cand' + j, N.exclusion(r, v), o.r.cand[j]); });
    const ok = vs.filter(Boolean); const b = N.findBestMatch(r, ok); n++;
    ST.parsed++; if (N.isFloating(r)) ST.floating++; if (b) ST.withBest++; if (ok.some(v => N.exclusion(r, v) === 'prerelease')) ST.prereleaseSkipped++;
    const bi = b ? vs.indexOf(b) : -1; if (bi !== o.r.best) fail(c, 'best', bi, o.r.best);
  });
  return { n, bad };
}
let total = 0, totalBad = 0;
const runs = [['fixed', FIXED]].concat((process.argv.slice(2).length ? process.argv.slice(2) : ['1', '2', '3']).map(s => { seed = +s; return ['seed ' + s, cases(20000)]; }));
for (const [name, cs] of runs) { const { n, bad } = check(cs); total += n; totalBad += bad; console.log(name + ':', cs.length, 'cases,', n, 'checks,', bad, 'mismatches'); }
console.log('coverage', JSON.stringify(ST)); console.log('TOTAL', total, 'checks,', totalBad, 'mismatches'); process.exit(totalBad ? 1 : 0);
