// node nvr/check_real.js — checks that nvr.js predicts every real `dotnet restore` result in real_restore/RESULTS.txt
const N = require('./nvr.js'); const fs = require('fs');
let ok = 0, bad = 0;
for (const line of fs.readFileSync(__dirname + '/real_restore/RESULTS.txt', 'utf8').trim().split('\n')) {
  const m = line.match(/^(\S+) \| Version="(.*)" \| published: (.*) \| restored: (\S+) \|/);
  const r = N.parseRange(m[2]); const vs = m[3].split(' ').map(N.parseVersion);
  const b = r ? N.findBestMatch(r, vs) : null; const pred = b ? N.normalized(b) : 'FAIL';
  if (pred === m[4]) ok++; else { bad++; console.log('DIFF', m[1], 'predicted', pred, 'real', m[4]); }
}
console.log(ok + ' / ' + (ok + bad) + ' real restores predicted'); process.exit(bad ? 1 : 0);
