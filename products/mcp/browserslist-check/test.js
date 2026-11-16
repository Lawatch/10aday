#!/usr/bin/env node
'use strict';
// Tests against the real thing.
//  node test.js --fixtures              recorded answers of the real browserslist (same pinned versions as the bundle)
//  ORACLE=<dir> node test.js N seed     N random queries / configs / feature checks against the real browserslist and
//                                       caniuse-lite installed by npm in <dir> (test.sh does it)
//  ORACLE=<dir> node test.js --record   rewrites fixtures.json from the real browserslist
const fs = require('fs'), os = require('os'), path = require('path');
const S = require('./server.js');
const FIX = path.join(__dirname, 'fixtures.json');
// the server ignores BROWSERSLIST* and NODE_ENV (its input says which section), so must the oracle
for (const k of ['BROWSERSLIST', 'BROWSERSLIST_ENV', 'BROWSERSLIST_CONFIG', 'BROWSERSLIST_STATS', 'NODE_ENV']) delete process.env[k];
process.env.BROWSERSLIST_IGNORE_OLD_DATA = '1';

let seed = 1;
const rnd = n => { seed = (seed * 1103515245 + 12345) % 2147483648; return Math.floor(seed / 2147483648 * n); };
const pick = a => a[rnd(a.length)];
const FEATS = ['css-has', 'dialog', 'webp', 'avif', 'css-grid', 'css-subgrid', 'flexbox-gap', 'es6-module', 'fetch', 'css-container-queries', 'css-nesting', 'view-transitions', 'css-cascade-layers', 'intl-pluralrules', 'wasm', 'css-sticky', 'font-variant-numeric', 'mdn-text-decoration-color', 'css-backdrop-filter', 'css-clip-path', 'promise-finally', 'bigint', 'css-math-functions', 'css-color-function', 'css-text-wrap-balance', 'css-anchor-positioning', 'input-color', 'loading-lazy-attr', 'serviceworkers', 'webgpu', 'css-appearance', 'css-masks', 'user-select-none'];
const CC = ['US', 'FR', 'DE', 'IN', 'CN', 'BR', 'JP', 'GB', 'NG', 'alt-eu', 'alt-as', 'alt-af', 'alt-ww'];
const BROWSERS = ['chrome', 'Chrome', 'firefox', 'ff', 'safari', 'ios_saf', 'iOS', 'edge', 'Edge', 'opera', 'samsung', 'and_chr', 'android', 'ie', 'op_mini', 'kaios', 'electron', 'node', 'and_ff', 'ChromeAndroid'];
function part() {
  switch (rnd(30)) {
    case 0: return '> ' + pick(['0.1', '0.2', '0.5', '1', '2', '5', '.3']) + '%';
    case 1: return pick(['>=', '<', '<=', '>']) + ' ' + pick(['0.5', '1', '3']) + '% in ' + pick(CC);
    case 2: return 'last ' + (1 + rnd(4)) + ' versions';
    case 3: return 'last ' + (1 + rnd(3)) + ' ' + pick(BROWSERS) + ' versions';
    case 4: return 'last ' + (1 + rnd(3)) + ' major versions';
    case 5: return 'not dead';
    case 6: return 'defaults';
    case 7: return 'cover ' + pick(['80', '90', '95', '99.5']) + '%';
    case 8: return 'cover ' + pick(['90', '95']) + '% in ' + pick(CC);
    case 9: return 'Firefox ESR';
    case 10: return pick(BROWSERS) + ' ' + pick(['>=', '>', '<', '<=']) + ' ' + pick(['10', '15', '15.4', '100', '120', '4.4', '20']);
    case 11: return pick(['safari 15-17', 'chrome 100-110', 'ios_saf 15.2-15.3', 'ie 11', 'op_mini all', 'safari TP', 'edge 18', 'android 4.4.3-4.4.4', 'node 18', 'electron 30']);
    case 12: return 'unreleased versions';
    case 13: return 'since ' + pick(['2015', '2019', '2021-06', '2023-01-15']);
    case 14: return 'last ' + (1 + rnd(3)) + ' years';
    case 15: return pick(['', 'fully ', 'partially ']) + 'supports ' + pick(FEATS);
    case 16: return pick(['baseline widely available', 'baseline newly available', 'baseline 2022', 'baseline 2024', 'baseline 2023 with downstream']);
    case 17: return pick(['maintained node versions', 'current node', 'last 2 node major versions', 'node >= 20']);
    case 18: return 'not ' + pick(['ie 11', 'op_mini all', 'dead', 'kaios > 0', 'and_uc > 0', 'safari < 15', 'chrome < 100']);
    case 19: return pick(['dead', 'last 1 version', 'iOS >= 16', 'unreleased chrome versions', 'last 2 Chrome major versions']);
    case 20: return pick(['> 1% in my stats', 'foo bar', 'chrome 9999', 'ie 99', 'last 2 versio', 'supports nope-feature', '> 1% in XX']);
    default: return pick(['> 0.5%', 'last 2 versions', 'not dead', 'defaults', 'not op_mini all', 'Firefox ESR', '> 0.2% and not dead', 'safari >= 14']);
  }
}
function query() {
  let q = part();
  const n = rnd(4);
  for (let i = 0; i < n; i++) q += pick([', ', ', ', ' or ', ' and ']) + part();
  return q;
}
function run(f) { try { return { ok: f() }; } catch (e) { return { err: String(e.message) }; } }
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function ourResolve(args) { return run(() => { const r = S.callTool('resolve_browsers', args); return { browsers: r.browsers, coverage: r.coverage_percent }; }); }

// independent reading of a caniuse cell (raw string from the real caniuse-lite)
function expectStatus(flags) {
  if (flags === undefined) return 'no_data';
  const f = flags.replace(/ ?#\d+/g, '').split(' ');
  if (f.indexOf('d') >= 0) return 'behind_flag';
  return { y: f.indexOf('x') >= 0 ? 'supported_with_prefix' : 'supported', a: f.indexOf('x') >= 0 ? 'partial_with_prefix' : 'partial', p: 'polyfill_only', u: 'unknown', n: 'not_supported' }[f[0]];
}

function oracleCase(O, kind) {
  const BL = O.browserslist;
  if (kind === 'query') {
    const q = query(), m2d = rnd(6) === 0, region = rnd(3) === 0 ? pick(CC) : undefined;
    const exp = run(() => { const b = BL(q, m2d ? { mobileToDesktop: true } : {}); const c = { global: Math.round(BL.coverage(b) * 100) / 100 }; if (region) c[region.length > 2 ? region.toLowerCase() : region] = Math.round(BL.coverage(b, region) * 100) / 100; return { browsers: b, coverage: c }; });
    const got = ourResolve({ query: q, mobile_to_desktop: m2d, region });
    return { args: { query: q, mobile_to_desktop: m2d, region }, exp, got };
  }
  if (kind === 'config') {
    const secs = {}, names = pick([['defaults'], ['production', 'development'], ['production'], ['development'], ['modern', 'legacy'], ['production', 'ssr', 'defaults']]);
    for (const n of names) { secs[n] = []; for (let i = 0, k = 1 + rnd(3); i < k; i++) secs[n].push(pick(['> 1%', 'not dead', 'last 1 chrome version', 'last 2 firefox versions', 'defaults', 'safari >= 15', 'not ie 11', '>0.5% and not op_mini all', 'iOS >= 16'])); }
    const env = pick([undefined, 'production', 'development', 'modern', 'test']);
    const asPkg = rnd(2) === 0, shared = asPkg && names.length === 1 && names[0] === 'defaults' && rnd(2) === 0;
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'blc-'));
    let args;
    if (asPkg) {
      const val = shared ? (rnd(2) ? secs.defaults : secs.defaults.join(', ')) : secs;
      fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name: 'x', browserslist: val }));
      args = rnd(2) ? { package_json: { name: 'x', browserslist: val } } : { config: val };
    } else {
      let txt = '# generated\n';
      for (const n of names) { if (!(names.length === 1 && n === 'defaults' && rnd(2))) txt += '[' + n + ']\n'; txt += secs[n].join(pick(['\n', '\n\n', '\n  '])) + '\n'; }
      fs.writeFileSync(path.join(dir, '.browserslistrc'), txt);
      args = { config: txt };
    }
    if (env) args.env = env;
    const exp = run(() => { const b = BL(undefined, { path: dir, env: env || 'production' }); return { browsers: b, coverage: { global: Math.round(BL.coverage(b) * 100) / 100 } }; });
    fs.rmSync(dir, { recursive: true });
    return { args, exp, got: ourResolve(args) };
  }
  // feature check: targets from the real browserslist, status from the real caniuse-lite raw data
  const feat = pick(FEATS), q = rnd(3) ? query() : pick(['defaults', '> 0.5%, last 2 versions, not dead', 'last 10 versions', 'since 2018']);
  const raw = O.unpack(O.features[feat]).stats;
  const exp = run(() => {
    const T = BL(q).filter(b => !b.startsWith('node '));
    const st = {};
    for (const b of T) { const [id, v] = b.split(' '); st[b] = expectStatus((raw[id] || {})[v]); }
    // cross-check our reading of the cell with browserslist's own "supports" queries
    const full = new Set(BL('fully supports ' + feat)), any = new Set(BL('supports ' + feat));
    for (const b of T) {
      const [id, v] = b.split(' '), cell = (raw[id] || {})[v] || '';
      if (full.has(b) !== /y/.test(cell)) throw new Error('oracle mismatch fully supports ' + feat + ' ' + b);
      if (any.has(b) !== /[ya]/.test(cell)) throw new Error('oracle mismatch supports ' + feat + ' ' + b);
    }
    return st;
  });
  const got = run(() => {
    const r = S.callTool('check_support', { features: [feat], query: q }).results[0];
    const T = BL(q).filter(b => !b.startsWith('node '));
    const st = {};
    for (const b of T) { const [id, v] = b.split(' '); const p = r.problem_browsers[id]; st[b] = p && p.versions[v] ? p.versions[v].replace(/ \(.*/, '') : 'supported'; }
    return st;
  });
  return { args: { features: [feat], query: q }, exp, got };
}

function loadOracle(dir) {
  const req = m => require(require.resolve(m, { paths: [dir] }));
  return { browserslist: req('browserslist'), features: req('caniuse-lite').features, unpack: req('caniuse-lite/dist/unpacker/feature').default,
    versions: { browserslist: req('browserslist/package.json').version, cl: req('caniuse-lite/package.json').version } };
}

const a = process.argv.slice(2);
if (a[0] === '--fixtures') {
  const fx = JSON.parse(fs.readFileSync(FIX, 'utf8'));
  let bad = 0;
  for (const c of fx.cases) {
    const got = c.kind === 'feature'
      ? run(() => { const r = S.callTool('check_support', { features: c.args.features, query: c.args.query }).results[0]; const st = {}; for (const b of Object.keys(c.exp.ok || {})) { const [id, v] = b.split(' '); const p = r.problem_browsers[id]; st[b] = p && p.versions[v] ? p.versions[v].replace(/ \(.*/, '') : 'supported'; } return st; })
      : ourResolve(c.args);
    if (!same(got.ok === undefined ? { err: true } : got.ok, c.exp.ok === undefined ? { err: true } : c.exp.ok)) { bad++; if (bad < 6) console.log('DIFF', JSON.stringify(c.args), '\n exp', JSON.stringify(c.exp).slice(0, 400), '\n got', JSON.stringify(got).slice(0, 400)); }
  }
  console.log('fixtures: ' + fx.cases.length + ' cases, ' + bad + ' differences (recorded with browserslist ' + fx.browserslist + ', caniuse-lite ' + fx['caniuse-lite'] + ')');
  process.exit(bad ? 1 : 0);
}
if (!process.env.ORACLE) { console.log('ORACLE=<dir with browserslist installed> required'); process.exit(2); }
const O = loadOracle(process.env.ORACLE);
const BUNDLED = require('./browserslist.bundle.js').VERSIONS;
if (O.versions.browserslist !== BUNDLED.browserslist || O.versions.cl !== BUNDLED['caniuse-lite']) { console.log('oracle versions differ from the bundle:', O.versions, BUNDLED); process.exit(1); }
if (a[0] === '--record') {
  seed = 4242; const cases = [];
  // queries that depend on today's date or on the running Node version would rot: not recorded
  const moving = /years|maintained|current node|widely available|newly available/i;
  for (let i = 0; i < 1500 && cases.length < 400; i++) {
    const kind = i % 3 === 0 ? 'config' : i % 3 === 1 ? 'query' : 'feature';
    const c = oracleCase(O, kind);
    if (moving.test(JSON.stringify(c.args))) continue;
    cases.push({ kind, args: c.args, exp: c.exp });
  }
  fs.writeFileSync(FIX, JSON.stringify({ browserslist: O.versions.browserslist, 'caniuse-lite': O.versions.cl, cases }));
  console.log('recorded', cases.length, 'cases');
  process.exit(0);
}
const N = +a[0] || 300; seed = +a[1] || 7;
let bad = 0, n = 0, errs = 0;
const counts = { query: 0, config: 0, feature: 0 };
for (let i = 0; i < N; i++) {
  const kind = pick(['query', 'query', 'config', 'feature']);
  const c = oracleCase(O, kind);
  counts[kind]++; n++;
  if (c.exp.err) errs++;
  const ok = c.exp.err ? !!c.got.err && (kind === 'feature' || c.got.err === c.exp.err) : same(c.got.ok, c.exp.ok);
  if (!ok) { bad++; if (bad < 8) console.log('DIFF', kind, JSON.stringify(c.args), '\n exp', JSON.stringify(c.exp).slice(0, 500), '\n got', JSON.stringify(c.got).slice(0, 500)); }
}
console.log('oracle (browserslist ' + O.versions.browserslist + ', caniuse-lite ' + O.versions.cl + '): ' + n + ' cases (' + JSON.stringify(counts) + ', ' + errs + ' expected errors), ' + bad + ' differences');
process.exit(bad ? 1 : 0);
