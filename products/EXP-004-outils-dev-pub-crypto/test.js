// Compare vcc.js with the oracle fixtures (oracle/*.json). Usage: node test.js [fixtureDir]
const path = require('path'); const fs = require('fs');
const dir = process.argv[2] || path.join(__dirname, 'oracle');
global.nodeSemver = (function () { const m = {}; const src = fs.readFileSync(path.join(__dirname, 'semver.min.js'), 'utf8'); new Function('globalThis', src + ';globalThis.nodeSemver=nodeSemver;')(m); return m.nodeSemver; })();
const VCC = require('./vcc.js');
const files = { npm: 'npm.json', cargo: 'cargo.json', composer: 'composer.json', pip: 'pip.json', rubygems: 'ruby.json' };
let total = 0, bad = 0;
for (const [eco, f] of Object.entries(files)) {
  const o = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); let eb = 0, et = 0;
  for (const [c, r] of Object.entries(o.results)) {
    const p = VCC[eco].parse(c); et++;
    if (p.valid !== r.valid) { eb++; if (eb <= 8) console.log(`${eco} validity ${JSON.stringify(c)}: got ${p.valid} want ${r.valid}`); continue; }
    if (!r.valid) continue;
    for (const [v, want] of Object.entries(r.matches)) {
      et++; const got = p.test(v);
      if (got !== want) { eb++; if (eb <= 8) console.log(`${eco} ${JSON.stringify(c)} ${v}: got ${got} want ${want}`); }
    }
  }
  console.log(`${eco} (${o.tool}): ${et - eb}/${et} OK`); total += et; bad += eb;
}
console.log(`TOTAL ${total - bad}/${total}`); process.exit(bad ? 1 : 0);
