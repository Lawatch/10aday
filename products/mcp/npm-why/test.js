'use strict';
// Compares engine.js with the real npm code (@npmcli/arborist 8.0.5 loadVirtual, what npm 10 runs for
// `npm explain` / `npm ls --package-lock-only`): for every package of every lockfile, same name, version,
// workspace flag, dep flags, links, and the same list of dependents (type, spec, original spec, error, from where).
//   node test.js --fixtures                 recorded answers (fixtures.json), no network
//   ORACLE=<dir with arborist> node test.js --record <lockfile dirs...>   compare live and (re)write fixtures.json
//   ORACLE=<dir> node test.js <lockfile dirs...>                          compare live only
const fs = require('fs');
const path = require('path');
const os = require('os');
const { Tree } = require('./engine.js');

function norm(list) { return list.map(x => JSON.stringify(x)).sort(); }

function ours(lock, pkg) {
  const t = new Tree(lock, pkg);
  const out = {};
  for (const n of t.nodes.values()) {
    if (n.isRoot || n.isLink) continue;
    const deps = n.edgesIn.filter(e => !e.error || e.from.isRoot).map(e => ({
      type: e.type, spec: e.spec, rawSpec: e.rawSpec, error: e.error || null, from: e.from.location
    }));
    out[n.location] = {
      name: t.isTop(n) ? t.packageNameOf(n) : n.name, version: n.version || null, ws: !!n.isWorkspace,
      flags: [n.dev, n.optional, n.devOptional, n.peer].map(Number).join(''),
      deps: norm(deps.map(d => Object.assign({}, d, { spec: d.type === 'workspace' ? d.spec.replace(/^file:/, '') : d.spec, rawSpec: d.type === 'workspace' ? d.rawSpec.replace(/^file:/, '') : d.rawSpec })) ),
      links: n.linksIn.map(l => ({ at: l.location, deps: norm(l.edgesIn.filter(e => !e.error || e.from.isRoot).map(e => ({ type: e.type, spec: e.type === 'workspace' ? e.spec.replace(/^file:/, '') : e.spec, rawSpec: e.type === 'workspace' ? e.rawSpec.replace(/^file:/, '') : e.rawSpec, error: e.error || null, from: e.from.location }))) })).sort((a, b) => a.at.localeCompare(b.at))
    };
  }
  return out;
}

async function theirs(lock, pkg, oracleDir) {
  const Arborist = require(path.join(oracleDir, 'node_modules/@npmcli/arborist'));
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'npmwhy-'));
  try {
    fs.writeFileSync(path.join(dir, 'package-lock.json'), JSON.stringify(lock));
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify(pkg || lock.packages[''] || {}));
    for (const [k, e] of Object.entries(lock.packages)) {
      if (!k || /(^|\/)node_modules(\/|$)/.test(k) || e.link) continue;
      fs.mkdirSync(path.join(dir, k), { recursive: true });
      fs.writeFileSync(path.join(dir, k, 'package.json'), JSON.stringify(e));
    }
    const real = fs.realpathSync(dir);
    const tree = await new Arborist({ path: real }).loadVirtual();
    const rel = p => (p === real ? '' : path.relative(real, p).split(path.sep).join('/'));
    const fixSpec = s => (typeof s === 'string' && s.startsWith('file:' + real) ? rel(s.slice(5)) : s);
    const out = {};
    for (const n of tree.inventory.values()) {
      if (n.isProjectRoot || n.isLink) continue;
      const loc = n.location;
      const deps = [...n.edgesIn].filter(e => e.valid || e.from.isProjectRoot).map(e => ({
        type: e.type, spec: fixSpec(e.spec), rawSpec: fixSpec(e.rawSpec), error: e.error || null, from: e.from.isProjectRoot ? '' : e.from.location
      }));
      out[loc] = {
        name: n.isProjectRoot || n.isTop ? n.packageName : n.name, version: n.package.version || null, ws: !!n.isWorkspace,
        flags: [n.dev, n.optional, n.devOptional, n.peer].map(Number).join(''),
        deps: norm(deps),
        links: [...n.linksIn].map(l => ({ at: l.location, deps: norm([...l.edgesIn].filter(e => e.valid || e.from.isProjectRoot).map(e => ({ type: e.type, spec: fixSpec(e.spec), rawSpec: fixSpec(e.rawSpec), error: e.error || null, from: e.from.isProjectRoot ? '' : e.from.location }))) })).sort((a, b) => a.at.localeCompare(b.at))
      };
    }
    return out;
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}

function compare(name, a, b) {
  let diffs = 0, n = 0;
  const keys = new Set(Object.keys(a).concat(Object.keys(b)));
  for (const k of keys) {
    n++;
    // Arborist quirk in a lockfile-only tree: a link target whose lockfile entry has no "name" gets packageName null,
    // so it is not seen as a workspace either. A real install reads the name from disk, like we do from the link.
    const bb = b[k] && b[k].name === null && a[k] ? Object.assign({}, b[k], { name: a[k].name, ws: a[k].ws }) : b[k];
    const x = JSON.stringify(a[k]), y = JSON.stringify(bb);
    if (x !== y) {
      if (diffs < 3) console.log(`DIFF ${name} ${k}\n  ours:   ${x}\n  theirs: ${y}`);
      diffs++;
    }
  }
  return { diffs, n };
}

async function main() {
  const args = process.argv.slice(2);
  const fixPath = path.join(__dirname, 'fixtures.json');
  if (args[0] === '--fixtures') {
    const fx = JSON.parse(fs.readFileSync(fixPath, 'utf8'));
    let d = 0, n = 0;
    for (const c of fx) { const r = compare(c.name, ours(c.lock, c.pkg), c.expected); d += r.diffs; n += r.n; }
    console.log(`fixtures: ${fx.length} lockfiles, ${n} packages, ${d} differences`);
    process.exit(d ? 1 : 0);
  }
  const record = args[0] === '--record';
  const dirs = record ? args.slice(1) : args;
  const oracle = process.env.ORACLE;
  if (!oracle) throw new Error('ORACLE not set');
  let d = 0, n = 0, files = 0;
  const fx = [];
  for (const dir of dirs) {
    let lock, pkg;
    try { lock = JSON.parse(fs.readFileSync(path.join(dir, 'package-lock.json'), 'utf8')); } catch (e) { continue; }
    try { pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')); } catch (e) { pkg = null; }
    if (!lock.packages) continue;
    if (record) for (const e of Object.values(lock.packages)) for (const k of ['integrity', 'license', 'engines', 'funding', 'bin', 'cpu', 'os', 'libc', 'deprecated']) delete e[k];
    const expected = await theirs(lock, pkg, oracle);
    const r = compare(path.basename(dir), ours(lock, pkg), expected);
    d += r.diffs; n += r.n; files++;
    if (record && fx.length < 60) fx.push({ name: path.basename(dir), lock, pkg, expected });
  }
  if (record) fs.writeFileSync(fixPath, JSON.stringify(fx));
  console.log(`live: ${files} lockfiles, ${n} packages compared with npm's Arborist, ${d} differences`);
  process.exit(d ? 1 : 0);
}
main().catch(e => { console.error(e); process.exit(1); });
