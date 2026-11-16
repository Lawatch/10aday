'use strict';
// Compares engine.js with the real Node resolver (import.meta.resolve and require.resolve) on random packages.
// node test.js --fixtures            : recorded answers (fixtures.json), no oracle needed
// node test.js --oracle N [seed]     : N random packages, written to a temp folder, resolved by this very Node
// node test.js --record N [seed]     : same, and save a sample of cases to fixtures.json
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { pathToFileURL, fileURLToPath } = require('url');
const E = require('./engine.js');

let seed = 1;
function rnd() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }
const pick = a => a[Math.floor(rnd() * a.length)];
const chance = p => rnd() < p;

const FILES = ['index.js', 'main.js', 'main.json', 'lib/a.js', 'lib/a', 'lib/b.mjs', 'lib/c.cjs', 'lib/sub/index.js', 'lib/sub/index.json', 'dist/x.js', 'dist/y.json', 'dist/index.js', 'src/a.js', 'src/b.js', 'feat/one.js', 'feat/two/index.js', 'feat/two/one.js', 'data.json', 'native.node', 'index.json', 'lib/a.json', 'a b.js', 'lib/x.d.ts'];
const STR_TARGETS = ['./index.js', './lib/a.js', './lib/*.js', './lib/*', './dist/*.js', './feat/*/index.js', './missing.js', './lib/', './lib', 'lib/a.js', '../x.js', './node_modules/x.js', './lib/../index.js', '/abs.js', './lib//a.js', './lib/%2fa.js', 'https://x.com/a.js', './*', './src/*.js', './feat/*.js', './dist/index.js', './lib/sub/', './data.json', './*/index.js', './lib/*/index.js', './a b.js', './a%20b.js', './.', './lib/./a.js', './lib/*.d.ts', './*.*'];
const CONDS = ['import', 'require', 'node', 'default', 'browser', 'module-sync', 'node-addons', 'development', 'types', 'worker', 'deno', 'module'];
const KEYS = ['.', './a', './lib/*', './lib/*.js', './feat/*', './*', './dist/', './sub', './x/*/y', './package.json', './lib/sub/*', './*.js', './a*b', './lib/**', './feat/*/index', './lib/a.js', 'nodot', './dist/*'];

function genTarget(d, sub) {
  const r = rnd();
  if (r < 0.5 || d > 2) return sub && chance(0.6) ? pick(STR_TARGETS.filter(t => t.includes('*'))) : pick(STR_TARGETS);
  if (r < 0.58) return null;
  if (r < 0.7) { const n = Math.floor(rnd() * 4); return Array.from({ length: n }, () => genTarget(d + 1, sub)); }
  if (r < 0.72) return pick([5, true, false, {}, '']);
  const o = {}; const n = 1 + Math.floor(rnd() * 4);
  for (let i = 0; i < n; i++) o[chance(0.03) ? '0' : pick(CONDS)] = genTarget(d + 1, sub);
  return o;
}

function genPkg(i) {
  const name = chance(0.2) ? `@sc/p${i}` : `p${i}`;
  const pkg = { name };
  const r = rnd();
  if (r < 0.15) { /* no exports */ }
  else if (r < 0.3) pkg.exports = genTarget(1, false);
  else if (r < 0.4) { const o = {}; for (let k = 0; k < 1 + Math.floor(rnd() * 3); k++) o[pick(CONDS)] = genTarget(1, false); pkg.exports = o; }
  else { const o = {}; for (let k = 0; k < 1 + Math.floor(rnd() * 6); k++) { const key = pick(KEYS); o[key] = genTarget(1, key.includes('*')); } pkg.exports = o; }
  if (chance(0.03)) pkg.exports = pick([5, true, false, null]);
  if (chance(0.5)) pkg.main = pick(['main.js', 'lib', 'lib/a', 'missing', './dist/', 'feat/two', 'main', './lib/sub', 5, '', 'data']);
  if (chance(0.4)) pkg.type = pick(['module', 'commonjs', 'weird']);
  if (chance(0.35)) {
    const im = {};
    for (let k = 0; k < 1 + Math.floor(rnd() * 4); k++) {
      const key = pick(['#a', '#lib/*', '#x', '#*', '#dep', 'bad', '#lib/*.js', '#b/*']);
      im[key] = chance(0.2) ? pick(['fs', 'node:fs', 'path', `p${Math.max(0, i - 1)}`, `p${Math.max(0, i - 1)}/lib/a.js`, 'nope-pkg', 'p*' ]) : genTarget(1, key.includes('*'));
    }
    pkg.imports = chance(0.05) ? pick([[], 'x', 5]) : im;
  }
  const files = FILES.filter(() => chance(0.45));
  const nested = chance(0.1) ? { 'feat/two/package.json': { main: pick(['one.js', 'nope.js', 'one']) } } : {};
  return { name, pkg, files, nested };
}

function specsFor(p) {
  const out = new Set(['.', './package.json']);
  const ex = p.pkg.exports;
  const keys = ex && typeof ex === 'object' && !Array.isArray(ex) ? Object.keys(ex) : [];
  for (const k of keys) {
    if (!k.startsWith('.')) continue;
    if (k.includes('*')) for (let j = 0; j < 3; j++) out.add(k.replace('*', pick(['a', 'b', 'sub/index', 'a.js', 'two', 'one', 'x', '../a', '', 'sub/', 'sub', 'two/one', 'node_modules/x', '%2fa'])));
    else out.add(k);
  }
  for (let j = 0; j < 4; j++) out.add(pick(['./lib/a.js', './lib/a', './index.js', './feat/two', './dist/x.js', './nope', './lib/', './lib/sub', './dist/', './data', './lib/b.mjs', './feat/one', './lib/x/y', './dist', './a']));
  const specs = [...out].filter(s => s === '.' || (s.startsWith('./') && !s.startsWith('./__r'))).map(s => s === '.' ? p.name : p.name + s.slice(1));
  const im = ['#a', '#lib/a.js', '#lib/sub/index', '#x', '#nope', '#', '#/a', '#lib/', '#b/c', '#dep', '#lib/a'].filter(() => chance(0.5));
  return { specs, im };
}

function writePkgs(root, pkgs) {
  for (const p of pkgs) {
    const dir = path.join(root, 'node_modules', p.name);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify(p.pkg));
    for (const f of p.files) { fs.mkdirSync(path.dirname(path.join(dir, f)), { recursive: true }); fs.writeFileSync(path.join(dir, f), f.endsWith('.json') ? '{}' : '//'); }
    for (const [f, c] of Object.entries(p.nested)) { fs.mkdirSync(path.dirname(path.join(dir, f)), { recursive: true }); fs.writeFileSync(path.join(dir, f), JSON.stringify(c)); }
    fs.writeFileSync(path.join(dir, '__r.mjs'), 'export default s => import.meta.resolve(s);');
    fs.writeFileSync(path.join(dir, '__r.cjs'), 'module.exports = s => require.resolve(s);');
  }
  fs.writeFileSync(path.join(root, '__r.mjs'), 'export default s => import.meta.resolve(s);');
  fs.writeFileSync(path.join(root, '__r.cjs'), 'module.exports = s => require.resolve(s);');
}

// Runs the real Node on every case, in one process per condition flag set.
function oracle(root, cases, flags) {
  const script = `
const fs=require('fs'),path=require('path'),{fileURLToPath,pathToFileURL}=require('url');const R=require('internal/modules/esm/resolve');
const cases=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));const root=process.argv[3];
(async()=>{const out=[];const cache={};
for(const c of cases){const dir=c.inside?path.join(root,'node_modules',c.pkg):root;
 const k=dir+c.mode;if(!cache[k])cache[k]=c.mode==='import'?(s=>R.defaultResolve(s,{parentURL:pathToFileURL(path.join(dir,'__r.mjs')).href}).url):require(path.join(dir,'__r.cjs'));
 try{let r=cache[k](c.spec);if(c.mode==='import')r=r.startsWith('file:')?fileURLToPath(r):r;out.push({ok:true,r});}
 catch(e){out.push({ok:false,code:e.code||e.name,msg:String(e.message).split('\\n')[0]});}}
process.stdout.write(JSON.stringify(out));})();`;
  const sf = path.join(root, '__oracle.cjs'), cf = path.join(root, '__cases.json');
  fs.writeFileSync(sf, script); fs.writeFileSync(cf, JSON.stringify(cases));
  return JSON.parse(execFileSync(process.execPath, ['--expose-internals', '--no-deprecation', '--no-warnings', ...flags, sf, cf, root], { maxBuffer: 1 << 28 }).toString());
}

function norm(root, c, o) {
  if (!o.ok) return { ok: false, code: o.code };
  if (o.r.startsWith('node:') || !o.r.startsWith('/')) return { ok: true, builtin: o.r.startsWith('node:') ? o.r : 'node:' + o.r };
  const nm = path.join(fs.realpathSync(root), 'node_modules') + '/';
  const rel = o.r.slice(nm.length);
  const own = c.pkg + '/';
  if (o.r.startsWith(nm + own)) return { ok: true, file: './' + o.r.slice((nm + own).length) };
  const other = rel.startsWith('@') ? rel.split('/').slice(0, 2).join('/') : rel.split('/')[0];
  return { ok: true, external: other };
}

function engineNorm(r) {
  if (!r.ok) return { ok: false, code: r.error.code };
  if (r.builtin) return { ok: true, builtin: r.builtin };
  if (r.external) { const n = r.external.startsWith('@') ? r.external.split('/').slice(0, 2).join('/') : r.external.split('/')[0]; return { ok: true, external: n }; }
  return { ok: true, file: r.file };
}

const FLAGSETS = [
  { flags: [], extra: [] },
  { flags: ['-C', 'development', '-C', 'browser'], extra: ['development', 'browser'] },
  { flags: ['--no-addons', '-C', 'types'], extra: ['types'], no_addons: true }
];

function runOracle(n, s, record) {
  seed = s;
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pkgexp-'));
  const pkgs = Array.from({ length: n }, (_, i) => genPkg(i));
  writePkgs(root, pkgs);
  const cases = [];
  for (const p of pkgs) {
    const { specs, im } = specsFor(p);
    for (const mode of ['import', 'require']) {
      for (const spec of specs) cases.push({ pkg: p.name, spec, mode, inside: false });
      for (const spec of im) cases.push({ pkg: p.name, spec, mode, inside: true });
    }
  }
  const byName = Object.fromEntries(pkgs.map(p => [p.name, p]));
  let total = 0, diffs = 0, filesModeChecked = 0;
  const rec = [];
  for (const fsets of FLAGSETS) {
    const res = oracle(root, cases, fsets.flags);
    cases.forEach((c, i) => {
      const want = norm(root, c, res[i]);
      const p = byName[c.pkg];
      const dir = path.join(root, 'node_modules', c.pkg);
      const opts = { root: dir, extra_conditions: fsets.extra, no_addons: fsets.no_addons };
      let got; try { got = engineNorm(E.resolveOne(p.pkg, c.spec, c.mode, opts)); } catch (e) { console.log("CRASH", JSON.stringify({ pkg: p.pkg, spec: c.spec, mode: c.mode })); throw e; }
      total++;
      const same = JSON.stringify(want) === JSON.stringify(got);
      if (!same) { diffs++; if (diffs <= 25) console.log('DIFF', JSON.stringify({ pkg: p.pkg, files: p.files, nested: p.nested, spec: c.spec, mode: c.mode, flags: fsets.flags, want, got })); }
      // same answer when only the file list is known (no nested package.json to read)
      if (!Object.keys(p.nested).length) {
        const got2 = engineNorm(E.resolveOne(p.pkg, c.spec, c.mode, { files: p.files.concat(['package.json', '__r.mjs', '__r.cjs']), extra_conditions: fsets.extra, no_addons: fsets.no_addons }));
        if (got2.external && !got2.builtin) return;
        filesModeChecked++;
        if (JSON.stringify(got2) !== JSON.stringify(want)) { diffs++; if (diffs <= 25) console.log('DIFF(files)', JSON.stringify({ pkg: p.pkg, files: p.files, spec: c.spec, mode: c.mode, want, got: got2 })); }
      }
      if (record && !Object.keys(p.nested).length && rnd() < record) rec.push({ pkg: p.pkg, files: p.files.concat(['package.json']), spec: c.spec, mode: c.mode, extra: fsets.extra, no_addons: !!fsets.no_addons, inside: c.inside, want });
    });
  }
  fs.rmSync(root, { recursive: true, force: true });
  console.log(`oracle (node ${process.version}): ${n} packages, ${total} resolutions (+${filesModeChecked} from a file list), ${diffs} differences`);
  return { diffs, rec };
}

const argv = process.argv.slice(2);
if (argv[0] === '--fixtures') {
  const fx = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures.json'), 'utf8'));
  let bad = 0;
  for (const c of fx.cases) {
    const files = c.files.concat(c.inside ? ['__r.mjs', '__r.cjs'] : []);
    const got = engineNorm(E.resolveOne(c.pkg, c.spec, c.mode, { files, extra_conditions: c.extra, no_addons: c.no_addons }));
    if (JSON.stringify(got) !== JSON.stringify(c.want)) { bad++; if (bad < 10) console.log('FIXTURE DIFF', JSON.stringify({ c, got })); }
  }
  console.log(`fixtures (recorded from node ${fx.node}): ${fx.cases.length} cases, ${bad} differences`);
  if (bad) process.exit(1);
} else if (argv[0] === '--oracle' || argv[0] === '--record') {
  const n = +argv[1] || 300, s = +argv[2] || 1;
  const { diffs, rec } = runOracle(n, s, argv[0] === '--record' ? 0.06 : 0);
  if (argv[0] === '--record') { fs.writeFileSync(path.join(__dirname, 'fixtures.json'), JSON.stringify({ node: process.version, cases: rec })); console.log('recorded', rec.length); }
  if (diffs) process.exit(1);
}

// node test.js --real <folder with node_modules>: every exported key of every installed package, Node vs engine
if (argv[0] === '--real') {
  const root = path.resolve(argv[1]);
  const nm = path.join(root, 'node_modules');
  const names = [];
  for (const d of fs.readdirSync(nm)) {
    if (d.startsWith('.')) continue;
    if (d.startsWith('@')) { for (const s of fs.readdirSync(path.join(nm, d))) names.push(d + '/' + s); } else names.push(d);
  }
  fs.writeFileSync(path.join(root, '__r.mjs'), 'export default s => import.meta.resolve(s);');
  fs.writeFileSync(path.join(root, '__r.cjs'), 'module.exports = s => require.resolve(s);');
  const cases = [], meta = {};
  for (const n of names) {
    let pj; try { pj = JSON.parse(fs.readFileSync(path.join(nm, n, 'package.json'), 'utf8')); } catch (e) { continue; }
    meta[n] = pj;
    const specs = new Set([n, n + '/package.json']);
    const lst = E.listExports(pj, { root: path.join(nm, n) });
    for (const e of lst.entries) {
      if (!e.pattern) specs.add(n + (e.subpath === '.' ? '' : e.subpath.slice(1)));
      for (const m of ['import', 'require']) for (const sp of ((e[m] || {}).matching_files || []).slice(0, 8)) specs.add(n + sp.slice(1));
    }
    for (const x of ['/index.js', '/lib/index.js', '/dist/index.js', '/index', '/lib', '/dist', '/esm', '/cjs', '/nope']) specs.add(n + x);
    for (const s of specs) for (const mode of ['import', 'require']) cases.push({ pkg: n, spec: s, mode, inside: false });
  }
  let total = 0, diffs = 0;
  for (const fsets of FLAGSETS.slice(0, 2)) {
    const res = oracle(root, cases, fsets.flags);
    cases.forEach((c, i) => {
      const want = norm(root, c, res[i]);
      const got = engineNorm(E.resolveOne(meta[c.pkg], c.spec, c.mode, { root: path.join(nm, c.pkg), extra_conditions: fsets.extra }));
      total++;
      if (JSON.stringify(want) !== JSON.stringify(got)) { diffs++; if (diffs < 15) console.log('DIFF', JSON.stringify({ spec: c.spec, mode: c.mode, flags: fsets.flags, want, got })); }
    });
  }
  console.log(`real packages: ${names.length} packages, ${total} resolutions, ${diffs} differences`);
  if (diffs) process.exit(1);
}
