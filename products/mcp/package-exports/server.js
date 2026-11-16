#!/usr/bin/env node
'use strict';
// MCP server (stdio, no dependency): which file does Node load for `import "pkg/sub"` or `require("pkg/sub")`,
// and why? Same rules as Node 22's resolver for package.json "exports", "imports" and "main" (ported from its source),
// checked against the real Node on about 400,000 random cases and 472 real npm packages.
const fs = require('fs');
const path = require('path');
const E = require('./engine.js');
const SERVER = { name: 'package-exports', title: 'package.json exports resolver (which file Node loads, and why)', version: '1.0.0' };

const SOURCE = {
  package_dir: { type: 'string', description: 'Folder of the package (the one with its package.json), or a project folder: then the package named in "specifier" is looked up in node_modules, like Node does. Files are checked for real. Easiest when the server runs on your machine.' },
  package_json: { type: ['object', 'string'], description: 'Or: the content of the package.json (object or JSON text).' },
  files: { type: 'array', items: { type: 'string' }, maxItems: 20000, description: 'Optional with package_json: the files of the package (e.g. "dist/index.mjs"), so missing files and folders are reported as Node would. Without it, existence is not checked.' },
  conditions: { type: 'array', items: { type: 'string' }, description: 'Extra conditions, like `node --conditions` / `-C` (e.g. ["development"], ["browser"], ["react-server"]). Node always uses "default", plus "node", "import" or "require", "module-sync" and "node-addons".' },
  exact_conditions: { type: 'array', items: { type: 'string' }, description: 'Or: the full condition list, replacing Node\'s defaults (to mimic a bundler, e.g. ["browser", "import", "module"]). "default" always matches.' }
};

const RES = { type: 'object', properties: {
  ok: { type: 'boolean' }, file: { type: 'string' }, path: { type: 'string' }, exists: { type: ['boolean', 'null'] }, format: { type: 'string' },
  via: { type: 'string' }, matched_key: { type: 'string' }, star: { type: 'string' }, condition_path: { type: 'array', items: { type: 'string' } },
  builtin: { type: 'string' }, external: { type: 'string' }, warning: { type: 'string' }, note: { type: 'string' },
  error: { type: 'object', properties: { code: { type: 'string' }, message: { type: 'string' } } },
  conditions: { type: 'array', items: { type: 'string' } }, trace: { type: 'array', items: { type: 'string' } }
} };

const TOOLS = [
  {
    name: 'resolve_package_import',
    title: 'Which file does Node load for this import?',
    description: 'Answers "which file does `import \'pkg/sub\'` or `require(\'pkg/sub\')` load, and why?" exactly like Node 22: package.json "exports" (subpaths, * patterns, nested conditions, arrays, null), "imports" (#internal specifiers) and the old "main" fallback. Gives the file, its format (ES module or CommonJS), the key and the chain of conditions that decided (e.g. "./client" › import › default), a step-by-step trace, and Node\'s exact error code when it fails (ERR_PACKAGE_PATH_NOT_EXPORTED, ERR_UNSUPPORTED_DIR_IMPORT, ERR_PACKAGE_IMPORT_NOT_DEFINED, MODULE_NOT_FOUND…). By default it answers for both import and require: see dual packages, ESM-only packages, and "works in ESM, fails in CommonJS". Use it to debug "Package subpath is not defined by exports", to check a package.json before publishing, or to know what a dependency really ships. The rules are subtle (condition order, "default" placement, pattern priority, trailing slashes): do not guess them.',
    inputSchema: { type: 'object', properties: Object.assign({
      specifier: { type: 'string', description: 'What the code imports: "react-dom/client", "@scope/pkg/utils", "#internal/x", "." for the package itself, or "./sub" (a subpath of the given package).' },
      mode: { type: 'string', enum: ['both', 'import', 'require'], description: 'import (ES modules, import / import()), require (CommonJS), or both (default).' }
    }, SOURCE), required: ['specifier'] },
    outputSchema: { type: 'object', properties: { specifier: { type: 'string' }, package: { type: 'string' }, package_json: { type: 'string' }, summary: { type: 'string' }, import: RES, require: RES }, required: ['summary'] },
    annotations: { readOnlyHint: true, openWorldHint: false, idempotentHint: true }
  },
  {
    name: 'list_package_exports',
    title: 'What does this package expose, and what is wrong with its exports?',
    description: 'Lists every public entry point of a package from package.json "exports" (and "imports"), with the file that import and require each load, the files each * pattern really exposes (with package_dir), and the mistakes Node will not tell you about: conditions written after "default" (never used), "types" not first (TypeScript misses the types), targets without "./", folder keys ending in "/" (removed in Node 17), entries pointing to missing files, "main" ignored because "exports" has no ".", import and require loading different files (dual package hazard), "./package.json" not exported. Use it before publishing a package, or to know which subpaths of a dependency you may import.',
    inputSchema: { type: 'object', properties: Object.assign({
      package: { type: 'string', description: 'With a project folder in package_dir: the package to inspect in node_modules (e.g. "react-dom").' },
      mode: { type: 'string', enum: ['both', 'import', 'require'], description: 'Default both.' }
    }, SOURCE) },
    outputSchema: { type: 'object', properties: { name: { type: ['string', 'null'] }, type: { type: 'string' }, has_exports: { type: 'boolean' }, summary: { type: 'string' }, package_json: { type: 'string' },
      entries: { type: 'array', items: { type: 'object' } }, imports: { type: 'array', items: { type: 'object' } },
      problems: { type: 'array', items: { type: 'object', properties: { severity: { type: 'string' }, where: { type: 'string' }, problem: { type: 'string' }, fix: { type: 'string' } } } } }, required: ['summary', 'entries', 'problems'] },
    annotations: { readOnlyHint: true, openWorldHint: false, idempotentHint: true }
  }
];

function parseJson(x, what) {
  if (x == null) return null;
  if (typeof x === 'object') return x;
  try { return JSON.parse(x); } catch (e) { throw new Error(what + ' is not valid JSON: ' + e.message); }
}

function readPj(dir) {
  const f = path.join(dir, 'package.json');
  try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { return e.code === 'ENOENT' ? null : (() => { throw new Error(`${f} is not valid JSON: ${e.message}`); })(); }
}

// Finds the package: the folder itself if its name matches (or no name is asked), else node_modules/<name> upward.
function locate(args, wantName) {
  if (args.package_dir) {
    let dir = path.resolve(String(args.package_dir));
    if (!fs.existsSync(dir)) throw new Error(`cannot read ${dir}. If the server runs in Docker, mount the folder, or pass "package_json" (and "files").`);
    if (fs.statSync(dir).isFile()) dir = path.dirname(dir);
    const own = readPj(dir);
    if (own && (!wantName || own.name === wantName)) return { pkg: own, root: dir, where: path.join(dir, 'package.json') };
    if (wantName) {
      for (let d = dir; ; d = path.dirname(d)) {
        const c = path.join(d, 'node_modules', wantName);
        const pj = readPj(c);
        if (pj) return { pkg: pj, root: c, where: path.join(c, 'package.json') };
        if (path.dirname(d) === d) break;
      }
      if (own) return { pkg: own, root: dir, where: path.join(dir, 'package.json'), note: `"${wantName}" is not in any node_modules above ${dir}: resolved against ${own.name || 'this'} package.json instead` };
      throw new Error(`package "${wantName}" not found in ${dir} or any node_modules above it (run npm install?)`);
    }
    throw new Error(`no package.json in ${dir}`);
  }
  const pkg = parseJson(args.package_json, 'package_json');
  if (!pkg) throw new Error('give "package_dir" (package or project folder) or "package_json" (its content)');
  return { pkg, files: Array.isArray(args.files) ? args.files : null, where: 'package.json given inline' };
}

function opts(loc, args) {
  return { root: loc.root, files: loc.files, extra_conditions: Array.isArray(args.conditions) ? args.conditions : [], conditions: Array.isArray(args.exact_conditions) ? args.exact_conditions : null, ignore_name: true };
}

function line(m, r) {
  if (!r.ok) return `${m}: fails with ${r.error.code} (${r.error.message})`;
  if (r.builtin) return `${m}: Node built-in ${r.builtin}`;
  return `${m}: ${r.file}` + (r.condition_path && r.condition_path.length ? ` (${r.condition_path.join(' › ')})` : '') + (r.exists === null ? ' [existence not checked]' : '') + (r.format ? `, ${r.format.split(' (')[0]}` : '');
}

function callTool(name, args) {
  args = args || {};
  const modes = args.mode === 'import' ? ['import'] : args.mode === 'require' ? ['require'] : ['import', 'require'];
  if (name === 'resolve_package_import') {
    const spec = String(args.specifier || '').trim();
    if (!spec) throw new Error('give "specifier", e.g. "react-dom/client" or "#utils"');
    let want = null;
    try { const p = E.parseSpecifier(spec); want = p.name && p.kind === 'exports' ? p.name : null; } catch (e) { /* reported below */ }
    const loc = locate(args, want);
    const out = { specifier: spec, package: loc.pkg.name || null, package_json: loc.where };
    if (loc.note) out.note = loc.note;
    const lines = [];
    for (const m of modes) { out[m] = E.resolveOne(loc.pkg, spec, m, opts(loc, args)); lines.push(line(m, out[m])); }
    if (out.import && out.require && out.import.ok && out.require.ok && out.import.file && out.import.file !== out.require.file) lines.push('import and require load different files');
    out.summary = lines.join('; ');
    return out;
  }
  if (name === 'list_package_exports') {
    const loc = locate(args, args.package ? String(args.package) : null);
    const o = Object.assign(opts(loc, args), { mode: modes.length === 1 ? modes[0] : 'both' });
    const r = E.listExports(loc.pkg, o);
    r.package_json = loc.where;
    if (r.entries.length > 300) { r.entries_total = r.entries.length; r.entries = r.entries.slice(0, 300); r.entries_truncated = true; }
    return r;
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
          instructions: 'Do not guess which file a package.json "exports" map gives for an import: condition order, "default" placement, * pattern priority, null targets and trailing slashes change the answer, and import and require often differ. Call resolve_package_import for one specifier (both import and require by default, with Node\'s exact error code when it fails), and list_package_exports to see every public entry point of a package and the mistakes in its exports.' } });
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
      const l = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
      if (!l) continue;
      let m; try { m = JSON.parse(l); } catch (e) { send({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }); continue; }
      if (Array.isArray(m)) m.forEach(handle); else handle(m);
    }
  });
}
module.exports = { callTool, TOOLS };
