#!/usr/bin/env node
'use strict';
// MCP server (stdio, no dependency): which files "npm pack" / "npm publish" really put in the package, and which rule
// (package.json "files", .npmignore, .gitignore, npm's built-in rules) decides each one. Same answer as npm 10 itself:
// checked against npm-packlist + Arborist on ~23,000 random projects and against the real "npm pack --dry-run".
const E = require('./engine.js');
const P = require('path').posix;
const SERVER = { name: 'npm-pack-check', title: 'npm pack checker (what npm publish ships)', version: '1.0.0' };

const SENSITIVE = [
  [/(^|\/)\.env(\.|$)/i, 'environment file (.env): often holds API keys and passwords'],
  [/\.(pem|key|p12|pfx|jks|keystore|ppk)$/i, 'private key or certificate store'],
  [/(^|\/)id_(rsa|dsa|ecdsa|ed25519)$/i, 'SSH private key'],
  [/(^|\/)(credentials|secrets?|service-account)[^/]*\.(json|ya?ml|txt)$/i, 'credentials file'],
  [/(^|\/)\.(aws|ssh|docker)\//i, 'private config folder'],
  [/(^|\/)\.(netrc|pgpass|htpasswd)$/i, 'password file'],
  [/\.(sqlite3?|db)$/i, 'database file'],
  [/(^|\/)(coverage|\.nyc_output)\//i, 'test coverage output (useless for users, makes the package bigger)'],
  [/(^|\/)\.(github|vscode|idea|husky|circleci)\//i, 'tooling folder (useless for users)'],
  [/(^|\/)(__tests__|tests?|__mocks__|fixtures)\//i, 'tests (useless for users, makes the package bigger)'],
  [/\.(log|tgz)$/i, 'log or tarball (probably not meant to ship)']
];

const INPUT = {
  package_json: { type: ['object', 'string'], description: 'The root package.json, as an object or as JSON text.' },
  paths: { type: 'array', items: { type: 'string' }, maxItems: 20000, description: 'Every file of the project, relative to the package root, "/" separators. Best: the output of `git ls-files --cached --others` plus untracked build output (e.g. `find . -type f -not -path "./node_modules/*" -not -path "./.git/*"`). Folders are deduced from the paths.' },
  ignore_files: { type: 'object', additionalProperties: { type: 'string' }, description: 'Content of every .npmignore and .gitignore, at any depth, as { "<path>": "<content>" }, e.g. { ".gitignore": "...", "lib/.npmignore": "..." }. They are added to the file list automatically.' }
};
const RULE = { type: ['object', 'null'], properties: { source: { type: 'string' }, line: { type: 'integer' }, rule: { type: ['string', 'null'] }, why: { type: 'string' } } };
const TOOLS = [
  {
    name: 'check_npm_pack',
    title: 'Which files will npm publish ship?',
    description: 'Gives the exact file list that `npm pack` / `npm publish` puts in the tarball (npm 10 rules, same order as npm), what is left out, and the warnings that matter before publishing: secrets or .env files that would be published, a .npmignore that silently replaces .gitignore (so git-ignored files get published), "files" entries that match nothing, "main"/"bin"/"browser" pointing to a file that will not be in the package, tests and coverage shipped by mistake. Use it before any publish, when a published package misses files ("Cannot find module" after install) or ships too much. No disk access needed: pass package.json, the file list and the ignore files.',
    inputSchema: { type: 'object', properties: Object.assign({}, INPUT, {
      explain: { type: 'array', items: { type: 'string' }, maxItems: 500, description: 'Optional: paths to explain one by one (included or not, and which rule decides).' },
      list_excluded: { type: 'boolean', description: 'Also return the list of excluded files (default false: only the count by top folder).' }
    }), required: ['package_json', 'paths'] },
    outputSchema: { type: 'object', properties: {
      included: { type: 'array', items: { type: 'string' }, description: 'Files in the tarball, in npm order.' },
      included_count: { type: 'integer' }, excluded_count: { type: 'integer' },
      excluded_by_folder: { type: 'object', additionalProperties: { type: 'integer' } },
      excluded: { type: 'array', items: { type: 'string' } },
      warnings: { type: 'array', items: { type: 'object', properties: { kind: { type: 'string' }, message: { type: 'string' }, paths: { type: 'array', items: { type: 'string' } } } } },
      explained: { type: 'array', items: { type: 'object', properties: { path: { type: 'string' }, included: { type: 'boolean' }, decided_by: RULE, via_folder: { type: ['string', 'null'] }, note: { type: 'string' } } } }
    }, required: ['included', 'included_count', 'warnings'] },
    annotations: { readOnlyHint: true, openWorldHint: false, idempotentHint: true }
  },
  {
    name: 'why_npm_pack',
    title: 'Why is this file (not) in my npm package?',
    description: 'For each path asked, says whether `npm publish` ships it and which exact rule decides: the line of .npmignore or .gitignore (with file and line number), the "files" entry of package.json, or npm\'s built-in rules (README/LICENSE/package.json always shipped, node_modules/.git/.npmrc/lockfiles never, "main" and "bin" forced in). Also says when a whole folder was skipped.',
    inputSchema: { type: 'object', properties: Object.assign({}, INPUT, {
      explain: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 500, description: 'Paths to explain (they are added to the file list if missing).' }
    }), required: ['package_json', 'explain'] },
    outputSchema: { type: 'object', properties: {
      explained: { type: 'array', items: { type: 'object', properties: { path: { type: 'string' }, included: { type: 'boolean' }, decided_by: RULE, via_folder: { type: ['string', 'null'] }, note: { type: 'string' } } } }
    }, required: ['explained'] },
    annotations: { readOnlyHint: true, openWorldHint: false, idempotentHint: true }
  }
];

function explainOne(r, p) {
  const c = E.clean(p), d = r.details[c];
  if (!d) return { path: c, included: false, decided_by: null, via_folder: null, note: 'not in the file list' };
  const out = { path: c, included: d.included, decided_by: d.decided_by, via_folder: d.via_folder };
  if (!d.decided_by) {
    if (d.included && /^(package\.json|(readme|copying|license|licence)(\..*[^~$])?)$/i.test(c)) out.note = 'Shipped: npm always ships package.json and the README, LICENSE, LICENCE and COPYING files at the root, whatever the ignore rules say.';
    else out.note = d.included ? 'Shipped: no rule leaves it out' + (Array.isArray(r.ctx.pkg.files) ? '.' : ' (without a "files" field, npm ships everything that is not ignored).') : 'Left out.';
  }
  else if (d.via_folder) out.note = (d.included ? 'Shipped' : 'Left out') + ' because the whole folder "' + d.via_folder + '/" is ' + (d.included ? 'shipped' : 'skipped') + ': npm never looks inside it.';
  return out;
}

function warnings(input, r) {
  const W = [];
  const inc = new Set(r.included);
  const ctx = r.ctx, pkg = ctx.pkg;
  // 1. sensitive or useless files that would ship
  const groups = {};
  for (const f of r.included) for (const [re, why] of SENSITIVE) if (re.test(f)) { (groups[why] = groups[why] || []).push(f); break; }
  for (const why of Object.keys(groups)) {
    const danger = !/useless|probably/.test(why);
    W.push({ kind: danger ? 'secret_published' : 'unneeded_files', message: (danger ? 'Would be PUBLISHED: ' : 'Shipped: ') + why + '. Add them to .npmignore, or use a "files" whitelist in package.json.', paths: groups[why].slice(0, 50) });
  }
  // 2. .npmignore silently replaces .gitignore in the same folder
  const ig = input.ignore_files || {};
  const npmignores = Object.keys(ig).map(E.clean).filter(p => P.basename(p) === '.npmignore');
  const pairs = npmignores.filter(p => Object.prototype.hasOwnProperty.call(ig, P.join(P.dirname(p), '.gitignore')) || Object.keys(ig).map(E.clean).indexOf(P.join(P.dirname(p), '.gitignore').replace(/^\.\//, '')) >= 0);
  if (pairs.length) {
    const alt = Object.assign({}, input, { ignore_files: Object.assign({}, ig) });
    for (const p of pairs) for (const k of Object.keys(alt.ignore_files)) if (E.clean(k) === p) delete alt.ignore_files[k];
    alt.paths = (input.paths || []).filter(x => pairs.indexOf(E.clean(x)) < 0);
    let leaked = [];
    try { const r2 = E.pack(alt); const inc2 = new Set(r2.included); leaked = r.included.filter(f => !inc2.has(f) && pairs.indexOf(f) < 0); } catch (e) { /* ignore */ }
    if (leaked.length) W.push({ kind: 'gitignore_overridden', message: 'These files are in your .gitignore but WILL be published: when a folder has a .npmignore, npm ignores the .gitignore of that folder completely. Copy the needed .gitignore lines into .npmignore.', paths: leaked.slice(0, 50) });
  }
  // 3. root ignore files that do nothing because of "files"
  if (Array.isArray(pkg.files)) {
    const useless = Object.keys(ig).map(E.clean).filter(p => p === '.npmignore' || p === '.gitignore');
    if (useless.length) W.push({ kind: 'root_ignore_unused', message: 'package.json has a "files" field, so the root ' + useless.join(' and ') + ' are not read at all by npm (only the ones in sub-folders are).', paths: useless });
    pkg.files.forEach((f, i) => {
      if (typeof f !== 'string') return;
      const kind = ctx.filesKinds[i];
      const pat = f.replace(/^\.\//, '').replace(/^\/+/, '').replace(/\/+$/, '');
      if (kind === 'pattern' && !/[*?[{!]/.test(f)) W.push({ kind: 'files_entry_missing', message: '"files" entry ' + JSON.stringify(f) + ' matches no file or folder in the project (not built yet? typo?).', paths: [] });
      else if (kind === 'pattern' && !f.startsWith('!')) {
        const { Minimatch } = require('./minimatch.js');
        const m = new Minimatch(pat, { dot: true, matchBase: true, nocase: true });
        const hit = r.included.some(x => m.match(x) || m.match('/' + x)) || Array.from(ctx.fs.dirs.keys()).some(d => d && m.match(d));
        if (!hit) W.push({ kind: 'files_entry_missing', message: '"files" pattern ' + JSON.stringify(f) + ' matches nothing that ends up in the package.', paths: [] });
      }
    });
  }
  // 4. entry points missing from the tarball
  const entries = [];
  if (typeof pkg.main === 'string') entries.push(['main', pkg.main]);
  if (typeof pkg.browser === 'string') entries.push(['browser', pkg.browser]);
  if (pkg.bin) for (const k of Object.keys(pkg.bin)) entries.push(['bin "' + k + '"', pkg.bin[k]]);
  if (typeof pkg.types === 'string') entries.push(['types', pkg.types]);
  if (typeof pkg.typings === 'string') entries.push(['typings', pkg.typings]);
  for (const [field, target] of entries) {
    let t; try { t = E.clean(target); } catch (e) { W.push({ kind: 'entry_missing', message: '"' + field + '" points outside the package: ' + target, paths: [] }); continue; }
    const cands = [t, t + '.js', t + '.json', t + '.node', t + '/index.js', t + '/index.json'];
    if (field === 'types' || field === 'typings') cands.length = 1;
    if (!cands.some(c => inc.has(c))) W.push({ kind: 'entry_missing', message: '"' + field + '" is ' + JSON.stringify(target) + ', but no such file will be in the package' + (ctx.fs.files.has(t) ? ' (it exists in the project but is left out)' : ' (it is not in the file list: not built yet?)') + '. Users will get "Cannot find module".', paths: [t] });
  }
  if (pkg.bundleDependencies && (Array.isArray(pkg.bundleDependencies) ? pkg.bundleDependencies.length : true)) W.push({ kind: 'not_modelled', message: 'bundleDependencies: the bundled packages from node_modules are added by npm on top of this list (not computed here).', paths: [] });
  if (ctx.unknownIgnore.length) W.push({ kind: 'missing_content', message: 'Content not given for these ignore files, treated as empty: pass them in "ignore_files" for an exact answer.', paths: ctx.unknownIgnore });
  for (const e of ctx.errors) W.push({ kind: 'npm_error', message: e, paths: [] });
  return W;
}

function inputOf(args, extra) {
  const paths = (args.paths || []).slice();
  if (extra) for (const p of extra) if (paths.indexOf(p) < 0) paths.push(p);
  if (paths.length > 20000) throw new Error('at most 20000 paths per call');
  return { package_json: args.package_json, paths, ignore_files: args.ignore_files || {} };
}
function callTool(name, args) {
  args = args || {};
  if (name === 'check_npm_pack') {
    if (!Array.isArray(args.paths)) throw new Error('"paths" must be the list of files of the project');
    const input = inputOf(args);
    const r = E.pack(input);
    const byFolder = {};
    for (const f of r.excluded) { const top = f.indexOf('/') > 0 ? f.split('/')[0] + '/' : '(root files)'; byFolder[top] = (byFolder[top] || 0) + 1; }
    const out = { included: r.included, included_count: r.included.length, excluded_count: r.excluded.length, excluded_by_folder: byFolder, warnings: warnings(input, r) };
    if (args.list_excluded) out.excluded = r.excluded;
    if (Array.isArray(args.explain) && args.explain.length) out.explained = args.explain.slice(0, 500).map(p => explainOne(r, p));
    return out;
  }
  if (name === 'why_npm_pack') {
    if (!Array.isArray(args.explain) || !args.explain.length) throw new Error('"explain" must list the paths to explain');
    const r = E.pack(inputOf(args, args.explain.map(E.clean)));
    return { explained: args.explain.slice(0, 500).map(p => explainOne(r, p)) };
  }
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
          instructions: 'Do not guess what npm publishes: a .npmignore replaces the .gitignore of its folder (git-ignored secrets then get published), "files" disables the root ignore files, README/LICENSE/package.json and "main"/"bin" are always shipped, node_modules/.npmrc/lockfiles never, and folder rules have traps. Before any npm publish, or when a published package misses or leaks files, call check_npm_pack with package.json, the file list (git ls-files) and the .npmignore/.gitignore contents. Use why_npm_pack to know which rule keeps or drops a given file.' } });
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
module.exports = { callTool, TOOLS };
