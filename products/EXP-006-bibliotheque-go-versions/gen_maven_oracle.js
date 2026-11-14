// node gen_maven_oracle.js OUT.json.gz NV NC seed... — writes version lists, constraints and the answers of the REAL
// Maven Resolver 1.9.24 (oracle ../EXP-004-outils-dev-pub-crypto/mvr/oracle/Oracle.java, classpath in $MVN_CP,
// e.g. MVN_CP="/opt/maven/lib/*:<dir with Oracle.class>") for the Go tests in verrange/maven.
// Output: [{v:[...], c:[...], o:[compare matrix, then one line per constraint: "ERR" or 0/1 per version]}]
'use strict';
const { execFileSync } = require('child_process'); const zlib = require('zlib'); const fs = require('fs');
const CP = process.env.MVN_CP; if (!CP) { console.error('set MVN_CP'); process.exit(2); }
const [out, NV, NC, ...seeds] = process.argv.slice(2);
const FIXED_V = ['1', '1.0', '1.0.0', '1-0', '1.0-SNAPSHOT', '1.0-alpha', '1.0-alpha-1', '1.0-alpha1', '1.0a1', '1.0-a1', '1.0-beta-2',
  '1.0-b2', '1.0-milestone-1', '1.0-M1', '1.0-m1', '1.0-RC1', '1.0-rc-1', '1.0-CR1', '1.0-cr1', '1.0.RELEASE', '1.0.Final', '1.0-final',
  '1.0-GA', '1.0-ga', '1.0-sp', '1.0-sp1', '1.0-SP2', '1.0.1', '1.0-1', '1.0_1', '1.0-foo', '1.0-xyz', '1.0.foo', '1.0-jre', '1.0-android',
  '1.1', '1.1-SNAPSHOT', '1.2', '1.10', '1.9', '2', '2.0', '2.0-alpha-1', '2.0-SNAPSHOT', '2.0-beta1', '2.0-rc1', '2.0.0', '2.0.1',
  '1.0.0.0.0', '1.0.0-0', '01.002', '1.0.00001', '1.2.3-4', '1.2.3.4', '1.2.3-alpha.4', '1.2.3-SNAPSHOT', '3.0-M1', '33.0.0-jre',
  '32.1.3-android', '5.3.30', '6.0.0-M1', '6.0.0-RC1', '2.17.0', '1.7.36', '2.0.9', '0', '0.0', '0.9', '0.9.9-SNAPSHOT', '12345678901',
  '12345678902', '1.12345678901', '0000000000012', '1.000000000001', 'abc', '1.0-min', '1.0.max', '1.min', '1.max', '1.MAX', 'max', 'min', '', '1..0', '1.-1', '1.0-', 'v1.0', '1.0a', '1.0b',
  '1.0m', '1.0c1', '1.0-pre', '1.0-dev', '1.0-preview', '20240101', '1.0.20240101', '1.0-20240101.123456-1',
  // non-ASCII: Maven only splits on ASCII digits?
  '١.٠', '1.٠', '1.0-é', '1.0-É', '1.0-ß', '1.0-SS', '1.0-İ', '1.0-i', '1.0-ı', '1.0-K', '1.0-k', '1.0-ǅ', '1.0-ǆ', '1.0-😀', '1.0-Ａ', '1.0-ａ'];
const FIXED_C = ['1.0', '[1.0]', '[1.0,2.0)', '[1.0,2.0]', '(1.0,2.0)', '(1.0,2.0]', '[1.0,)', '(1.0,)', '(,1.0]', '(,1.0)',
  '(,1.0],[1.2,)', '(,1.1),(1.1,)', '[1.0,1.1),[1.2,)', '[1.*]', '[1.0.*]', '[2.*]', '[1,2)', '[1.0,2.0-alpha)', '[1.0,2.0-SNAPSHOT)',
  '[1.0,1.999)', '[1.0,2-min)', '[1.0,2.min)', '[1.0, 2.0)', ' [1.0,2.0)', '[1.0,2.0) ', '[1.0 ,2.0)', '[,]', '[,)', '(,)', '[]',
  '[1.0', '1.0]', '(1.0)', '[1.0)', '[2.0,1.0]', '[1.0,2.0,3.0]', '[1.0,2.0),', '[1.0,2.0)x', '[1.0,2.0),[3.0,4.0)', '[1.0,2.0)[3.0,4.0)',
  '[1.0-SNAPSHOT,1.0]', '[1.0-alpha,1.0)', '(1.0-SNAPSHOT,1.0)', '[33,34)', '[5.3,5.4)', '[1.7.30,1.8)', '[0,)', 'LATEST', 'RELEASE',
  '1.0-SNAPSHOT', '[1.0-sp,)', '[1.0.RELEASE]', '[1.0-ga]', '(,2.0-rc1)', '[1.0.0]', '[1]', '[1.0.0.0]', '[1.max]', '[1.min,1.max]',
  '[*]', '[1.*,2.*]', '(1.0-foo,1.0-xyz)', '[1.0-jre,1.0-android]', '[1.0-android,1.0-jre]', '[1.0,2.0)  ,  [3.0,)', '[1.0,2.0) [3.0,)',
  '(', '[', ')', ']', '[)', '(]', '[ ]', '[,1.0', '(1.0,2.0]]', '[1.0]]', '[1.0,2.0)]', '[1.0-é,1.0-ü]', '[١.٠]'];
let s = 1; const r = () => (s = (s * 1103515245 + 12345) >>> 0) / 4294967296;
const PARTS = ['0', '1', '2', '10', '01', '00', '9', '123456789', '1234567890', 'alpha', 'Alpha', 'beta', 'b', 'a', 'm', 'M', 'rc', 'RC',
  'cr', 'snapshot', 'SNAPSHOT', 'ga', 'final', 'release', 'sp', 'min', 'max', 'MIN', 'foo', 'jre', 'android', 'x', 'é', ''];
function genVersion() {
  const n = 1 + Math.floor(r() * 5); let v = '';
  for (let i = 0; i < n; i++) { v += PARTS[Math.floor(r() * PARTS.length)]; if (i < n - 1) v += ['.', '-', '_', ''][Math.floor(r() * 4)]; }
  return v;
}
function genConstraint(vs) {
  const pick = () => (r() < 0.15 ? '' : vs[Math.floor(r() * vs.length)]);
  const one = () => {
    const k = r();
    if (k < 0.15) return '[' + pick() + ']';
    if (k < 0.22) return '[' + pick().replace(/\.?$/, '') + '.*]';
    return (r() < 0.5 ? '[' : '(') + pick() + (r() < 0.9 ? ',' : '') + pick() + (r() < 0.5 ? ']' : ')');
  };
  const k = r(); if (k < 0.15) return pick();
  let c = one(); if (k > 0.75) c += (r() < 0.8 ? ',' : ' , ') + one();
  return c;
}
function oracle(vs, cs) {
  const input = vs.map(v => 'V\t' + v).concat(cs.map(c => 'C\t' + c)).join('\n') + '\n';
  return execFileSync('java', ['-cp', CP, 'Oracle'], { input, encoding: 'utf8', maxBuffer: 1 << 30, stdio: ['pipe', 'pipe', 'ignore'] }).split('\n').slice(0, 1 + cs.length);
}
const sets = [{ v: FIXED_V, c: FIXED_C, o: oracle(FIXED_V, FIXED_C) }];
for (const sd of seeds.map(Number)) {
  s = sd; const vs = []; for (let i = 0; i < +NV; i++) vs.push(genVersion());
  const pool = vs.concat(FIXED_V), cs = []; for (let i = 0; i < +NC; i++) cs.push(genConstraint(pool));
  const v = vs.concat(FIXED_V.slice(0, 40)); sets.push({ v, c: cs, o: oracle(v, cs) });
}
fs.writeFileSync(out, zlib.gzipSync(JSON.stringify(sets), { level: 9 }));
let n = 0; for (const x of sets) n += x.v.length * x.v.length + x.o.slice(1).reduce((a, l) => a + (l === 'ERR' ? 1 : x.v.length), 0);
console.log(out, sets.length, 'sets,', n, 'checks');
