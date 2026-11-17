'use strict';
// Tests against the real loaders.
//  node test.js --fixtures            : recorded answers (fixtures.json), no network
//  ORACLE=<dir> node test.js N seed   : N random cases vs util.parseEnv, node --env-file, npm dotenv + dotenv-expand,
//                                       real Vite loadEnv and real @next/env loadEnvConfig (installed in <dir>)
//  ORACLE=<dir> node test.js --record : rewrite fixtures.json
const E = require('./engine.js');
const fs = require('fs'), os = require('os'), path = require('path'), cp = require('child_process'), util = require('util');

let seed = 1;
function rnd() { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
const pick = a => a[Math.floor(rnd() * a.length)];
const KEYS = ['A', 'B', 'PORT', 'DB_URL', 'VITE_API', 'VITE_KEY', 'NEXT_PUBLIC_X', 'SECRET', 'my.key', 'my-key', 'X1', 'NODE_ENV', 'HOME_DIR'];
const PIECES = ['abc', '123', ' ', '#', ' # c', '$A', '${B}', '${PORT:-80}', '${X1-def}', '${A:+yes}', '\\$A', '\\n', '\\r', '"', "'", '`', '=', ':', 'é', 'http://h:1/p?q=1#frag', '\t', '$', '${', '}', '\\', 'x y'];
function value() {
  let v = ''; const n = Math.floor(rnd() * 4); for (let i = 0; i < n; i++) v += pick(PIECES);
  const q = rnd();
  if (q < 0.15) return '"' + v + '"'; if (q < 0.25) return "'" + v + "'"; if (q < 0.3) return '`' + v + '`';
  if (q < 0.33) return '"' + v + '\n' + pick(PIECES) + '"'; if (q < 0.36) return '"' + v; return v;
}
function line() {
  const r = rnd();
  if (r < 0.06) return '';
  if (r < 0.1) return '# ' + pick(PIECES);
  if (r < 0.13) return pick(['garbage line', 'KEY VALUE', '=nokey', '  ', 'export', 'A B=1', ' #x=1']);
  const k = pick(KEYS);
  const pre = rnd() < 0.08 ? 'export ' : rnd() < 0.08 ? '  ' : '';
  const sep = pick(['=', '=', '=', ' = ', '= ', ' =', ': ']);
  return pre + k + sep + value() + (rnd() < 0.1 ? ' # comment' : '');
}
function file() { const n = 1 + Math.floor(rnd() * 6); const ls = []; for (let i = 0; i < n; i++) ls.push(line()); let s = ls.join(rnd() < 0.1 ? '\r\n' : '\n'); if (rnd() < 0.5) s += '\n'; return s; }
function envFiles(names) { const o = {}; for (const n of names) if (rnd() < 0.75) o[n] = file(); return o; }
function procEnv() { const o = {}; if (rnd() < 0.4) o[pick(KEYS.filter(k => /^[A-Z_0-9]+$/.test(k)))] = 'fromenv'; return o; }

let fails = 0, count = 0;
function eq(a, b, what, ctx) {
  count++;
  const x = JSON.stringify(a), y = JSON.stringify(b);
  if (x !== y) { fails++; if (fails <= 8) console.log('DIFF', what, '\n ours  ', x, '\n real  ', y, '\n input ', JSON.stringify(ctx)); }
}
function sortObj(o) { const r = {}; Object.keys(o).sort().forEach(k => { r[k] = o[k]; }); return r; }

function oracleDir() { return process.env.ORACLE && path.join(process.env.ORACLE, 'node_modules'); }
function realVite(files, mode, penv, crashExpected) {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'v-'));
  for (const f of Object.keys(files)) fs.writeFileSync(path.join(d, f), files[f]);
  const code = `import(${JSON.stringify(path.join(oracleDir(), 'vite', 'dist', 'node', 'index.js'))}).then(v=>{const r=v.loadEnv(${JSON.stringify(mode)},${JSON.stringify(d)});process.stdout.write(JSON.stringify(r))})`;
  try {
    const out = cp.execFileSync(process.execPath, crashExpected ? ['--max-old-space-size=200', '-e', code] : ['-e', code], { env: Object.assign({ PATH: process.env.PATH }, penv), encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 120000 });
    return JSON.parse(out);
  } finally { fs.rmSync(d, { recursive: true }); }
}
function realNext(files, mode, penv) {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'n-'));
  for (const f of Object.keys(files)) fs.writeFileSync(path.join(d, f), files[f]);
  const env = Object.assign({ PATH: process.env.PATH }, penv); if (mode === 'test') env.NODE_ENV = 'test';
  const code = `const r=require(${JSON.stringify(path.join(oracleDir(), '@next', 'env'))}).loadEnvConfig(${JSON.stringify(d)},${mode === 'development'},{info(){},error(){}},true);const o={};for(const k in r.combinedEnv){if(k!=='PATH'&&k!=='__NEXT_PROCESSED_ENV')o[k]=r.combinedEnv[k]}process.stdout.write(JSON.stringify(o))`;
  const out = cp.execFileSync(process.execPath, ['-e', code], { env, encoding: 'utf8' });
  fs.rmSync(d, { recursive: true });
  return JSON.parse(out);
}
function realNodeEnvFile(files, order, penv) {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'e-'));
  const args = [];
  order.forEach((f, i) => { const p = path.join(d, 'f' + i); fs.writeFileSync(p, files[f]); args.push('--env-file=' + p); });
  const out = cp.execFileSync(process.execPath, [...args, '-e', 'const o={};for(const k in process.env)if(k!=="PATH")o[k]=process.env[k];process.stdout.write(JSON.stringify(o))'], { env: Object.assign({ PATH: process.env.PATH }, penv), encoding: 'utf8' });
  fs.rmSync(d, { recursive: true });
  return JSON.parse(out);
}
function realDotenv(files, order, penv, expand, override) {
  const D = require(path.join(oracleDir(), 'dotenv')), X = require(path.join(oracleDir(), 'dotenv-expand'));
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'd-'));
  const paths = order.map((f, i) => { const p = path.join(d, 'f' + i); fs.writeFileSync(p, files[f]); return p; });
  const pe = Object.assign({}, penv);
  const r = D.config({ path: paths, processEnv: pe, quiet: true, override });
  if (expand) X.expand({ parsed: r.parsed, processEnv: pe });
  fs.rmSync(d, { recursive: true });
  return pe;
}
function strip(o, penvKeys) { const r = {}; for (const k in o) r[k] = o[k]; return r; }

function ours(kind, files, mode, penv, extra) {
  const r = E.resolve(Object.assign({ loader: kind, files, mode, process_env: penv }, extra || {}));
  const o = {};
  if (kind === 'vite') { for (const k in r.variables) if (r.variables[k].value !== null && r.variables[k].exposed_to_browser) o[k] = r.variables[k].value; return o; }
  return null;
}

function runRandom(n) {
  const NAMES_V = ['.env', '.env.local', '.env.development', '.env.development.local', '.env.production'];
  const NAMES_N = ['.env', '.env.local', '.env.development', '.env.development.local', '.env.production', '.env.production.local', '.env.test', '.env.test.local'];
  for (let i = 0; i < n; i++) {
    const content = file();
    // parsers
    eq(sortObj(E.parseNode(content)), sortObj(util.parseEnv(content)), 'node parser', content);
    eq(Object.keys(E.parseNode(content)), Object.keys(util.parseEnv(content)), 'node parser key order', content);
    const ex = {}; E.parseDotenvExplained(content).entries.forEach(e => { ex[e.key] = e.value; });
    eq(ex, E.dotenv.parse(content), 'dotenv explained parser', content);
    E.lintFile('node', '.env', content); E.lintFile('dotenv', '.env', content);
    if (!oracleDir() || i % 4) continue;
    const penv = procEnv();
    // vite
    const fv = envFiles(NAMES_V); const mv = pick(['development', 'production', 'staging']);
    let mine; try { mine = ours('vite', fv, mv, penv); } catch (e) { mine = { RUNAWAY: /grows without end/.test(e.message) }; }
    let real; try { real = realVite(fv, mv, penv, mine.RUNAWAY); } catch (e) { real = { RUNAWAY: true }; }
    eq(sortObj(mine), sortObj(real), 'vite', { fv, mv, penv });
    // next
    const fn = envFiles(NAMES_N); const mn = pick(['development', 'production', 'test']);
    const rn = E.resolve({ loader: 'nextjs', files: fn, mode: mn, process_env: penv });
    const on = {}; for (const k in rn.variables) if (rn.variables[k].value !== null) on[k] = rn.variables[k].value;
    const realN = realNext(fn, mn, penv); delete realN.NODE_ENV; delete on.NODE_ENV;
    eq(sortObj(on), sortObj(realN), 'nextjs', { fn, mn, penv });
    // node --env-file
    const fe = { a: file(), b: file() }; const order = rnd() < 0.5 ? ['a', 'b'] : ['a'];
    const re = E.resolve({ loader: 'node', files: fe, order, process_env: penv });
    const oe = {}; for (const k in re.variables) if (re.variables[k].value !== null) oe[k] = re.variables[k].value;
    for (const k in penv) oe[k] = penv[k];
    const realE = realNodeEnvFile(fe, order, penv);
    for (const k of Object.keys(realE)) if (!(k in oe) && !(k in penv)) { /* node adds nothing else */ }
    const realE2 = {}; for (const k in realE) if (k in oe || k in E.parseNode(fe.a) || (order[1] && k in E.parseNode(fe.b))) realE2[k] = realE[k];
    eq(sortObj(oe), sortObj(realE2), 'node --env-file', { fe, order, penv });
    // dotenv (+expand)
    const expand = rnd() < 0.6, override = rnd() < 0.3;
    let rd; try { rd = E.resolve({ loader: 'dotenv', files: fe, order, process_env: penv, expand, override }); } catch (e) { rd = null; }
    if (!rd) { // our guard fired: the real dotenv-expand must crash too
      const code = `const D=require(${JSON.stringify(path.join(oracleDir(), 'dotenv'))}),X=require(${JSON.stringify(path.join(oracleDir(), 'dotenv-expand'))});const f=${JSON.stringify(order.map(k => fe[k]))};const all={};for(const c of f)D.populate(all,D.parse(c),{override:${override}});const pe=${JSON.stringify(penv)};D.populate(pe,all,{override:${override}});X.expand({parsed:all,processEnv:pe});`;
      let crashed = false; try { cp.execFileSync(process.execPath, ['--max-old-space-size=200', '-e', code], { stdio: 'ignore', timeout: 120000 }); } catch (e) { crashed = true; }
      eq(true, crashed, 'dotenv-expand runaway', { fe, order, penv });
      continue;
    }
    const od = {}; for (const k in rd.variables) if (rd.variables[k].value !== null) od[k] = rd.variables[k].value;
    for (const k in penv) if (!(k in od)) od[k] = penv[k];
    eq(sortObj(od), sortObj(realDotenv(fe, order, penv, expand, override)), 'dotenv expand=' + expand + ' override=' + override, { fe, order, penv });
  }
}

const FIX = path.join(__dirname, 'fixtures.json');
if (process.argv[2] === '--fixtures') {
  const fx = JSON.parse(fs.readFileSync(FIX, 'utf8'));
  for (const c of fx.cases) {
    const r = E.resolve(c.input); const got = {}; for (const k in r.variables) if (r.variables[k].value !== null) got[k] = r.variables[k].value;
    for (const k in c.input.process_env || {}) if (c.input.loader !== 'vite' && !(k in got)) got[k] = c.input.process_env[k];
    (c.ignore || []).forEach(k => { delete got[k]; });
    eq(sortObj(got), sortObj(c.expected), 'fixture ' + c.input.loader, c.input);
  }
  for (const c of fx.node_parser) eq(E.parseNode(c.input), c.expected, 'fixture node parser', c.input);
  console.log('fixtures: ' + count + ' checks, ' + fails + ' differences');
  process.exit(fails ? 1 : 0);
} else if (process.argv[2] === '--record') {
  seed = 4242; const cases = [], node_parser = [];
  for (let i = 0; i < 300; i++) { const c = file(); node_parser.push({ input: c, expected: util.parseEnv(c) }); }
  const NAMES_N = ['.env', '.env.local', '.env.development', '.env.production', '.env.test', '.env.test.local'];
  for (let i = 0; i < 60; i++) {
    const penv = procEnv();
    const fv = envFiles(['.env', '.env.local', '.env.development', '.env.production']); const mv = pick(['development', 'production']);
    cases.push({ input: { loader: 'vite', files: fv, mode: mv, process_env: penv }, expected: realVite(fv, mv, penv) });
    const fn = envFiles(NAMES_N); const mn = pick(['development', 'production', 'test']);
    const rn = realNext(fn, mn, penv); delete rn.NODE_ENV;
    cases.push({ input: { loader: 'nextjs', files: fn, mode: mn, process_env: penv }, expected: rn, ignore: ['NODE_ENV'] });
    const fe = { a: file(), b: file() };
    const expand = rnd() < 0.6;
    cases.push({ input: { loader: 'dotenv', files: fe, order: ['a', 'b'], process_env: penv, expand }, expected: realDotenv(fe, ['a', 'b'], penv, expand, false) });
  }
  fs.writeFileSync(FIX, JSON.stringify({ note: 'Recorded from util.parseEnv (Node ' + process.version + '), Vite loadEnv, @next/env loadEnvConfig, npm dotenv + dotenv-expand', cases, node_parser }));
  console.log('recorded', cases.length, 'cases,', node_parser.length, 'parser cases');
} else {
  const n = +(process.argv[2] || 2000); seed = +(process.argv[3] || 7);
  runRandom(n);
  console.log(count + ' checks, ' + fails + ' differences');
  process.exit(fails ? 1 : 0);
}
