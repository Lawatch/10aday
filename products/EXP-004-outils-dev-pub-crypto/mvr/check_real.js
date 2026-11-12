// mvr.js must pick the same version as real Maven did (real_mvn/RESULTS.txt), and docs/ must ship the same mvr.js.
'use strict';
const fs = require('fs'), path = require('path'), M = require('./mvr.js');
const VS = ['1.0', '1.5', '1.9.9', '2.0-alpha-1', '2.0-beta1', '2.0-rc1', '2.0', '2.0.1'];
let bad = 0, n = 0;
for (const line of fs.readFileSync(path.join(__dirname, 'real_mvn/RESULTS.txt'), 'utf8').split('\n')) {
  if (!line.trim() || line.startsWith('#')) continue;
  const m = line.match(/^(.*?)\s{2,}(\S+)$/) || line.match(/^(\S+)\s+(\S+)$/); const spec = m[1].trim(), real = m[2]; let js;
  if (/[\\/:"<>|?*]/.test(spec)) js = 'REFUSED-IN-POM';
  else { try { const C = M.parseConstraint(spec); const ok = VS.filter(v => M.contains(C, v)); js = ok.length ? ok.reduce((a, b) => (M.compare(a, b) >= 0 ? a : b)) : 'ERROR'; } catch (e) { js = 'ERROR'; } }
  n++; if (js !== real) { bad++; console.log('MISMATCH', spec, 'js', js, 'maven', real); }
}
const same = fs.readFileSync(path.join(__dirname, 'mvr.js'), 'utf8') === fs.readFileSync(path.join(__dirname, '../../../docs/tools/maven-version-range-checker/mvr.js'), 'utf8');
console.log(n, 'real Maven runs,', bad, 'mismatches; docs copy identical:', same);
process.exit(bad || !same ? 1 : 0);
