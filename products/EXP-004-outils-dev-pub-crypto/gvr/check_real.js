// Checks that gvr.js predicts every real Gradle resolution recorded in real_gradle/RESULTS.txt (made by real_gradle/run.sh).
'use strict';
const fs = require('fs'), G = require('./gvr.js');
const lines = fs.readFileSync(__dirname + '/real_gradle/RESULTS.txt', 'utf8').split('\n').filter(l => l && l[0] !== '#');
let bad = 0;
for (const l of lines) {
  const [sel, vers, real] = l.split('|');
  const r = G.select(sel, vers.split(','));
  const js = r.chosen === null || (r.selector.kind === 'exact' && vers.split(',').indexOf(r.chosen) < 0) ? 'FAIL' : r.chosen;
  if (js !== real) { bad++; console.log('MISMATCH', l, 'js', js); }
}
console.log(`${lines.length - bad}/${lines.length} real Gradle resolutions predicted`);
process.exit(bad ? 1 : 0);
