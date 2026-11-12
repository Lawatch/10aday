// Compares mvr.js with the real Maven Resolver (oracle/Oracle.java).
// Usage: MVN_CP="lib/*:cls" node test_mvr.js [seed ...]   (no seed = fixed list only)
'use strict';
const { execFileSync } = require('child_process');
const M = require('./mvr.js');
const CP = process.env.MVN_CP;
if (!CP) { console.error('set MVN_CP to the classpath with maven-resolver-util/api 1.9.24 and Oracle.class'); process.exit(2); }
const FIXED_V = ['1', '1.0', '1.0.0', '1-0', '1.0-SNAPSHOT', '1.0-alpha', '1.0-alpha-1', '1.0-alpha1', '1.0a1', '1.0-a1', '1.0-beta-2',
  '1.0-b2', '1.0-milestone-1', '1.0-M1', '1.0-m1', '1.0-RC1', '1.0-rc-1', '1.0-CR1', '1.0-cr1', '1.0.RELEASE', '1.0.Final', '1.0-final',
  '1.0-GA', '1.0-ga', '1.0-sp', '1.0-sp1', '1.0-SP2', '1.0.1', '1.0-1', '1.0_1', '1.0-foo', '1.0-xyz', '1.0.foo', '1.0-jre', '1.0-android',
  '1.1', '1.1-SNAPSHOT', '1.2', '1.10', '1.9', '2', '2.0', '2.0-alpha-1', '2.0-SNAPSHOT', '2.0-beta1', '2.0-rc1', '2.0.0', '2.0.1',
  '1.0.0.0.0', '1.0.0-0', '01.002', '1.0.00001', '1.2.3-4', '1.2.3.4', '1.2.3-alpha.4', '1.2.3-SNAPSHOT', '3.0-M1', '33.0.0-jre',
  '32.1.3-android', '5.3.30', '6.0.0-M1', '6.0.0-RC1', '2.17.0', '1.7.36', '2.0.9', '0', '0.0', '0.9', '0.9.9-SNAPSHOT', '12345678901',
  '12345678902', '1.12345678901', 'abc', '1.0-min', '1.0.max', '1.min', '1.max', '', '1..0', '1.-1', '1.0-', 'v1.0', '1.0a', '1.0b',
  '1.0m', '1.0c1', '1.0-pre', '1.0-dev', '1.0-preview', '20240101', '1.0.20240101', '1.0-20240101.123456-1'];
const FIXED_C = ['1.0', '[1.0]', '[1.0,2.0)', '[1.0,2.0]', '(1.0,2.0)', '(1.0,2.0]', '[1.0,)', '(1.0,)', '(,1.0]', '(,1.0)',
  '(,1.0],[1.2,)', '(,1.1),(1.1,)', '[1.0,1.1),[1.2,)', '[1.*]', '[1.0.*]', '[2.*]', '[1,2)', '[1.0,2.0-alpha)', '[1.0,2.0-SNAPSHOT)',
  '[1.0,1.999)', '[1.0,2-min)', '[1.0,2.min)', '[1.0, 2.0)', ' [1.0,2.0)', '[1.0,2.0) ', '[1.0 ,2.0)', '[,]', '[,)', '(,)', '[]',
  '[1.0', '1.0]', '(1.0)', '[1.0)', '[2.0,1.0]', '[1.0,2.0,3.0]', '[1.0,2.0),', '[1.0,2.0)x', '[1.0,2.0),[3.0,4.0)', '[1.0,2.0)[3.0,4.0)',
  '[1.0-SNAPSHOT,1.0]', '[1.0-alpha,1.0)', '(1.0-SNAPSHOT,1.0)', '[33,34)', '[5.3,5.4)', '[1.7.30,1.8)', '[0,)', 'LATEST', 'RELEASE',
  '1.0-SNAPSHOT', '[1.0-sp,)', '[1.0.RELEASE]', '[1.0-ga]', '(,2.0-rc1)', '[1.0.0]', '[1]', '[1.0.0.0]', '[1.max]', '[1.min,1.max]',
  '[*]', '[1.*,2.*]', '[1.0,2.0]', '(1.0-foo,1.0-xyz)', '[1.0-jre,1.0-android]', '[1.0-android,1.0-jre]'];
function rnd(seed) { let s = seed >>> 0 || 1; return () => (s = (s * 1103515245 + 12345) >>> 0) / 4294967296; }
function genVersion(r) {
  const parts = ['0', '1', '2', '10', '01', '00', '9', '123456789', '1234567890', 'alpha', 'Alpha', 'beta', 'b', 'a', 'm', 'M', 'rc', 'RC',
    'cr', 'snapshot', 'SNAPSHOT', 'ga', 'final', 'release', 'sp', 'min', 'max', 'foo', 'jre', 'android', 'x', ''];
  const seps = ['.', '-', '_', ''];
  let n = 1 + Math.floor(r() * 5), s = '';
  for (let i = 0; i < n; i++) { s += parts[Math.floor(r() * parts.length)]; if (i < n - 1) s += seps[Math.floor(r() * seps.length)]; }
  return s;
}
function genConstraint(r, vs) {
  const pick = () => (r() < 0.15 ? '' : vs[Math.floor(r() * vs.length)]);
  const one = () => {
    const k = r();
    if (k < 0.15) return '[' + pick() + ']';
    if (k < 0.22) return '[' + pick().replace(/\.?$/, '') + '.*]';
    return (r() < 0.5 ? '[' : '(') + pick() + (r() < 0.9 ? ',' : '') + pick() + (r() < 0.5 ? ']' : ')');
  };
  const k = r();
  if (k < 0.15) return pick();
  let s = one(); if (k > 0.75) s += (r() < 0.8 ? ',' : ' , ') + one();
  return s;
}
function run(vs, cs) {
  const input = vs.map(v => 'V\t' + v).concat(cs.map(c => 'C\t' + c)).join('\n') + '\n';
  const out = execFileSync('java', ['-cp', CP, 'Oracle'], { input, encoding: 'utf8', maxBuffer: 1 << 28, stdio: ['pipe', 'pipe', 'ignore'] }).split('\n');
  let bad = 0, checks = 0; const n = vs.length, mat = out[0];
  const P = vs.map(M.parse);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const c = Math.sign(M.compare(vs[i], vs[j])), o = mat[i * n + j]; checks++;
    if ((c < 0 ? '<' : c > 0 ? '>' : '=') !== o) { if (bad++ < 10) console.log('CMP', JSON.stringify(vs[i]), JSON.stringify(vs[j]), 'js', c, 'maven', o); }
  }
  cs.forEach((c, k) => {
    const o = out[1 + k]; let js;
    try { const C = M.parseConstraint(c); js = vs.map(v => (M.contains(C, v) ? '1' : '0')).join(''); }
    catch (e) { if (!e.mavenInvalid) throw e; js = 'ERR'; }
    checks += o === 'ERR' ? 1 : n;
    if (js !== o) { if (bad++ < 20) console.log('RANGE', JSON.stringify(c), 'js', js.slice(0, 60), 'maven', o.slice(0, 60)); }
  });
  return { bad, checks };
}
let tot = { bad: 0, checks: 0 };
const add = r => { tot.bad += r.bad; tot.checks += r.checks; };
add(run(FIXED_V, FIXED_C)); console.log('fixed list:', tot.checks, 'checks,', tot.bad, 'mismatches');
for (const seed of process.argv.slice(2).map(Number)) {
  const r = rnd(seed), vs = [], cs = [];
  for (let i = 0; i < 300; i++) vs.push(genVersion(r));
  const pool = vs.concat(FIXED_V);
  for (let i = 0; i < 400; i++) cs.push(genConstraint(r, pool));
  const res = run(vs.concat(FIXED_V), cs); add(res);
  console.log('seed', seed + ':', res.checks, 'checks,', res.bad, 'mismatches');
}
console.log('TOTAL', tot.checks, 'checks,', tot.bad, 'mismatches');
process.exit(tot.bad ? 1 : 0);
