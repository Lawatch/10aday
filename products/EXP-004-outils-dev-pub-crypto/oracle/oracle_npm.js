// node-semver (npm's resolver) — default options (no loose, no includePrerelease)
const semver = require(process.env.SEMVER || '/opt/node-tools/node_modules/semver');
const {constraints, versions} = JSON.parse(require('fs').readFileSync('inputs.json', 'utf8'));
const out = {tool: 'node-semver ' + require((process.env.SEMVER || '/opt/node-tools/node_modules/semver') + '/package.json').version, results: {}};
for (const c of constraints) {
  let r; try { r = new semver.Range(c); } catch (e) { out.results[c] = {valid: false}; continue; }
  const m = {};
  for (const v of versions) m[v] = semver.valid(v) ? semver.satisfies(v, r) : null;
  out.results[c] = {valid: true, range: r.range, matches: m};
}
console.log(JSON.stringify(out, null, 1));
