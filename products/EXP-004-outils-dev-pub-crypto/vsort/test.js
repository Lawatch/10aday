// Checks vcc.js canon()/compare() against the oracle fixtures: node vsort/test.js [fixtures dir ...]
const fs = require('fs'), path = require('path');
global.nodeSemver = (function () { const m = {}; const src = fs.readFileSync(path.join(__dirname, '../semver.min.js'), 'utf8'); new Function('globalThis', src + ';globalThis.nodeSemver=nodeSemver;')(m); return m.nodeSemver; })();
const V = require('../vcc.js');
const dirs = process.argv.slice(2).length ? process.argv.slice(2) : [path.join(__dirname, 'fixtures')];
let total = 0, bad = 0;
for (const d of dirs) {
  const vs = JSON.parse(fs.readFileSync(path.join(d, 'inputs.json'), 'utf8')).versions;
  for (const eco of V.ecosystems) {
    const o = JSON.parse(fs.readFileSync(path.join(d, eco + '.json'), 'utf8')); let e = 0;
    vs.forEach((a, i) => {
      const valid = V[eco].canon(a) !== null; total++;
      if (valid !== (o.canon[i] !== null)) { e++; if (e < 6) console.log(`${eco} validity ${JSON.stringify(a)}: js ${valid} ref ${o.canon[i]}`); }
      if (o.cmp[i] === null) return;
      vs.forEach((b, j) => {
        if (o.cmp[i][j] === null) return; total++;
        const c = V[eco].compare(a, b);
        if (c !== o.cmp[i][j]) { e++; if (e < 6) console.log(`${eco} ${a} vs ${b}: js ${c} ref ${o.cmp[i][j]}`); }
      });
    });
    bad += e; if (e) console.log(`${path.basename(d)} ${eco} (${o.tool}): ${e} mismatches`);
  }
}
console.log(`${total - bad}/${total} checks OK`); process.exit(bad ? 1 : 0);
