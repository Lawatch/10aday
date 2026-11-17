'use strict';
// Exact .env semantics of the four common loaders, with the line that decides each value.
//  - dotenv     : npm dotenv 17 parse/populate (vendor/dotenv.js, unchanged) + optional dotenv-expand 12 (vendor/dotenv-expand.js, unchanged)
//  - node       : node --env-file / process.loadEnvFile / util.parseEnv (port of src/node_dotenv.cc, Node 22-25), no expansion
//  - vite       : Vite 8 loadEnv (Node parser above + dotenv-expand 12, files .env, .env.local, .env.[mode], .env.[mode].local)
//  - nextjs     : Next.js 16 @next/env loadEnvConfig (vendor/next-env.js, unchanged, run in a sandbox with in-memory files)
const vm = require('vm');
const fs = require('fs');
const path = require('path');
const dotenv = require('./vendor/dotenv.js');
// The two expanders are loaded from the unchanged vendor files, with one guard added: a value that grows without end
// (e.g. A=$A$A) makes the real tool loop until it runs out of memory; here it stops with a clear error instead.
function guarded(file) {
  let src = fs.readFileSync(path.join(__dirname, 'vendor', file), 'utf8');
  const before = src;
  src = src.replace(/const seen = (\/\* @__PURE__ \*\/ )?new Set\(\)/, m => 'let __n = 0; ' + m)
           .replace(/seen\.add\(result\)/, "if (result.length > 200000 || ++__n > 20000) throw new Error('RUNAWAY'); seen.add(result)");
  if (src === before) throw new Error('guard not applied to ' + file);
  const m = { exports: {} };
  new Function('module', 'exports', 'require', 'process', src)(m, m.exports, require, process);
  return m.exports;
}
const dotenvExpand = guarded('dotenv-expand.js');
const viteExpand = guarded('vite-dotenv-expand.js');

// ---------- parsers, with source lines ----------
function lineOf(text, idx) { let n = 1; for (let i = 0; i < idx && i < text.length; i++) if (text.charCodeAt(i) === 10) n++; return n; }

// dotenv (npm) : same regex and loop as dotenv/lib/main.js parse(), recording where each match starts and ends.
const DOTENV_LINE = /(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/mg;
function parseDotenvExplained(src) {
  const text = String(src).replace(/\r\n?/mg, '\n');
  const entries = []; const covered = [];
  const re = new RegExp(DOTENV_LINE.source, 'mg'); let m;
  while ((m = re.exec(text)) != null) {
    if (m[0] === '' ) { re.lastIndex++; }
    let value = (m[2] || '').trim();
    const q = value[0];
    const raw = value;
    value = value.replace(/^(['"`])([\s\S]*)\1$/mg, '$2');
    if (q === '"') { value = value.replace(/\\n/g, '\n'); value = value.replace(/\\r/g, '\r'); }
    // first non-space char of the match is where the key line starts
    const lead = m[0].search(/\S/);
    const start = m.index + (lead < 0 ? 0 : lead);
    const end = m.index + m[0].length;
    entries.push({ key: m[1], value, raw, quote: /['"`]/.test(q || '') && raw.length > 1 && raw[raw.length - 1] === q ? q : null, line: lineOf(text, start), end_line: lineOf(text, Math.max(start, end - 1)) });
    covered.push([start, end]);
  }
  return { text, entries, covered };
}

// Node : port of Dotenv::ParseContent (src/node_dotenv.cc), positions kept.
function trimSpaces(s, a, b) { while (a < b && ' \t\n'.includes(s[a])) a++; while (b > a && ' \t\n'.includes(s[b - 1])) b--; return [a, b]; }
function parseNodeExplained(src) {
  const text = String(src).replace(/\r/g, '');
  const entries = []; const ignored = [];
  let [p, end] = trimSpaces(text, 0, text.length);
  let swallowed = false;
  const put = (key, value, start, stop, raw, quote) => entries.push({ key, value, raw, quote: quote || null, line: lineOf(text, start), end_line: lineOf(text, Math.max(start, stop - 1)), swallowed });
  while (p < end) {
    const c = text[p];
    if (c === '\n' || c === '#') { const nl = text.indexOf('\n', p); if (nl >= 0 && nl < end) p = nl + 1; else p = end; continue; }
    let eq = -1;
    for (let i = p; i < end; i++) { if (text[i] === '=' || text[i] === '\n') { eq = i; break; } }
    if (eq < 0 || text[eq] === '\n') {
      ignored.push({ line: lineOf(text, p), text: text.slice(p, eq < 0 ? end : eq) });
      if (eq >= 0) { [p, end] = trimSpaces(text, eq + 1, end); continue; }
      break;
    }
    const lineStart = p;
    let [ka, kb] = trimSpaces(text, p, eq);
    p = eq + 1;
    swallowed = false;
    if (p >= end || text[p] === '\n') { put(text.slice(ka, kb), '', lineStart, eq + 1, '', null); continue; }
    const vstart = p;
    [p, end] = trimSpaces(text, p, end);
    swallowed = text.slice(vstart, p).includes('\n');
    if (ka === kb) { ignored.push({ line: lineOf(text, lineStart), text: text.slice(lineStart, eq + 1) + '…', reason: 'empty key' }); continue; }
    if (text.startsWith('export ', ka) && ka + 7 <= kb) { ka += 7; [ka, kb] = trimSpaces(text, ka, kb); }
    const key = text.slice(ka, kb);
    if (p >= end) { put(key, '', lineStart, eq + 1, '', null); break; }
    const f = text[p];
    if (f === '"') {
      const cq = text.indexOf('"', p + 1);
      if (cq >= 0 && cq < end) {
        const v = text.slice(p + 1, cq).split('\\n').join('\n');
        put(key, v, lineStart, cq + 1, text.slice(p, cq + 1), '"');
        const nl = text.indexOf('\n', cq + 1);
        if (nl >= 0 && nl < end) p = nl + 1; else p = end;
        continue;
      }
    }
    if (f === '\'' || f === '"' || f === '`') {
      const cq = text.indexOf(f, p + 1);
      if (cq < 0 || cq >= end) {
        const nl = text.indexOf('\n', p);
        if (nl >= 0 && nl < end) { put(key, text.slice(p, nl), lineStart, nl, text.slice(p, nl), null); p = nl + 1; }
        else { put(key, text.slice(p, end), lineStart, end, text.slice(p, end), null); break; }
      } else {
        put(key, text.slice(p + 1, cq), lineStart, cq + 1, text.slice(p, cq + 1), f);
        const nl = text.indexOf('\n', cq + 1);
        if (nl >= 0 && nl < end) p = nl + 1; else p = end;
        continue;
      }
    } else {
      const nl = text.indexOf('\n', p);
      const stop = nl >= 0 && nl < end ? nl : end;
      let raw = text.slice(p, stop);
      const h = raw.indexOf('#');
      let v = h >= 0 ? raw.slice(0, h) : raw;
      const [va, vb] = trimSpaces(v, 0, v.length);
      put(key, v.slice(va, vb), lineStart, stop, raw, null);
      if (nl >= 0 && nl < end) p = nl + 1; else { p = end; }
    }
    [p, end] = trimSpaces(text, p, end);
  }
  return { text, entries, ignored };
}
function parseNode(src) { // object exactly like util.parseEnv (keys sorted as in a std::map)
  const m = new Map(); for (const e of parseNodeExplained(src).entries) m.set(e.key, e.value);
  const keys = [...m.keys()].sort((a, b) => { const x = Buffer.from(a), y = Buffer.from(b); return Buffer.compare(x, y); });
  const o = {}; for (const k of keys) o[k] = m.get(k); return o;
}

// ---------- per-file diagnostics ----------
function lintFile(parser, name, content) {
  const problems = [];
  const add = (line, severity, message) => problems.push({ file: name, line, severity, message });
  const lines = String(content).replace(/\r\n?/g, '\n').split('\n');
  const ex = parser === 'node' ? parseNodeExplained(content) : parseDotenvExplained(content);
  const byLine = new Map(); ex.entries.forEach(e => { for (let l = e.line; l <= e.end_line; l++) byLine.set(l, e); });
  if (String(content).charCodeAt(0) === 0xFEFF && parser === 'node') add(1, 'error', 'The file starts with a byte-order mark (BOM): the Node parser keeps it in the first key name, so that variable is not found under its real name. Save the file as UTF-8 without BOM.');
  // lines that define nothing
  lines.forEach((t, i) => {
    const n = i + 1, s = t.trim();
    if (!s || s[0] === '#' || byLine.has(n)) return;
    add(n, 'error', 'This line defines no variable and is silently ignored: "' + s.slice(0, 80) + '"' + (parser !== 'node' && /^[^=:]*[^\w.\s=:-][^=:]*=/.test(s.replace(/^export\s+/, '')) ? ' (dotenv only accepts letters, digits, "_", "." and "-" in names)' : '') + '.');
  });
  // per entry
  const seen = new Map();
  for (const e of ex.entries) {
    if (seen.has(e.key)) add(e.line, 'warning', 'Duplicate key ' + e.key + ' (also line ' + seen.get(e.key) + '): within one file the last line wins.');
    seen.set(e.key, e.line);
    const rawLine = lines[e.line - 1] || '';
    if (!e.quote) {
      const afterEq = rawLine.replace(/^[^=:]*[=:]/, '');
      const h = afterEq.indexOf('#');
      if (h > 0 && !/\s/.test(afterEq[h - 1]) && afterEq.slice(0, h).trim()) add(e.line, 'warning', 'Unquoted value cut at "#": ' + e.key + ' is "' + e.value + '", not "' + afterEq.trim() + '". Put the value in quotes if "#" is part of it (common in passwords and URLs).');
      if (/^\s*['"`]/.test(afterEq) && e.value[0] && /['"`]/.test(e.value[0])) add(e.line, 'error', 'Opening quote never closed on this line: ' + e.key + ' gets the quote character itself in its value.');
    }
    if (e.swallowed) add(e.line, 'error', '"' + rawLine.trim() + '" ends with a space or tab after "=": the Node parser (node --env-file, Vite 8) then takes the NEXT line as the value, so ' + e.key + ' = "' + e.value.split('\n')[0].slice(0, 60) + '" and the variable on line ' + (e.line + 1) + ' is lost. Remove the trailing space or write ' + e.key + '="".');
    else if (e.end_line > e.line) add(e.line, 'warning', e.key + ' is a multi-line value (lines ' + e.line + '-' + e.end_line + '). If that is not intended, a quote is missing: every line in between is swallowed.');
    if (e.quote === '\'' && /\\n/.test(e.value)) add(e.line, 'info', 'In single quotes "\\n" stays two characters (backslash + n). Use double quotes for a real newline.');
    if (parser === 'node' && e.quote === '"' && /\\r/.test(e.value)) add(e.line, 'info', 'The Node parser only turns "\\n" into a newline, not "\\r" (dotenv does both).');
    if (parser !== 'node' && e.key !== e.key.trim()) {}
    if (parser === 'node' && /\s/.test(e.key)) add(e.line, 'warning', 'The key "' + e.key + '" contains a space: Node accepts it, dotenv ignores the line.');
    if (/^\s/.test(e.value) || /\s$/.test(e.value)) { if (!e.quote) {} }
  }
  return { entries: ex.entries, problems };
}

// ---------- expansion helpers ----------
const HAS_REF = /(?<!\\)\$\{[^{}]+\}|(?<!\\)\$[A-Za-z_][A-Za-z0-9_]*/;
function refsOf(v) { const out = []; const re = /(?<!\\)\$\{([A-Za-z0-9_.-]+)[^{}]*\}|(?<!\\)\$([A-Za-z_][A-Za-z0-9_]*)/g; let m; while ((m = re.exec(v))) out.push(m[1] || m[2]); return out; }

// ---------- Next.js : real @next/env code in a sandbox ----------
let NEXT_SRC = null;
function runNextEnv(files, dev, processEnv) {
  if (!NEXT_SRC) NEXT_SRC = fs.readFileSync(path.join(__dirname, 'vendor', 'next-env.js'), 'utf8');
  const store = {}; Object.keys(files).forEach(k => { store['/app/' + k.replace(/^\.?\//, '')] = String(files[k]); });
  const fakeFs = {
    statSync(p) { if (!(p in store)) { const e = new Error('ENOENT: ' + p); e.code = 'ENOENT'; throw e; } return { isFile: () => true, isFIFO: () => false }; },
    readFileSync(p) { if (!(p in store)) { const e = new Error('ENOENT: ' + p); e.code = 'ENOENT'; throw e; } return store[p]; },
    existsSync(p) { return p in store; }
  };
  const env = Object.assign({}, processEnv);
  const fakeProcess = { env, cwd: () => '/app', platform: 'linux', versions: process.versions };
  const mod = { exports: {} };
  const req = n => n === 'fs' ? fakeFs : n === 'path' ? path.posix : require(n);
  const ctx = vm.createContext({ module: mod, exports: mod.exports, require: req, process: fakeProcess, __dirname: '/', __filename: '/next-env.js', console: { log() {}, error() {}, warn() {}, info() {} }, Buffer, URL, Object, Array, Error, JSON, Set, Map, RegExp, String, Boolean });
  vm.runInContext(NEXT_SRC, ctx, { filename: 'next-env.js' });
  const silent = { info() {}, error() {}, warn() {}, log() {} };
  const r = mod.exports.loadEnvConfig('/app', dev, silent, true);
  const combined = Object.assign({}, r.combinedEnv); delete combined.__NEXT_PROCESSED_ENV;
  return { combined, parsed: Object.assign({}, r.parsedEnv), loaded: r.loadedEnvFiles.map(f => ({ path: f.path, env: Object.assign({}, f.env) })) };
}

function runaway(fn, who) {
  try { return fn(); } catch (e) {
    if (e.message === 'RUNAWAY') throw new Error('A value refers to itself in a way that grows without end (for example A=$A$A): ' + who + ' loops until the process runs out of memory. Remove the self-reference.');
    throw e;
  }
}

// ---------- resolution ----------
function normFiles(files) {
  if (!files || typeof files !== 'object' || Array.isArray(files)) throw new Error('"files" must be an object { "<file name>": "<content>" }, e.g. { ".env": "PORT=3000" }');
  const o = {}; for (const k of Object.keys(files)) { if (typeof files[k] !== 'string') throw new Error('content of ' + k + ' must be a string'); o[k.replace(/^\.\//, '')] = files[k]; }
  return o;
}

function resolve(opts) {
  const framework = opts.loader || 'dotenv';
  const files = normFiles(opts.files);
  const processEnv = Object.assign({}, opts.process_env || {});
  const parser = (framework === 'node' || framework === 'vite') ? 'node' : 'dotenv';
  const notes = [];
  let order; // files in the order the loader reads them
  let finalVars = {}; // key -> value as seen by the app (process.env or import.meta.env)
  let exposedPrefix = null;
  let mode = opts.mode;
  if (framework === 'dotenv') {
    order = Array.isArray(opts.order) && opts.order.length ? opts.order.map(f => f.replace(/^\.\//, '')) : (files['.env'] !== undefined ? ['.env'] : Object.keys(files).slice(0, 1));
    const override = !!opts.override;
    const parsedAll = {};
    for (const f of order) { if (files[f] === undefined) { notes.push(f + ' not given: skipped (dotenv silently ignores a missing file).'); continue; } dotenv.populate(parsedAll, dotenv.parse(files[f]), { override }); }
    const pe = Object.assign({}, processEnv);
    dotenv.populate(pe, parsedAll, { override });
    if (opts.expand) runaway(() => dotenvExpand.expand({ parsed: parsedAll, processEnv: pe }), 'dotenv-expand');
    finalVars = pe;
    notes.push(override ? 'override: true: later files win, and file values replace variables already set in the environment.' : 'Without override, the first file that defines a variable wins, and variables already set in the environment are never replaced.');
    if (!opts.expand) notes.push('No expansion: "$VAR" and "${VAR}" stay as written (dotenv alone does not expand; dotenv-expand or dotenvx do).');
  } else if (framework === 'node') {
    order = Array.isArray(opts.order) && opts.order.length ? opts.order.map(f => f.replace(/^\.\//, '')) : Object.keys(files);
    const pe = Object.assign({}, processEnv);
    const fromFiles = {};
    for (const f of order) { if (files[f] === undefined) { notes.push(f + ' not given: with --env-file Node stops with an error, with --env-file-if-exists it is skipped.'); continue; } Object.assign(fromFiles, parseNode(files[f])); }
    for (const k of Object.keys(fromFiles)) if (!Object.prototype.hasOwnProperty.call(pe, k)) pe[k] = fromFiles[k];
    finalVars = pe;
    notes.push('node --env-file: the last file that defines a variable wins; variables already set in the environment are never replaced. No expansion: "$VAR" stays as written.');
  } else if (framework === 'vite') {
    mode = mode || 'development';
    if (mode === 'local') throw new Error('"local" cannot be used as a mode name in Vite (it conflicts with the .local suffix).');
    order = ['.env', '.env.local', '.env.' + mode, '.env.' + mode + '.local'];
    const prefixes = Array.isArray(opts.env_prefix) ? opts.env_prefix : [opts.env_prefix || 'VITE_'];
    if (prefixes.includes('')) throw new Error('envPrefix cannot contain "" (Vite refuses it: it would expose every variable).');
    exposedPrefix = prefixes;
    const parsed = Object.fromEntries(order.flatMap(f => files[f] === undefined ? [] : Object.entries(parseNode(files[f]))));
    const pe = Object.assign({}, processEnv);
    if (parsed.NODE_ENV && pe.VITE_USER_NODE_ENV === undefined) pe.VITE_USER_NODE_ENV = parsed.NODE_ENV;
    if (parsed.BROWSER && pe.BROWSER === undefined) pe.BROWSER = parsed.BROWSER;
    if (parsed.BROWSER_ARGS && pe.BROWSER_ARGS === undefined) pe.BROWSER_ARGS = parsed.BROWSER_ARGS;
    const pcopy = Object.assign({}, pe);
    runaway(() => viteExpand.expand({ parsed, processEnv: pcopy }), 'Vite');
    const env = {};
    for (const [k, v] of Object.entries(parsed)) if (prefixes.some(p => k.startsWith(p))) env[k] = v;
    for (const k in pe) if (prefixes.some(p => k.startsWith(p))) env[k] = pe[k];
    finalVars = env;
    const ign = Object.keys(files).filter(f => !order.includes(f));
    if (ign.length) notes.push('Not read by Vite in mode "' + mode + '": ' + ign.join(', ') + '.');
    notes.push('Vite reads ' + order.join(', ') + ' (later files win); variables already set in the environment win over all files. Only names starting with ' + prefixes.join(' or ') + ' reach import.meta.env; the others are not available in client code (and not in process.env either, unless vite.config loads them).');
  } else if (framework === 'nextjs') {
    const nodeEnv = opts.mode || 'development';
    if (!['development', 'production', 'test'].includes(nodeEnv)) throw new Error('mode for nextjs must be development (next dev), production (next build / next start) or test (NODE_ENV=test)');
    const pe = Object.assign({}, processEnv);
    if (nodeEnv === 'test') pe.NODE_ENV = 'test';
    const r = runNextEnv(files, nodeEnv === 'development', pe);
    order = ['.env.' + nodeEnv + '.local', nodeEnv !== 'test' && '.env.local', '.env.' + nodeEnv, '.env'].filter(Boolean);
    finalVars = r.combined;
    exposedPrefix = ['NEXT_PUBLIC_'];
    mode = nodeEnv;
    const ign = Object.keys(files).filter(f => !order.includes(f));
    if (ign.length) notes.push('Not read by Next.js when NODE_ENV is ' + nodeEnv + ': ' + ign.join(', ') + (nodeEnv === 'test' && files['.env.local'] !== undefined ? ' (.env.local is skipped in tests on purpose)' : '') + '.');
    notes.push('Next.js reads ' + order.join(', ') + ': the first file that defines a variable wins, and variables already set in the environment win over all files. Only NEXT_PUBLIC_ variables are inlined into browser code, at build time.');
    return finish({ framework, files, order, finalVars, processEnv: pe, parser, exposedPrefix, mode, notes, nextLoaded: r.loaded, expand: true, keys: opts.keys });
  } else throw new Error('unknown loader "' + framework + '" (use dotenv, node, vite or nextjs)');
  return finish({ framework, files, order, finalVars, processEnv, parser, exposedPrefix, mode, notes, expand: framework === 'vite' || !!opts.expand, keys: opts.keys, override: !!opts.override });
}

function finish(c) {
  const { framework, files, order, finalVars, processEnv, parser, exposedPrefix, notes } = c;
  const perFile = {}; const problems = [];
  for (const f of order) if (files[f] !== undefined) { const l = lintFile(parser, f, files[f]); perFile[f] = l; problems.push(...l.problems); }
  // which file/line decides each key, by the loader's precedence
  const firstWins = framework === 'nextjs' || (framework === 'dotenv' && !c.override);
  const defs = {}; // key -> [{file,line,value,raw,quote}]
  for (const f of order) if (perFile[f]) {
    const last = new Map(); perFile[f].entries.forEach(e => last.set(e.key, e));
    for (const [k, e] of last) (defs[k] = defs[k] || []).push({ file: f, line: e.line, value: e.value, quote: e.quote });
  }
  const keys = new Set(Object.keys(defs));
  Object.keys(finalVars).forEach(k => { if (framework === 'vite' || framework === 'nextjs' || defs[k]) keys.add(k); });
  const variables = {};
  const want = Array.isArray(c.keys) && c.keys.length ? new Set(c.keys) : null;
  for (const k of [...keys].sort()) {
    if (want && !want.has(k)) continue;
    const d = defs[k] || [];
    const inEnv = Object.prototype.hasOwnProperty.call(processEnv, k);
    const v = { value: Object.prototype.hasOwnProperty.call(finalVars, k) ? finalVars[k] : null };
    let winner = null;
    if (inEnv && !(framework === 'dotenv' && c.override)) v.source = 'process environment (already set before loading, wins over the files)';
    else if (d.length) { winner = firstWins ? d[0] : d[d.length - 1]; v.source = winner.file + ':' + winner.line; }
    else if (inEnv) v.source = 'process environment';
    if (d.length) {
      v.defined_in = d.map(x => x.file + ':' + x.line);
      const losers = d.filter(x => x !== winner);
      if (losers.length) v.ignored_definitions = losers.map(x => ({ at: x.file + ':' + x.line, value: x.value }));
    }
    if (winner && v.value !== null && winner.value !== v.value && HAS_REF.test(winner.value) && c.expand) v.written_as = winner.value;
    if (winner && c.expand && HAS_REF.test(winner.value)) {
      const missing = refsOf(winner.value).filter(r => !Object.prototype.hasOwnProperty.call(processEnv, r) && !Object.prototype.hasOwnProperty.call(finalVars, r) && !defs[r]);
      if (missing.length) problems.push({ file: winner.file, line: winner.line, severity: 'warning', message: k + ' refers to ' + missing.map(m => '$' + m).join(', ') + ', which is defined nowhere: replaced by an empty string (or by its default, if one is written).' });
      if (winner.quote === '\'') problems.push({ file: winner.file, line: winner.line, severity: 'info', message: k + ' is in single quotes but is still expanded by ' + (framework === 'dotenv' ? 'dotenv-expand' : framework === 'vite' ? 'Vite' : 'Next.js') + ' (unlike a shell or Docker Compose). Write \\$ to keep a literal "$".' });
    }
    if (winner && !c.expand && HAS_REF.test(winner.value) && (framework === 'node' || framework === 'dotenv')) v.note = 'Kept literally: "' + winner.value + '" is not expanded by this loader.';
    if (exposedPrefix) v.exposed_to_browser = exposedPrefix.some(p => k.startsWith(p));
    if (framework === 'vite' && !v.exposed_to_browser) { v.value = null; v.note = 'Loaded from the file but not in import.meta.env: the name does not start with ' + exposedPrefix.join(' or ') + '.'; }
    if (framework === 'vite' && v.exposed_to_browser && /SECRET|PASSWORD|PRIVATE|TOKEN|API_KEY/i.test(k)) problems.push({ file: winner ? winner.file : '(environment)', line: winner ? winner.line : 0, severity: 'warning', message: k + ' looks like a secret but its prefix ships it in the browser bundle, readable by anyone.' });
    if (framework === 'nextjs' && v.exposed_to_browser && /SECRET|PASSWORD|PRIVATE|TOKEN|API_KEY/i.test(k)) problems.push({ file: winner ? winner.file : '(environment)', line: winner ? winner.line : 0, severity: 'warning', message: k + ' looks like a secret but NEXT_PUBLIC_ inlines it into the browser bundle, readable by anyone.' });
    variables[k] = v;
  }
  // Vite's alphabetical expansion trap
  if (framework === 'vite') {
    for (const k of Object.keys(defs)) {
      const w = defs[k][defs[k].length - 1];
      for (const r of refsOf(w.value)) if (defs[r] && Buffer.compare(Buffer.from(r), Buffer.from(k)) > 0 && !Object.prototype.hasOwnProperty.call(processEnv, r)) problems.push({ file: w.file, line: w.line, severity: 'info', message: k + ' uses $' + r + ': Vite expands variables in alphabetical order, so ' + r + ' is used before its own references are expanded.' });
    }
  }
  const out = { loader: framework, mode: c.mode, files_read_in_order: order.filter(f => files[f] !== undefined), variables, problems, notes };
  if (!c.mode) delete out.mode;
  return out;
}

function parseOnly(content, parser) {
  const p = parser === 'node' || parser === 'vite' ? 'node' : 'dotenv';
  const values = p === 'node' ? parseNode(content) : dotenv.parse(content);
  const l = lintFile(p, '.env', content);
  const last = new Map(); l.entries.forEach(e => last.set(e.key, e));
  const variables = {};
  for (const k of Object.keys(values)) { const e = last.get(k); variables[k] = { value: values[k], line: e ? e.line : null }; if (e && e.end_line > e.line) variables[k].lines = e.line + '-' + e.end_line; }
  return { parser: p === 'node' ? 'node (node --env-file, process.loadEnvFile, util.parseEnv, Vite 8)' : 'dotenv (npm dotenv 16-17, Next.js, dotenv-cli, Prisma)', variables, problems: l.problems };
}

function compareParsers(content) {
  const a = dotenv.parse(content), b = parseNode(content);
  const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])].sort();
  const differences = [];
  for (const k of keys) {
    const x = Object.prototype.hasOwnProperty.call(a, k) ? a[k] : null, y = Object.prototype.hasOwnProperty.call(b, k) ? b[k] : null;
    if (x !== y) differences.push({ key: k, dotenv: x, node: y });
  }
  return { same: differences.length === 0, differences, dotenv: a, node: b };
}

module.exports = { parseDotenvExplained, parseNodeExplained, parseNode, lintFile, resolve, parseOnly, compareParsers, runNextEnv, dotenv, dotenvExpand };
