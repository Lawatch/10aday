// End-to-end: convert sample, then verify with Python (tomllib + packaging)
const P = require('./p2p.js'), fs = require('fs'), cp = require('child_process'), path = require('path');
const src = fs.readFileSync(path.join(__dirname, 'oracle/sample.pyproject.toml'), 'utf8');
const r = P.convert(src);
console.log(r.toml); console.log('NOTES:\n- ' + r.notes.join('\n- '));
const tmp = path.join(require('os').tmpdir(), 'p2p-out.toml'); fs.writeFileSync(tmp, r.toml);
// TOML reader parity with tomllib
fs.writeFileSync(tmp + '.json', JSON.stringify(P.parseToml(src)));
const py = `
import tomllib, json, sys
from packaging.requirements import Requirement
from packaging.specifiers import SpecifierSet
src = tomllib.load(open(sys.argv[3], 'rb'))
mine = json.load(open(sys.argv[2]))
assert src == mine, 'TOML parse differs'
d = tomllib.load(open(sys.argv[1], 'rb'))
reqs = d['project']['dependencies'] + sum(d['project'].get('optional-dependencies', {}).values(), []) + sum(d.get('dependency-groups', {}).values(), [])
bad = [x for x in reqs if '#' in x]
for x in reqs:
    if '#' in x: continue
    Requirement(x)
SpecifierSet(d['project']['requires-python'])
print('OK', len(reqs), 'requirements valid; flagged by hand:', bad)
`;
const out = cp.execFileSync('python3', ['-c', py, tmp, tmp + '.json', path.join(__dirname, 'oracle/sample.pyproject.toml')]).toString();
console.log(out);
const pub = fs.readFileSync(path.join(__dirname, '../../../docs/tools/poetry-to-pep621/p2p.js'), 'utf8');
if (pub !== fs.readFileSync(path.join(__dirname, 'p2p.js'), 'utf8')) { console.error('docs copy of p2p.js is out of date'); process.exit(1); }
console.log('docs copy identical');
