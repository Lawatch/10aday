// node gen_nuget_oracle.js OUT.json.gz N seed... — writes cases and the answers of the REAL NuGet.Versioning 8.0.0
// (oracle from ../EXP-004-outils-dev-pub-crypto/nvr/oracle, built to $ORACLE_DLL) for the Go tests in verrange/nuget/testdata.
const { execFileSync } = require('child_process'); const zlib = require('zlib'); const fs = require('fs');
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

const [outFile, nStr, ...seeds] = process.argv.slice(2);
let all = require('../EXP-004-outils-dev-pub-crypto/nvr/fixed_cases.json');
for (const s of seeds) { seed = +s; all = all.concat(cases(+nStr)); }
const res = JSON.parse(execFileSync('dotnet', [DLL], { input: JSON.stringify(all), maxBuffer: 1 << 30 }).toString());
const rows = all.map((c, i) => ({ r: c.r, v: c.v, o: res[i] }));
fs.writeFileSync(outFile, zlib.gzipSync(JSON.stringify(rows), { level: 9 }));
console.log(rows.length + ' cases written to ' + outFile);
