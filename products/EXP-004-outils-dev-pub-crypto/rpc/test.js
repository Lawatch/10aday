// Checks that the published copy is identical and that key verdicts hold. Full oracle: node rpc/dump.js N > f.json && python3 rpc/oracle.py f.json
const fs = require('fs'), path = require('path'), assert = require('assert');
const src = path.join(__dirname, 'rpc.js'), pub = path.join(__dirname, '../../../docs/tools/requires-python-checker/rpc.js');
assert.strictEqual(fs.readFileSync(src, 'utf8'), fs.readFileSync(pub, 'utf8'), 'docs copy of rpc.js differs');
const R = require('./rpc.js'), lab = (s, m) => R.analyze(s).minors.find(x => x.minor === m).label;
assert.strictEqual(lab('<=3.12', '3.12'), 'only 3.12.0');
assert.strictEqual(lab('==3.10', '3.10'), 'only 3.10.0');
assert.strictEqual(lab('>3.10', '3.10'), '3.10.1 and later');
assert.strictEqual(R.analyze('^3.10').suggestion, '>=3.10,<4.0');
assert.strictEqual(R.analyze('foo').valid, false);
console.log('rpc OK');
