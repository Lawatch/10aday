// Every comparison stated in the text of docs/tools/version-sorter/ (FAQ, rules, "Why" column), checked with vcc.js.
// Order: npm, cargo, composer, pip, rubygems. null = invalid there.
const fs = require('fs'), path = require('path'), assert = require('assert');
global.nodeSemver = (function () { const m = {}; const src = fs.readFileSync(path.join(__dirname, '../semver.min.js'), 'utf8'); new Function('globalThis', src + ';globalThis.nodeSemver=nodeSemver;')(m); return m.nodeSemver; })();
const V = require('../vcc.js'), N = null;
const C = [
  ['1.0.0-rc.1', '1.0.0', [-1, -1, -1, -1, -1]],
  ['1.0.0-alpha.10', '1.0.0-alpha.2', [1, 1, 1, 1, 1]],
  ['1.0.0-alpha10', '1.0.0-alpha2', [-1, -1, 1, 1, 1]],
  ['1.0.0-1', '1.0.0', [-1, -1, N, 1, -1]],
  ['1.0', '1.0.0', [N, N, 0, 0, 0]],
  ['1.0.0+build.1', '1.0.0', [0, 0, 0, 1, N]],
  ['dev-master', '2.0.0', [N, N, 1, N, N]],
  ['dev-main', 'dev-feature', [N, N, 0, N, N]],
  ['dev-default', '99.0.0', [N, N, 1, N, N]],
  ['dev-trunk', '99.0.0', [N, N, 1, N, N]],
  ['1.0.0.post1', '1.0.0', [N, N, N, 1, -1]],
  ['1.0.0.dev1', '1.0.0a1', [N, N, N, -1, 1]],
  ['1.0.0-dev', '1.0.0-alpha', [1, 1, -1, -1, 1]],
  ['1.0.0-patch1', '1.0.0', [-1, -1, 1, N, -1]],
  ['v1.2.3', '1.2.3', [0, N, 0, 0, N]],
  ['1.0.0-SNAPSHOT', '1.0.0', [-1, -1, N, N, -1]],
  ['1.10', '1.9', [N, N, 1, 1, 1]],
  ['1.10.0', '1.9.0', [1, 1, 1, 1, 1]],
  ['1.0.0-RC', '1.0.0-alpha', [-1, -1, 1, 1, -1]],   // ASCII: "RC" < "alpha" in SemVer
  ['1.0', '1', [N, N, 0, 0, 0]],
  ['1.0.0-rc.1', '1.0.0rc1', [N, N, 0, 0, -1]],
  ['1.0.0-1', '1.0.0.post1', [N, N, N, 0, 1]],
  ['1.0.0.dev1', '1.0.0a1', [N, N, N, -1, 1]],
  ['1.0.0a1', '1.0.0b1', [N, N, -1, -1, -1]], ['1.0.0b1', '1.0.0rc1', [N, N, -1, -1, -1]], ['1.0.0rc1', '1.0.0', [N, N, -1, -1, -1]],
  ['1.0.0+local.7', '1.0.0', [0, 0, 0, 1, N]],
  ['1.0.0-dev', '1.0.0-alpha1', [1, 1, -1, -1, 1]], ['1.0.0-alpha1', '1.0.0-beta1', [-1, -1, -1, -1, -1]],
  ['1.0.0-beta1', '1.0.0-RC1', [1, 1, -1, -1, 1]], ['1.0.0-RC1', '1.0.0', [-1, -1, -1, -1, -1]], ['1.0.0', '1.0.0-patch1', [1, 1, -1, N, 1]],
];
let n = 0, bad = 0;
for (const [a, b, exp] of C) V.ecosystems.forEach((e, k) => { n++; const c = V[e].compare(a, b); if (c !== exp[k]) { bad++; console.log(`${e}: ${a} vs ${b}: got ${c}, expected ${exp[k]}`); } });
if (bad) process.exit(1);
assert.strictEqual(V.composer.canon('1.2'), '1.2.0.0'); assert.strictEqual(V.composer.canon('dev-master'), '9999999-dev');
assert.strictEqual(V.pip.canon('1.0.0-rc.1'), '1.0.0rc1'); assert.strictEqual(V.pip.canon('1.0.0-1'), '1.0.0.post1');
assert.strictEqual(V.rubygems.canon('1.0.0-rc.1'), '1.0.0.pre.rc.1');
console.log(`claims OK (${n + 5})`);
