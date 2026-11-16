#!/usr/bin/env node
'use strict';
// MCP server (stdio, no install needed): which browsers a browserslist query or config really targets, and whether a
// web feature (caniuse) works in all of them. It runs the real browserslist 4 code with the caniuse-lite data, bundled
// in browserslist.bundle.js, so the answer is the one Babel, Autoprefixer, PostCSS, esbuild targets, Vite or SWC get.
const V = require('./browserslist.bundle.js');
const BL = V.browserslist;
const SERVER = { name: 'browserslist-check', title: 'Browserslist and caniuse checker (which browsers, which features)', version: '1.0.0' };

const AGENTS = V.agents;
const NAMES = {};
for (const id in AGENTS) NAMES[id] = AGENTS[id].browser;
const DATA_DATE = (() => {
  let max = 0;
  for (const id in AGENTS) for (const v in AGENTS[id].release_date) { const t = AGENTS[id].release_date[v]; if (t && t > max) max = t; }
  return new Date(max * 1000).toISOString().slice(0, 10);
})();
const round = x => Math.round(x * 100) / 100;
const pct = x => (x > 0 && x < 0.01 ? 'under 0.01' : String(round(x))) + '%';

// ---------- targets: query, config text, or defaults ----------
function configToQuery(config, env) {
  // config = .browserslistrc text, or the "browserslist" value of package.json (string, array, or { env: [...] })
  let parsed;
  if (typeof config === 'string') {
    const t = config.trim();
    if (t.startsWith('{') || t.startsWith('[')) { try { return configToQuery(JSON.parse(t), env); } catch (e) { if (t.startsWith('{')) throw new Error('config looks like JSON but does not parse: ' + e.message); } }
    if (/^\s*"?browserslist"?\s*:/.test(t)) throw new Error('Pass only the value of the "browserslist" key, or the whole package.json as package_json.');
    parsed = BL.parseConfig(config);
  } else if (Array.isArray(config)) parsed = { defaults: config.map(String) };
  else if (config && typeof config === 'object') {
    parsed = {};
    for (const k in config) {
      const v = config[k];
      if (typeof v === 'string') parsed[k] = [v];
      else if (Array.isArray(v)) parsed[k] = v.map(String);
      else throw new Error('Browserslist config should be a string or an array of strings with browser queries (section "' + k + '")');
    }
  } else throw new Error('config must be the .browserslistrc text or the package.json "browserslist" value');
  // same section choice as browserslist: BROWSERSLIST_ENV > NODE_ENV > "production", else "defaults"
  const want = env || 'production';
  if (Object.prototype.hasOwnProperty.call(parsed, want)) return { queries: parsed[want], section: want, sections: Object.keys(parsed) };
  if (parsed.defaults) return { queries: parsed.defaults, section: 'defaults', sections: Object.keys(parsed) };
  return { queries: null, section: null, sections: Object.keys(parsed) };
}

function targets(args) {
  args = args || {};
  let queries, source, sections;
  if (args.query !== undefined && args.query !== null && args.query !== '') {
    queries = Array.isArray(args.query) ? args.query.map(String) : String(args.query);
    source = 'query';
  } else if (args.config !== undefined || args.package_json !== undefined) {
    let cfg = args.config;
    if (cfg === undefined) {
      let pkg = args.package_json;
      if (typeof pkg === 'string') pkg = JSON.parse(pkg);
      if (!pkg || pkg.browserslist === undefined) { queries = null; }
      else cfg = pkg.browserslist;
    }
    if (cfg !== undefined) {
      const c = configToQuery(cfg, args.env);
      queries = c.queries; sections = c.sections;
      source = c.section ? 'config, section "' + c.section + '"' : null;
    }
    if (!queries) { queries = BL.defaults; source = 'no matching config section: browserslist falls back to "defaults"'; }
  } else { queries = BL.defaults; source = 'no query or config given: "defaults"'; }
  const opts = {};
  if (args.mobile_to_desktop) opts.mobileToDesktop = true;
  const list = BL(queries, opts);
  const text = Array.isArray(queries) ? queries.join(', ') : queries;
  return { list, queries, text, source, sections, opts };
}

function splitName(b) { const i = b.indexOf(' '); return [b.slice(0, i), b.slice(i + 1)]; }

function regionCode(r) {
  if (!r) return null;
  r = String(r).trim();
  return r.length > 2 ? r.toLowerCase() : r.toUpperCase();
}
function coverage(list, region) {
  const out = { global: round(BL.coverage(list)) };
  if (region) out[region] = round(BL.coverage(list, region));
  return out;
}
function usageOf(b, region) {
  const g = BL.usage.global[b] || 0;
  const r = region ? ((BL.usage[region] || {})[b] || 0) : undefined;
  return region ? { global: round(g), [region]: round(r) } : { global: round(g) };
}

// ---------- tool 1: resolve ----------
function resolve(args) {
  const region = regionCode(args.region);
  if (region) BL.coverage([], region); // loads the region, throws a clear error if unknown
  const t = targets(args);
  const by = {};
  for (const b of t.list) {
    const [id, v] = splitName(b);
    (by[id] = by[id] || { name: NAMES[id] || id, versions: [] }).versions.push(v);
  }
  // what each part of the query adds or removes, in order (browserslist reads it left to right)
  const steps = [];
  let parts = [];
  try { parts = BL.parse(t.queries, t.opts); } catch (e) { parts = []; }
  let prev = [], acc = '';
  parts.forEach((p, i) => {
    acc = i === 0 ? p.query : acc + (p.compose === 'and' ? ' and ' : ', ') + p.query;
    let cur;
    try { cur = BL(acc, t.opts); } catch (e) { return; }
    const ps = new Set(prev), cs = new Set(cur);
    const added = cur.filter(x => !ps.has(x)), removed = prev.filter(x => !cs.has(x));
    steps.push({ part: (i === 0 || p.not ? '' : p.compose === 'and' ? 'and ' : 'or ') + p.query, adds: added.length, removes: removed.length, total_after: cur.length,
      added: added.slice(0, 40), removed: removed.slice(0, 40) });
    prev = cur;
  });
  const warnings = [];
  if (!t.list.length) warnings.push('The query selects no browser at all: tools that read it (Babel, Autoprefixer) will then target nothing or fall back to their own default.');
  const dead = new Set(BL('dead'));
  const deadIn = t.list.filter(b => dead.has(b));
  if (deadIn.length) warnings.push('Includes ' + deadIn.length + ' "dead" browser version(s) (no update for 24 months, under 0.5% use): ' + deadIn.join(', ') + '. Add "not dead" if you do not need them: it makes bundles and CSS smaller.');
  if (t.list.includes('op_mini all')) warnings.push('Includes Opera Mini ("op_mini all"): it runs almost no JavaScript and supports few modern features, so every feature check will report it. Add "not op_mini all" if you do not support it.');
  const ie = t.list.filter(b => b.startsWith('ie '));
  if (ie.length) warnings.push('Includes Internet Explorer (' + ie.join(', ') + '): forces heavy polyfills and transpilation.');
  const nodes = t.list.filter(b => b.startsWith('node '));
  if (nodes.length) warnings.push('Includes Node.js versions (' + nodes.length + '): caniuse has no data for Node, so feature checks skip them.');
  const months = (Date.now() - Date.parse(DATA_DATE)) / (30.44 * 864e5);
  if (months > 6) warnings.push('The caniuse data bundled here is from ' + DATA_DATE + ' (' + Math.floor(months) + ' months old): recent browser versions may be missing.');
  return {
    query: t.text, source: t.source, sections: t.sections, count: t.list.length,
    coverage_percent: coverage(t.list, region),
    browsers: t.list, by_browser: by, steps, warnings,
    data: { caniuse_lite: V.VERSIONS['caniuse-lite'], browserslist: V.VERSIONS.browserslist, latest_release_in_data: DATA_DATE }
  };
}

// ---------- features ----------
const FEATURE_IDS = Object.keys(V.FEATURES);
const fcache = {};
function feature(id) { return fcache[id] || (fcache[id] = V.unpackFeature(V.FEATURES[id])); }
let TITLES = null;
function titles() { if (!TITLES) { TITLES = {}; for (const id of FEATURE_IDS) TITLES[id] = feature(id).title; } return TITLES; }
const norm = s => String(s).toLowerCase().replace(/[^a-z0-9.#:@()-]+/g, ' ').trim();
function search(q, limit) {
  const T = titles(), nq = norm(q), words = nq.split(' ').filter(Boolean);
  const scored = [];
  for (const id of FEATURE_IDS) {
    const hay = norm(id.replace(/-/g, ' ') + ' ' + id + ' ' + T[id]);
    let score = 0;
    if (id === q.trim().toLowerCase()) score = 1000;
    else if (norm(T[id]) === nq) score = 900;
    else {
      if (!words.every(w => hay.includes(w))) continue;
      score = 100 + words.filter(w => new RegExp('(^|[^a-z0-9])' + w.replace(/[.#()]/g, '\\$&') + '([^a-z0-9]|$)').test(hay)).length * 10 - T[id].length / 20;
      if (norm(T[id]).startsWith(nq)) score += 50;
    }
    scored.push([score, id]);
  }
  scored.sort((a, b) => b[0] - a[0] || (a[1] < b[1] ? -1 : 1));
  return scored.slice(0, limit || 20).map(([, id]) => id);
}
function globalShare(id) {
  // share of world usage with full support, partial support, as on caniuse.com (prefixed counts as supported)
  const f = feature(id); let y = 0, a = 0;
  for (const b in f.stats) for (const v in f.stats[b]) {
    const u = BL.usage.global[b + ' ' + v] || 0, s = f.stats[b][v];
    if (/\bd\b/.test(s)) continue;
    if (/^y/.test(s)) y += u; else if (/^a/.test(s)) a += u;
  }
  return { full: round(y), partial: round(a) };
}
function status(flags) {
  if (flags === undefined) return { s: 'no_data' };
  const notes = (flags.match(/#\d+/g) || []).map(s => +s.slice(1));
  const f = flags.replace(/ ?#\d+/g, '').split(' ');
  let s;
  if (f.includes('d')) s = 'behind_flag';
  else if (f[0] === 'y') s = f.includes('x') ? 'supported_with_prefix' : 'supported';
  else if (f[0] === 'a') s = f.includes('x') ? 'partial_with_prefix' : 'partial';
  else if (f[0] === 'p') s = 'polyfill_only';
  else if (f[0] === 'u') s = 'unknown';
  else s = 'not_supported';
  return notes.length ? { s, notes } : { s };
}
function sinceVersion(id, browser) {
  // first released version from which the feature is fully supported (unprefixed, no flag) up to the latest one
  const f = feature(id).stats[browser]; if (!f) return null;
  const vs = AGENTS[browser].versions.filter(v => v && v in f && AGENTS[browser].release_date[v]);
  let since = null, i;
  for (i = vs.length - 1; i >= 0; i--) { if (status(f[vs[i]]).s === 'supported') since = vs[i]; else break; }
  if (since && i < 0) return vs.length === 1 ? since + ' (caniuse only tracks the latest version of this browser)' : since + ' or earlier (oldest version in the data)';
  return since;
}

function resolveFeature(q) {
  const s = String(q).trim();
  if (V.FEATURES[s.toLowerCase()]) return { id: s.toLowerCase() };
  const c = search(s, 6);
  if (!c.length) return { error: 'No caniuse feature matches "' + s + '". Use find_feature with another word (caniuse ids look like "css-has", "fetch", "es6-module"). Some features shown on caniuse.com come from MDN data and are not in the caniuse database used by browserslist: then this tool cannot check them.' };
  const slug = s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const direct = c.find(id => id === slug || id === 'css-' + slug || id === 'js-' + slug || id === 'html-' + slug);
  if (direct) return { id: direct, guessed_from: s };
  if (c.length === 1 || norm(titles()[c[0]]) === norm(s)) return { id: c[0], guessed_from: s };
  return { error: '"' + s + '" is not a caniuse id. Pick one of these and call again.', candidates: c.map(id => ({ id, title: titles()[id] })) };
}

const ORDER = ['not_supported', 'behind_flag', 'polyfill_only', 'partial', 'partial_with_prefix', 'supported_with_prefix', 'unknown', 'no_data', 'supported'];
function check(args) {
  const region = regionCode(args.region);
  if (region) BL.coverage([], region);
  let feats = args.features;
  if (typeof feats === 'string') feats = [feats];
  if (!Array.isArray(feats) || !feats.length) throw new Error('"features" must list caniuse feature ids or names, e.g. ["css-has", "structuredclone"]');
  const t = targets(args);
  const browsers = t.list.filter(b => !b.startsWith('node '));
  const results = feats.slice(0, 30).map(q => {
    const r = resolveFeature(q);
    if (!r.id) return Object.assign({ asked: q }, r);
    const f = feature(r.id);
    const groups = {};
    const per = {};
    for (const b of browsers) {
      const [id, v] = splitName(b);
      const st = status((f.stats[id] || {})[v]);
      (groups[st.s] = groups[st.s] || []).push(b);
      if (st.s !== 'supported') {
        const p = per[id] = per[id] || { name: NAMES[id] || id, versions: {} };
        p.versions[v] = st.notes ? st.s + ' (caniuse note ' + st.notes.join(', ') + ')' : st.s;
      }
    }
    const problems = browsers.filter(b => !(groups.supported || []).includes(b));
    const blocking = browsers.filter(b => ['not_supported', 'behind_flag', 'polyfill_only', 'unknown', 'no_data'].includes(status((f.stats[splitName(b)[0]] || {})[splitName(b)[1]]).s));
    const since = {};
    for (const id of new Set(browsers.map(b => splitName(b)[0]))) since[id] = sinceVersion(r.id, id);
    let verdict;
    if (!problems.length) verdict = 'Safe: fully supported, unprefixed, in all ' + browsers.length + ' target browser versions.';
    else if (!blocking.length) verdict = 'Usable with care: works everywhere, but only partly or with a vendor prefix in ' + problems.length + ' target version(s). Check the list.';
    else if (BL.coverage(blocking) < 0.1 && (!region || BL.coverage(blocking, region) < 0.1)) verdict = 'Practically safe: missing only in ' + blocking.length + ' target version(s) with almost no users (' + pct(BL.coverage(blocking)) + ' of world usage' + (region ? ', ' + pct(BL.coverage(blocking, region)) + ' in ' + region : '') + '): ' + blocking.join(', ') + '. Remove them from the query (e.g. "not op_mini all") or keep a simple fallback.';
    else verdict = 'Not safe without a fallback or polyfill: missing in ' + blocking.length + ' of ' + browsers.length + ' target versions (' + pct(BL.coverage(blocking)) + ' of world usage' + (region ? ', ' + pct(BL.coverage(blocking, region)) + ' in ' + region : '') + ').';
    const out = {
      id: r.id, title: f.title, spec_status: f.status, verdict,
      fully_supported_in_all_targets: !problems.length,
      counts: Object.fromEntries(ORDER.filter(k => groups[k]).map(k => [k, groups[k].length])),
      unsupported_share_percent: blocking.length ? coverage(blocking, region) : { global: 0 },
      problem_browsers: per,
      fully_supported_since: since,
      world_support_percent: globalShare(r.id),
      caniuse_url: 'https://caniuse.com/' + r.id
    };
    if (r.guessed_from) out.matched_from = r.guessed_from;
    return out;
  });
  return { query: t.text, source: t.source, target_count: browsers.length, results,
    data: { caniuse_lite: V.VERSIONS['caniuse-lite'], latest_release_in_data: DATA_DATE } };
}

function find(args) {
  const q = String(args.query || '').trim();
  if (!q) throw new Error('"query" is required, e.g. "container queries" or "dialog"');
  const ids = search(q, Math.min(+args.limit || 15, 50));
  return { query: q, matches: ids.map(id => ({ id, title: titles()[id], spec_status: feature(id).status, world_support_percent: globalShare(id) })) };
}

// ---------- MCP ----------
const TARGET_INPUT = {
  query: { type: ['string', 'array'], items: { type: 'string' }, description: 'A browserslist query, e.g. "> 0.5%, last 2 versions, not dead" or ["defaults", "not op_mini all"]. Wins over config.' },
  config: { type: ['string', 'array', 'object'], description: 'Instead of query: the text of .browserslistrc, or the value of the "browserslist" key of package.json (string, array, or object with environments like { "production": [...], "development": [...] }).' },
  package_json: { type: ['object', 'string'], description: 'Instead of query/config: the whole package.json; its "browserslist" key is read.' },
  env: { type: 'string', description: 'Config section to use (like BROWSERSLIST_ENV / NODE_ENV). Default "production", then "defaults".' },
  region: { type: 'string', description: 'Optional country code ("US", "FR", "IN") or "alt-eu", "alt-as"… to also get usage shares there.' },
  mobile_to_desktop: { type: 'boolean', description: 'Same as the browserslist mobileToDesktop option (used by Babel and Autoprefixer through their own settings).' }
};
const TOOLS = [
  {
    name: 'resolve_browsers',
    title: 'Which browsers does this browserslist query target?',
    description: 'Runs the real browserslist (the code Babel, Autoprefixer, PostCSS, Vite, esbuild-plugin-browserslist and SWC use) on a query or on a .browserslistrc / package.json config, with up-to-date caniuse data, and returns the exact browser versions, the share of world (and country) usage they cover, what each part of the query adds or removes, and the traps: dead browsers, Opera Mini, IE, empty result, wrong config section. Use it instead of guessing what "defaults", "> 0.5%", "last 2 versions" or "cover 95%" mean today.',
    inputSchema: { type: 'object', properties: TARGET_INPUT },
    annotations: { readOnlyHint: true, openWorldHint: false, idempotentHint: true }
  },
  {
    name: 'check_support',
    title: 'Can I use this web feature with my browserslist targets?',
    description: 'For one or more web features (caniuse ids or names: "css-has", ":has", "structuredClone", "dialog", "container queries", "fetch", "es6-module"…), checks every target browser version from the query/config with the caniuse data: fully supported, partial, needs a vendor prefix, behind a flag, or missing; which browsers fail and their usage share; the first version with full support per browser; and a plain verdict. Use it before using a modern CSS/JS/HTML feature, or to decide if a polyfill or fallback is needed.',
    inputSchema: { type: 'object', properties: Object.assign({
      features: { type: ['array', 'string'], items: { type: 'string' }, maxItems: 30, description: 'caniuse feature ids or names. A name that matches several features returns the candidates.' }
    }, TARGET_INPUT), required: ['features'] },
    annotations: { readOnlyHint: true, openWorldHint: false, idempotentHint: true }
  },
  {
    name: 'find_feature',
    title: 'Find the caniuse id of a web feature',
    description: 'Searches the caniuse feature list (id and title) and returns the matching ids with their world support share. Use it to get the right id for check_support or for a "supports <feature>" browserslist query.',
    inputSchema: { type: 'object', properties: { query: { type: 'string', description: 'Words, e.g. "subgrid", "view transitions", "webp".' }, limit: { type: 'integer', minimum: 1, maximum: 50 } }, required: ['query'] },
    annotations: { readOnlyHint: true, openWorldHint: false, idempotentHint: true }
  }
];

function callTool(name, args) {
  args = args || {};
  if (name === 'resolve_browsers') return resolve(args);
  if (name === 'check_support') return check(args);
  if (name === 'find_feature') return find(args);
  throw new Error('unknown tool ' + name);
}

const SUPPORTED = ['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05'];
function send(msg) { process.stdout.write(JSON.stringify(msg) + '\n'); }
function handle(msg) {
  if (!msg || msg.jsonrpc !== '2.0') return;
  const id = msg.id, isReq = id !== undefined && id !== null;
  try {
    switch (msg.method) {
      case 'initialize': {
        const want = msg.params && msg.params.protocolVersion;
        return send({ jsonrpc: '2.0', id, result: { protocolVersion: SUPPORTED.indexOf(want) >= 0 ? want : SUPPORTED[1], capabilities: { tools: { listChanged: false } }, serverInfo: SERVER,
          instructions: 'Do not answer browser support questions from memory: browser versions and usage change every month. To know which browsers a project targets, call resolve_browsers with its browserslist query or its .browserslistrc / package.json "browserslist" value. Before recommending a modern CSS, JS or HTML feature, call check_support with the feature and the project targets: it says if it is safe, needs a prefix, or needs a fallback. Use find_feature to get a caniuse id.' } });
      }
      case 'ping': return isReq && send({ jsonrpc: '2.0', id, result: {} });
      case 'tools/list': return send({ jsonrpc: '2.0', id, result: { tools: TOOLS } });
      case 'tools/call': {
        const nm = msg.params && msg.params.name, args = msg.params && msg.params.arguments;
        let res, isError = false;
        try { res = callTool(nm, args); } catch (e) { res = { error: e.message }; isError = true; }
        return send({ jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: JSON.stringify(res, null, 1) }], structuredContent: isError ? undefined : res, isError } });
      }
      default:
        if (isReq) send({ jsonrpc: '2.0', id, error: { code: -32601, message: 'Method not found: ' + msg.method } });
    }
  } catch (e) { if (isReq) send({ jsonrpc: '2.0', id, error: { code: -32603, message: e.message } }); }
}
if (require.main === module) {
  let buf = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', d => {
    buf += d; let i;
    while ((i = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
      if (!line) continue;
      let m; try { m = JSON.parse(line); } catch (e) { send({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }); continue; }
      if (Array.isArray(m)) m.forEach(handle); else handle(m);
    }
  });
}
module.exports = { callTool, TOOLS, configToQuery, status };
