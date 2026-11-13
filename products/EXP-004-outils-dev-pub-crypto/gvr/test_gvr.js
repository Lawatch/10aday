// Compares gvr.js with the real Gradle 8.14.3 classes (oracle/Oracle.java).
// Usage: GRADLE_CP="/opt/gradle/lib/*:/opt/gradle/lib/plugins/*:cls" node test_gvr.js [seed ...]   (no seed = fixed list only)
'use strict';
const { execFileSync } = require('child_process');
const G = require('./gvr.js');
const CP = process.env.GRADLE_CP;
if (!CP) { console.error('set GRADLE_CP (Gradle lib jars + compiled Oracle.class)'); process.exit(2); }
const FIXED_V = ['1', '1.0', '1.0.0', '1-0', '1_0', '1+0', '1.0-SNAPSHOT', '1.0-alpha', '1.0-alpha1', '1.0-alpha-1', '1.0a1', '1.0-beta', '1.0-beta2',
  '1.0-rc', '1.0-rc1', '1.0-RC1', '1.0-rc-1', '1.0-dev', '1.0-dev1', '1.0-final', '1.0.Final', '1.0-ga', '1.0.RELEASE', '1.0-release', '1.0-sp',
  '1.0-sp1', '1.0.1', '1.0.0.1', '1.0-1', '1.0-jre', '1.0-android', '1.0-M1', '1.0-m1', '1.0-milestone', '1.1', '1.1-rc1', '1.2', '1.9', '1.10',
  '1.10.0', '10', '10.0', '11.0', '2', '2.0', '2.0.0', '2.0-alpha1', '2.0-beta1', '2.0-rc1', '2.0-SNAPSHOT', '2.0-dev', '2.0.1', '20.0',
  '2.0-final', '1.0.0-0', '01.002', '1.01', '1.001', '33.0.0-jre', '32.1.3-android', '1.9.22', '1.9.0-RC', '2.0.0-Beta1', '2.0.0-RC2',
  '5.3.30', '6.0.0-M1', '1.7.36', '0', '0.0', '0.9', '0.10', '', '1..0', '1.0-', '-1', 'v1.0', 'abc', '1.0a', '1.0b', '1.0c1', 'a1',
  '12345678901234567890', '9223372036854775807', '9223372036854775808', '1.0+build', '1.0-20240101.123456-1', '1.0.20240101', 'Final', 'dev'];
const FIXED_C = ['1.0', '1.+', '1.0.+', '1+', '1.0+', '+', '2.+', '1.1.+', '1.10.+', '[1.0,2.0)', '[1.0,2.0]', '(1.0,2.0)', '(1.0,2.0]', ']1.0,2.0[',
  ']1.0,2.0]', '[1.0,2.0[', '[1.0,)', '(1.0,)', ']1.0,)', '(,1.0]', '(,1.0)', '(,1.0[', '[1.0]', '[1.0,1.0]', '[1.0, 1.0]', '[ 1.0 , 2.0 )',
  '[1.0 ,2.0)', ' [1.0,2.0)', '[1.0,2.0) ', '[1,2)', '[1.0,1.1)', '[1.0,1.10)', '[1.0,2)', '[1.0,2.0-alpha)', '[1.0,2.0-rc1)', '[1.0,1.999)',
  '[1.0-rc1,1.0]', '(,2.0-rc1)', '[1.0,1.0)', '(1.0,1.0]', '[2.0,1.0]', '[1.0,2.0),[3.0,4.0)', '[1.*]', '[1.0', '1.0]', '()', '[,]', '[,1.0)',
  'latest.release', 'latest.integration', 'latest.milestone', 'latest.foo', 'latest.', '1.0-SNAPSHOT', '', '1.0.+-rc', '[1.0,+)', '1.0,2.0',
  '>=1.0', '^1.0', '~1.0', '1.0.*', '1.*', '[33,34)', '[1.9,1.10)', '[1.9.20,1.9.22]', '1.9.+', '[0,)', '(,)'];
function rnd(seed) { let s = seed >>> 0 || 1; return () => (s = (s * 1103515245 + 12345) >>> 0) / 4294967296; }
function genVersion(r) {
  const parts = ['0', '1', '2', '10', '01', '00', '9', '123', '99999999999999999999', 'alpha', 'beta', 'b', 'a', 'm', 'M', 'rc', 'RC', 'Rc',
    'dev', 'DEV', 'snapshot', 'SNAPSHOT', 'ga', 'GA', 'final', 'Final', 'release', 'sp', 'SP', 'foo', 'jre', 'android', 'x', ''];
  const seps = ['.', '-', '_', '+', ''];
  let n = 1 + Math.floor(r() * 5), s = '';
  for (let i = 0; i < n; i++) { s += parts[Math.floor(r() * parts.length)]; if (i < n - 1) s += seps[Math.floor(r() * seps.length)]; }
  return s;
}
function genSelector(r, vs) {
  const pick = () => (r() < 0.1 ? '' : vs[Math.floor(r() * vs.length)]);
  const k = r(), sp = () => (r() < 0.1 ? ' ' : '');
  if (k < 0.15) return pick() + '+';
  if (k < 0.25) return pick() + '.+';
  if (k < 0.3) return ['latest.release', 'latest.integration', 'latest.milestone'][Math.floor(r() * 3)];
  if (k < 0.4) return pick();
  const o = '[](' [Math.floor(r() * 3)], c = '][)' [Math.floor(r() * 3)];
  if (k < 0.48) return '[' + sp() + pick() + ']';
  if (k < 0.55) return '(' + sp() + ',' + sp() + pick() + sp() + c;
  if (k < 0.62) return o + sp() + pick() + sp() + ',' + sp() + ')';
  return o + sp() + pick() + sp() + ',' + sp() + pick() + sp() + c;
}
function run(vs, cs) {
  const input = vs.map(v => 'V\t' + v).join('\n') + '\n' + cs.map(c => 'C\t' + c).join('\n') + '\n';
  const out = execFileSync('java', ['-cp', CP, 'Oracle'], { input, encoding: 'utf8', maxBuffer: 1 << 28, stdio: ['pipe', 'pipe', 'ignore'] }).split('\n');
  let checks = 0, bad = 0; const n = vs.length, K = { exact: 'E', prefix: 'P', range: 'R', latest: 'L' };
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const c = G.compare(vs[i], vs[j]), m = c < 0 ? '<' : c > 0 ? '>' : '=';
    checks++; if (m !== out[0][i * n + j]) { bad++; if (bad < 15) console.log('CMP', JSON.stringify(vs[i]), JSON.stringify(vs[j]), 'js', m, 'java', out[0][i * n + j]); }
  }
  cs.forEach((c, k) => {
    const sel = G.parseSelector(c), line = K[sel.kind] + ':' + vs.map(v => (G.accept(sel, v) ? '1' : '0')).join('');
    checks += n + 1;
    if (line !== out[k + 1]) { bad++; if (bad < 15) console.log('SEL', JSON.stringify(c), '\n js  ', line, '\n java', out[k + 1]); }
  });
  return { checks, bad };
}
let total = 0, totalBad = 0;
const add = r => { total += r.checks; totalBad += r.bad; };
add(run(FIXED_V, FIXED_C));
for (const a of process.argv.slice(2)) {
  const r = rnd(+a), vs = [...new Set(Array.from({ length: 250 }, () => genVersion(r)).concat(FIXED_V.slice(0, 30)))];
  add(run(vs, Array.from({ length: 400 }, () => genSelector(r, vs))));
}
console.log(`${total} checks, ${totalBad} mismatches`);
process.exit(totalBad ? 1 : 0);
