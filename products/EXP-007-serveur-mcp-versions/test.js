// Tests of the MCP server. Usage: node test.js  (exit 1 on failure)
// 1) engines/ must be identical to the tested engines of EXP-004 (when that folder is present);
// 2) key cases checked earlier against the real tools (npm, pip, Maven 3.9.11, Gradle 8.14.3, dotnet restore);
// 3) a real stdio session: initialize, tools/list, tools/call.
'use strict';
const fs = require('fs'), path = require('path'), cp = require('child_process'), assert = require('assert');
const S = require('./server.js');
let n = 0;
const src = path.join(__dirname, '..', 'EXP-004-outils-dev-pub-crypto');
if (fs.existsSync(src)) {
  for (const [f, from] of [['vcc.js', 'vcc.js'], ['semver.min.js', 'semver.min.js'], ['mvr.js', 'mvr/mvr.js'], ['nvr.js', 'nvr/nvr.js'], ['gvr.js', 'gvr/gvr.js']]) {
    assert.strictEqual(fs.readFileSync(path.join(__dirname, 'engines', f), 'utf8'), fs.readFileSync(path.join(src, from), 'utf8'), 'engine copy differs: ' + f); n++;
  }
}
function pick(eco, c, vs) { return S.callTool('check_version_constraint', { ecosystem: eco, constraint: c, versions: vs }).picked; }
const cases = [
  ['npm', '^0.2', ['0.2.0', '0.2.5', '0.3.0'], '0.2.5'],
  ['npm', '^1.2.0', ['1.2.0', '1.9.0', '2.0.0-beta.1'], '1.9.0'],
  ['cargo', '0.2', ['0.2.0', '0.2.9', '0.3.0'], '0.2.9'],
  ['composer', '~1.2', ['1.2.0', '1.9.0', '2.0.0'], '1.9.0'],
  ['pip', '~=3.10', ['3.10', '3.11', '4.0'], '3.11'],
  ['pip', '>=1.0', ['1.0', '1.1', '2.0rc1'], '1.1'],
  ['rubygems', '~> 2.2', ['2.2.0', '2.9.0', '3.0.0'], '2.9.0'],
  ['maven', '[1.0,2.0)', ['1.0', '1.9.9', '2.0-rc1', '2.0'], '2.0-rc1'],          // real Maven 3.9.11
  ['gradle', '[1.0,2.0)', ['1.0', '1.9.9', '2.0-rc1', '2.0'], '1.9.9'],           // real Gradle 8.14.3
  ['gradle', '1.+', ['1.0', '1.9', '2.0'], '1.9'],
  ['nuget', '1.0', ['1.0.0', '1.2.0', '2.0.0'], '1.0.0'],                         // real dotnet restore: lowest
  ['nuget', '1.*', ['1.0.0', '1.2.0', '2.0.0'], '1.2.0']
];
for (const [e, c, vs, want] of cases) { assert.strictEqual(pick(e, c, vs), want, e + ' ' + c); n++; }
const x = S.callTool('compare_across_ecosystems', { constraint: '[1.0,2.0)', versions: ['1.0', '1.5', '2.0-rc1', '2.0'] });
assert.strictEqual(x.all_agree, false); n++;
assert.deepStrictEqual(S.callTool('sort_versions', { ecosystem: 'maven', versions: ['1.0-sp', '1.0', '1.0-alpha', '1.0-SNAPSHOT'] }).ascending, ['1.0-alpha', '1.0-SNAPSHOT', '1.0', '1.0-sp']); n++;
assert.strictEqual(S.callTool('check_version_constraint', { ecosystem: 'nuget', constraint: '[1.0', versions: ['1.0.0'] }).valid, false); n++;
const input = [
  { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 't', version: '0' } } },
  { jsonrpc: '2.0', method: 'notifications/initialized' },
  { jsonrpc: '2.0', id: 2, method: 'tools/list' },
  { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'check_version_constraint', arguments: { ecosystem: 'npm', constraint: '~1.2', versions: ['1.2.3', '1.3.0'] } } },
  { jsonrpc: '2.0', id: 4, method: 'nope' }
].map(JSON.stringify).join('\n') + '\n';
const out = cp.execFileSync(process.execPath, [path.join(__dirname, 'server.js')], { input }).toString().trim().split('\n').map(JSON.parse);
assert.strictEqual(out.length, 4); assert.strictEqual(out[0].result.serverInfo.name, 'version-range-mcp');
assert.strictEqual(out[1].result.tools.length, 3);
assert.strictEqual(out[2].result.structuredContent.picked, '1.2.3'); assert.strictEqual(out[3].error.code, -32601); n += 4;
const sj = JSON.parse(fs.readFileSync(path.join(__dirname, 'server.json'), 'utf8'));
assert.ok(sj.description.length <= 100); assert.ok(sj.packages[0].identifier.endsWith(':' + sj.version)); n += 2;
assert.ok(fs.readFileSync(path.join(__dirname, 'Dockerfile'), 'utf8').includes('io.modelcontextprotocol.server.name="' + sj.name + '"')); n++;
console.log('OK ' + n + ' checks');
