#!/usr/bin/env node
/* version-range-mcp — an MCP server (stdio) that answers "does this version match this constraint?"
 * exactly as each package manager would: npm, Cargo, Composer, pip, RubyGems, Maven, Gradle, NuGet.
 * The engines are ports of each tool's own code, checked against the real tools (millions of cases, 0 mismatch):
 * see https://github.com/Lawatch/10aday/tree/main/products/EXP-004-outils-dev-pub-crypto
 * No dependency. Only resolve_from_registry uses the network (public registries, read-only, no key). Built and maintained by AI agents (project 10aday). MIT licence.
 */
'use strict';
const path = require('path');
const fs = require('fs');
const E = path.join(__dirname, 'engines');
global.nodeSemver = (function () {
  const m = {}; const src = fs.readFileSync(path.join(E, 'semver.min.js'), 'utf8');
  new Function('globalThis', src + ';globalThis.nodeSemver=nodeSemver;')(m); return m.nodeSemver;
})();
const VCC = require(path.join(E, 'vcc.js'));
const MVR = require(path.join(E, 'mvr.js'));
const NVR = require(path.join(E, 'nvr.js'));
const GVR = require(path.join(E, 'gvr.js'));

const SERVER = { name: 'version-range-mcp', version: '1.2.0' };
const ECOS = ['npm', 'cargo', 'composer', 'pip', 'rubygems', 'maven', 'gradle', 'nuget'];
const PICK_RULE = {
  npm: 'highest matching version (npm install)', cargo: 'highest matching version (cargo update)',
  composer: 'highest matching version (composer update)', pip: 'highest matching version; pre-releases skipped unless no final matches or the constraint names one (pip install)',
  rubygems: 'highest matching version (bundle update)', maven: 'highest version inside the range; a bare version is only a soft preference (Maven 3.9)',
  gradle: 'highest accepted version (Gradle 8.14 dynamic versions)', nuget: 'LOWEST applicable version, unless the range floats with * (NuGet restore)'
};

// ---- one engine interface: check(constraint, versions) -> {valid, normalized, error, results:[{version, matches}], picked}
function cmpFor(eco) {
  if (VCC[eco] && VCC[eco].compare) return VCC[eco].compare;
  if (eco === 'maven') return MVR.compare;
  if (eco === 'gradle') return function (a, b) { return Math.sign(GVR.compare(a, b)); };
  if (eco === 'nuget') return function (a, b) { const x = NVR.parseVersion(a), y = NVR.parseVersion(b); return (x && y) ? Math.sign(NVR.compare(x, y)) : null; };
  return null;
}
function highest(eco, vs) {
  const cmp = cmpFor(eco); let best = null;
  for (const v of vs) if (best === null || cmp(v, best) > 0) best = v;
  return best;
}
function check(eco, constraint, versions) {
  const out = { ecosystem: eco, constraint: constraint, valid: true, normalized: null, error: null, results: [], picked: null, pick_rule: PICK_RULE[eco] };
  if (VCC[eco]) {
    const p = VCC[eco].parse(constraint);
    if (!p.valid) { out.valid = false; out.error = p.error || ('not a valid ' + eco + ' constraint'); return out; }
    out.normalized = p.normalized || null;
    const ok = [];
    for (const v of versions) {
      const m = p.test(v);
      out.results.push({ version: v, matches: m === null ? null : !!m, note: m === null ? 'not a valid ' + eco + ' version' : undefined });
      if (m) ok.push(v);
    }
    if (eco === 'pip') { // pip skips pre-releases when a final release matches, unless the specifier itself mentions a pre-release
      const PRE = /(?:a|b|rc)\d+|\.dev\d+/;
      const pre = function (v) { return PRE.test(VCC.pip.canon(v) || ''); };
      const finals = ok.filter(function (v) { return !pre(v); });
      out.picked = (finals.length && !PRE.test(out.normalized || constraint)) ? highest(eco, finals) : highest(eco, ok);
    } else out.picked = highest(eco, ok);
    return out;
  }
  if (eco === 'maven') {
    let C; try { C = MVR.parseConstraint(constraint); } catch (e) { out.valid = false; out.error = e.message; return out; }
    const ok = [];
    for (const v of versions) { const m = MVR.contains(C, v); out.results.push({ version: v, matches: m }); if (m) ok.push(v); }
    if (C.soft) { out.normalized = constraint + ' (soft requirement: Maven uses exactly this version unless another dependency forces a different one)'; out.picked = constraint; }
    else out.picked = highest(eco, ok);
    return out;
  }
  if (eco === 'gradle') {
    const r = GVR.select(constraint, versions);
    const acc = new Set(r.accepted);
    for (const v of versions) out.results.push({ version: v, matches: acc.has(v) });
    out.normalized = r.selector.kind + ' selector';
    out.picked = r.chosen;
    return out;
  }
  if (eco === 'nuget') {
    const R = NVR.parseRange(constraint);
    if (!R) { out.valid = false; out.error = 'not a valid NuGet version range'; return out; }
    out.normalized = NVR.rangeNormalized(R);
    const parsed = [];
    for (const v of versions) {
      const pv = NVR.parseVersion(v);
      if (!pv) { out.results.push({ version: v, matches: null, note: 'not a valid NuGet version' }); continue; }
      const ex = NVR.exclusion(R, pv);
      out.results.push({ version: v, matches: ex === null, note: ex === 'prerelease' ? 'pre-release, excluded because the range has no pre-release bound' : undefined });
      parsed.push([v, pv]);
    }
    const best = NVR.findBestMatch(R, parsed.map(function (x) { return x[1]; }));
    out.picked = best ? parsed.find(function (x) { return x[1] === best; })[0] : null;
    return out;
  }
  throw new Error('unknown ecosystem ' + eco);
}
function sortVersions(eco, versions) {
  const cmp = cmpFor(eco), valid = [], invalid = [];
  for (const v of versions) (cmp(v, v) === null ? invalid : valid).push(v);
  valid.sort(cmp);
  return { ecosystem: eco, ascending: valid, invalid: invalid };
}

// ---- live registries (read-only, public, no key). Returns the list of published versions.
const UA = { 'User-Agent': 'version-range-mcp (+https://github.com/Lawatch/10aday)', Accept: 'application/json' };
async function getText(url) {
  const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(20000) });
  if (r.status === 404) throw new Error('package not found (' + url + ')');
  if (!r.ok) throw new Error('registry answered HTTP ' + r.status + ' for ' + url);
  return r.text();
}
async function getJson(url) { return JSON.parse(await getText(url)); }
function mavenPath(pkg) {
  const m = /^([A-Za-z0-9_.\-]+):([A-Za-z0-9_.\-]+)$/.exec(pkg);
  if (!m) throw new Error('for maven and gradle, package must be "groupId:artifactId", e.g. "com.google.guava:guava"');
  return m[1].replace(/\./g, '/') + '/' + m[2];
}
const REGISTRY = {
  npm: { name: 'registry.npmjs.org', fetch: async function (p) { const j = await getJson('https://registry.npmjs.org/' + encodeURIComponent(p).replace('%40', '@')); return { versions: Object.keys(j.versions || {}), source: 'https://www.npmjs.com/package/' + p }; } },
  cargo: { name: 'crates.io', fetch: async function (p) { const j = await getJson('https://crates.io/api/v1/crates/' + encodeURIComponent(p) + '/versions'); const all = j.versions || []; return { versions: all.filter(function (v) { return !v.yanked; }).map(function (v) { return v.num; }), skipped: all.filter(function (v) { return v.yanked; }).length + ' yanked', source: 'https://crates.io/crates/' + p }; } },
  composer: { name: 'repo.packagist.org', fetch: async function (p) { if (!/^[a-z0-9_.\-]+\/[a-z0-9_.\-]+$/.test(p)) throw new Error('composer package must be "vendor/name" in lower case'); const j = await getJson('https://repo.packagist.org/p2/' + p + '.json'); return { versions: ((j.packages || {})[p] || []).map(function (v) { return v.version; }), source: 'https://packagist.org/packages/' + p }; } },
  pip: { name: 'pypi.org', fetch: async function (p) { const j = await getJson('https://pypi.org/pypi/' + encodeURIComponent(p) + '/json'); const rel = j.releases || {}; const keep = [], yanked = []; for (const v of Object.keys(rel)) { const f = rel[v]; if (f.length && f.every(function (x) { return x.yanked; })) yanked.push(v); else keep.push(v); } return { versions: keep, skipped: yanked.length + ' yanked', source: 'https://pypi.org/project/' + p + '/' }; } },
  rubygems: { name: 'rubygems.org', fetch: async function (p) { const j = await getJson('https://rubygems.org/api/v1/versions/' + encodeURIComponent(p) + '.json'); return { versions: Array.from(new Set(j.map(function (v) { return v.number; }))), source: 'https://rubygems.org/gems/' + p }; } },
  maven: { name: 'Maven Central', fetch: mavenCentral },
  gradle: { name: 'Maven Central', fetch: mavenCentral },
  nuget: { name: 'api.nuget.org', fetch: async function (p) { const j = await getJson('https://api.nuget.org/v3-flatcontainer/' + encodeURIComponent(p.toLowerCase()) + '/index.json'); return { versions: j.versions || [], skipped: 'unlisted versions are included (NuGet restore can still pick them)', source: 'https://www.nuget.org/packages/' + p }; } }
};
async function mavenCentral(p) {
  const x = await getText('https://repo1.maven.org/maven2/' + mavenPath(p) + '/maven-metadata.xml');
  const vs = []; const re = /<version>([^<]+)<\/version>/g; let m;
  const block = (/<versions>([\s\S]*?)<\/versions>/.exec(x) || [, ''])[1];
  while ((m = re.exec(block))) vs.push(m[1].trim());
  return { versions: vs, source: 'https://central.sonatype.com/artifact/' + p.replace(':', '/') };
}
async function resolveFromRegistry(a) {
  if (ECOS.indexOf(a.ecosystem) < 0) throw new Error('ecosystem must be one of ' + ECOS.join(', '));
  if (typeof a.package !== 'string' || !a.package || a.package.length > 214) throw new Error('package must be a non-empty string');
  if (typeof a.constraint !== 'string') throw new Error('constraint must be a string');
  const reg = REGISTRY[a.ecosystem], got = await reg.fetch(a.package.trim());
  const r = check(a.ecosystem, a.constraint, got.versions);
  if (!r.valid) return { ecosystem: a.ecosystem, package: a.package, constraint: a.constraint, valid: false, error: r.error };
  const ok = r.results.filter(function (x) { return x.matches; }).map(function (x) { return x.version; });
  const sorted = sortVersions(a.ecosystem, ok).ascending;
  return { ecosystem: a.ecosystem, package: a.package, constraint: a.constraint, normalized: r.normalized,
    installs: r.picked, pick_rule: r.pick_rule, newest_published: highest(a.ecosystem, got.versions.filter(function (v) { return cmpFor(a.ecosystem)(v, v) !== null; })),
    matching_count: ok.length, published_count: got.versions.length, matching_newest: sorted.slice(-10).reverse(),
    registry: reg.name, source: got.source, note: got.skipped, checked_at: new Date().toISOString() };
}

// ---- MCP tools
const ecoProp = { type: 'string', enum: ECOS, description: 'Package manager whose rules apply.' };
const verProp = { type: 'array', items: { type: 'string' }, description: 'Published versions to test, e.g. ["1.2.0","1.3.0-beta.1","2.0.0"].' };
const TOOLS = [
  { name: 'resolve_from_registry',
    description: 'Look up a real package on its public registry (npmjs, crates.io, Packagist, PyPI, RubyGems, Maven Central, NuGet) and tell which published version a constraint installs today, with the exact rules of that package manager. Use it before writing or changing a dependency line. For maven and gradle, package is "groupId:artifactId".',
    inputSchema: { type: 'object', properties: { ecosystem: ecoProp, package: { type: 'string', description: 'Package name, e.g. "express", "serde", "laravel/framework", "requests", "rails", "com.google.guava:guava", "Newtonsoft.Json".' }, constraint: { type: 'string', description: 'Constraint as written in the manifest, e.g. "^4.18", "~=2.31", "[32.0,33.0)", "13.*".' } }, required: ['ecosystem', 'package', 'constraint'] },
    annotations: { readOnlyHint: true, openWorldHint: true } },
  { name: 'check_version_constraint',
    description: 'Tell which versions a dependency constraint accepts, and which one gets installed, using the exact rules of one package manager (npm, cargo, composer, pip, rubygems, maven, gradle, nuget). Pre-releases, carets, tildes, wildcards, Maven/NuGet interval ranges and Gradle "+" selectors behave as in the real tool.',
    inputSchema: { type: 'object', properties: { ecosystem: ecoProp, constraint: { type: 'string', description: 'Constraint as written in the manifest, e.g. "^1.2", "~=3.10", "[1.0,2.0)", "1.+".' }, versions: verProp }, required: ['ecosystem', 'constraint', 'versions'] },
    annotations: { readOnlyHint: true, openWorldHint: false } },
  { name: 'compare_across_ecosystems',
    description: 'Evaluate the SAME constraint string in every package manager that accepts it and list where they disagree (e.g. "^0.2" or "1.0" or "[1.0,2.0)" mean different things in npm, Cargo, Composer, Maven, NuGet...). Useful when porting a dependency between languages.',
    inputSchema: { type: 'object', properties: { constraint: { type: 'string' }, versions: verProp }, required: ['constraint', 'versions'] },
    annotations: { readOnlyHint: true, openWorldHint: false } },
  { name: 'sort_versions',
    description: 'Sort version strings in the order a given package manager uses (e.g. Maven puts 1.0-alpha < 1.0 < 1.0-sp; pip puts 1.0.dev0 < 1.0a1 < 1.0 < 1.0.post1). Invalid versions are returned separately.',
    inputSchema: { type: 'object', properties: { ecosystem: ecoProp, versions: verProp }, required: ['ecosystem', 'versions'] },
    annotations: { readOnlyHint: true, openWorldHint: false } }
];
function strArr(a) { if (!Array.isArray(a) || !a.every(function (x) { return typeof x === 'string'; })) throw new Error('versions must be an array of strings'); if (a.length > 2000) throw new Error('at most 2000 versions'); return a; }
function callTool(name, a) {
  a = a || {};
  if (name === 'check_version_constraint') {
    if (ECOS.indexOf(a.ecosystem) < 0) throw new Error('ecosystem must be one of ' + ECOS.join(', '));
    if (typeof a.constraint !== 'string') throw new Error('constraint must be a string');
    return check(a.ecosystem, a.constraint, strArr(a.versions));
  }
  if (name === 'compare_across_ecosystems') {
    if (typeof a.constraint !== 'string') throw new Error('constraint must be a string');
    const vs = strArr(a.versions), per = {}, invalidIn = [];
    for (const e of ECOS) {
      let r; try { r = check(e, a.constraint, vs); } catch (x) { r = { valid: false, error: x.message }; }
      if (!r.valid) { invalidIn.push(e); continue; }
      per[e] = { matches: r.results.filter(function (x) { return x.matches; }).map(function (x) { return x.version; }), picked: r.picked };
    }
    const groups = {};
    for (const e of Object.keys(per)) { const k = JSON.stringify(per[e]); (groups[k] = groups[k] || { ecosystems: [], matches: per[e].matches, picked: per[e].picked }).ecosystems.push(e); }
    const g = Object.values(groups);
    return { constraint: a.constraint, all_agree: g.length <= 1, groups: g, invalid_in: invalidIn };
  }
  if (name === 'sort_versions') {
    if (ECOS.indexOf(a.ecosystem) < 0) throw new Error('ecosystem must be one of ' + ECOS.join(', '));
    return sortVersions(a.ecosystem, strArr(a.versions));
  }
  throw new Error('unknown tool ' + name);
}

// ---- JSON-RPC over stdio (newline-delimited)
const SUPPORTED = ['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05'];
function send(msg) { process.stdout.write(JSON.stringify(msg) + '\n'); }
function handle(msg) {
  if (!msg || msg.jsonrpc !== '2.0') return;
  const id = msg.id, isReq = id !== undefined && id !== null;
  try {
    switch (msg.method) {
      case 'initialize': {
        const want = msg.params && msg.params.protocolVersion;
        return send({ jsonrpc: '2.0', id: id, result: { protocolVersion: SUPPORTED.indexOf(want) >= 0 ? want : SUPPORTED[1], capabilities: { tools: { listChanged: false } }, serverInfo: SERVER,
          instructions: 'Use resolve_from_registry to learn which real version a constraint installs today. Use these tools whenever you need to know which version a dependency constraint really resolves to. Do not guess semver rules: they differ between package managers.' } });
      }
      case 'ping': return isReq && send({ jsonrpc: '2.0', id: id, result: {} });
      case 'tools/list': return send({ jsonrpc: '2.0', id: id, result: { tools: TOOLS } });
      case 'tools/call': {
        const reply = function (res, isError) { send({ jsonrpc: '2.0', id: id, result: { content: [{ type: 'text', text: JSON.stringify(res, null, 1) }], structuredContent: isError ? undefined : res, isError: isError } }); };
        const nm = msg.params && msg.params.name, args = msg.params && msg.params.arguments;
        if (nm === 'resolve_from_registry') { resolveFromRegistry(args || {}).then(function (r) { reply(r, false); }, function (e) { reply({ error: e.message }, true); }); return; }
        try { reply(callTool(nm, args), false); } catch (e) { reply({ error: e.message }, true); }
        return;
      }
      default:
        if (isReq) send({ jsonrpc: '2.0', id: id, error: { code: -32601, message: 'Method not found: ' + msg.method } });
    }
  } catch (e) { if (isReq) send({ jsonrpc: '2.0', id: id, error: { code: -32603, message: e.message } }); }
}
if (require.main === module) {
  let buf = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', function (d) {
    buf += d; let i;
    while ((i = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
      if (!line) continue;
      let m; try { m = JSON.parse(line); } catch (e) { send({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }); continue; }
      if (Array.isArray(m)) m.forEach(handle); else handle(m);
    }
  });
  // stdin closed: the process exits by itself once pending registry lookups have answered.
}
module.exports = { check: check, callTool: callTool, resolveFromRegistry: resolveFromRegistry, TOOLS: TOOLS };
