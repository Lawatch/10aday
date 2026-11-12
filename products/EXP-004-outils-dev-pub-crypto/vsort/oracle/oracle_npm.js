// npm — node-semver: valid() + compare(). Usage: SEMVER=<path to semver> node oracle_npm.js < inputs.json
const S = require(process.env.SEMVER || 'semver'); const vs = JSON.parse(require('fs').readFileSync(0, 'utf8')).versions;
const canon = vs.map(v => S.valid(v) || null);
const cmp = vs.map((a, i) => canon[i] === null ? null : vs.map((b, j) => canon[j] === null ? null : S.compare(a, b)));
console.log(JSON.stringify({ tool: 'node-semver ' + require((process.env.SEMVER || 'semver') + '/package.json').version, canon, cmp }));
