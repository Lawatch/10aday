#!/usr/bin/env node
'use strict';
// MCP server (stdio, no dependency): "why is this package installed, in which version, and who pulls it in?",
// read from package-lock.json the way npm 10 reads it (same tree as `npm explain` / `npm ls`), plus the packages
// installed in several versions. Checked against npm's own code (@npmcli/arborist 8) on 114 real lockfiles.
const fs = require('fs');
const path = require('path');
const E = require('./engine.js');
const SERVER = { name: 'npm-why', title: 'npm why (who installs this package, from package-lock.json)', version: '1.0.0' };

const SOURCE = {
  lockfile_path: { type: 'string', description: 'Path to package-lock.json / npm-shrinkwrap.json, or to the project folder (the package.json next to it is read too, for "overrides"). Easiest when the server runs on your machine.' },
  lockfile: { type: ['object', 'string'], description: 'Or: the content of package-lock.json (object or JSON text), lockfileVersion 2 or 3.' },
  package_json: { type: ['object', 'string'], description: 'Optional: the root package.json (object or JSON text), used for "overrides". Read automatically with lockfile_path.' }
};

const DEP = { type: 'object', properties: { package: { type: 'string' }, location: { type: 'string' }, type: { type: 'string' }, spec: { type: 'string' }, original_spec: { type: 'string' }, overridden: { type: 'boolean' }, error: { type: 'string' } } };
const TOOLS = [
  {
    name: 'why_npm_package',
    title: 'Why is this npm package installed?',
    description: 'Answers "why is X in my node_modules, which version, and who pulls it in?" from package-lock.json, exactly like `npm explain X` but without node_modules: every installed copy of the package (version and folder), whether it is a direct dependency, dev-only or optional, the packages that require it with their version ranges, and the full chains from your package.json (your project › express@4.21.2 › debug@2.6.9). Give a version range (e.g. "<4.17.21") to find only the vulnerable copies after a security alert, and see which top-level dependency to upgrade. Handles workspaces, aliases (npm:), overrides, bundled and peer dependencies. Use it instead of reading the lockfile yourself: lockfiles are thousands of lines and the nested node_modules rules decide which copy each package gets.',
    inputSchema: { type: 'object', properties: Object.assign({}, SOURCE, {
      package: { type: 'string', description: 'Package name, e.g. "debug" or "@babel/core".' },
      packages: { type: 'array', items: { type: 'string' }, maxItems: 20, description: 'Or several package names at once.' },
      version: { type: 'string', description: 'Optional semver range: only copies whose version matches (e.g. "<4.17.21" for a vulnerability, "^7").' },
      max_paths: { type: 'integer', minimum: 1, maximum: 50, description: 'Chains to show per copy, shortest first (default 5).' }
    }) },
    outputSchema: { type: 'object', properties: {
      results: { type: 'array', items: { type: 'object', properties: {
        package: { type: 'string' }, found: { type: 'boolean' }, summary: { type: 'string' },
        installed_versions: { type: 'array', items: { type: 'string' } }, copies: { type: 'integer' },
        installed: { type: 'array', items: { type: 'object', properties: {
          version: { type: 'string' }, location: { type: 'string' }, kind: { type: 'array', items: { type: 'string' } }, kind_text: { type: 'string' },
          direct_dependency: { type: 'boolean' }, dependents: { type: 'array', items: DEP }, dependents_count: { type: 'integer' },
          paths: { type: 'array', items: { type: 'string' } }, top_level_dependencies: { type: 'array', items: { type: 'string' } }
        } } }
      } } },
      lockfile: { type: 'string' }
    }, required: ['results'] },
    annotations: { readOnlyHint: true, openWorldHint: false, idempotentHint: true }
  },
  {
    name: 'npm_duplicates',
    title: 'Which npm packages are installed in several versions?',
    description: 'Lists the packages that package-lock.json installs in more than one version (e.g. 4 versions of chalk), with how many copies, where, and which package asks for each version. Use it to shrink node_modules or a bundle, to understand "two copies of React" or "instanceof fails" bugs, and to know what `npm dedupe` or an upgrade could remove.',
    inputSchema: { type: 'object', properties: Object.assign({}, SOURCE, {
      limit: { type: 'integer', minimum: 1, maximum: 500, description: 'Maximum packages to list, worst first (default 30).' }
    }) },
    outputSchema: { type: 'object', properties: {
      packages_in_lockfile: { type: 'integer' }, duplicated_packages: { type: 'integer' }, extra_copies: { type: 'integer' }, summary: { type: 'string' },
      duplicates: { type: 'array', items: { type: 'object', properties: { package: { type: 'string' }, versions: { type: 'integer' }, copies: { type: 'integer' },
        by_version: { type: 'array', items: { type: 'object', properties: { version: { type: 'string' }, copies: { type: 'integer' }, locations: { type: 'array', items: { type: 'string' } }, required_by: { type: 'array', items: { type: 'string' } } } } } } } }
    }, required: ['summary', 'duplicates'] },
    annotations: { readOnlyHint: true, openWorldHint: false, idempotentHint: true }
  }
];

function parseJson(x, what) {
  if (x == null) return null;
  if (typeof x === 'object') return x;
  try { return JSON.parse(x); } catch (e) { throw new Error(what + ' is not valid JSON: ' + e.message); }
}

function loadTree(args) {
  let lock = null, pkg = parseJson(args.package_json, 'package_json'), where = 'lockfile given inline';
  if (args.lockfile_path) {
    let p = path.resolve(String(args.lockfile_path));
    let st;
    try { st = fs.statSync(p); } catch (e) { throw new Error(`cannot read ${p}: ${e.code || e.message}. If the server runs in Docker, mount the project folder, or pass the file content as "lockfile".`); }
    if (st.isDirectory()) {
      const cand = ['npm-shrinkwrap.json', 'package-lock.json'].map(f => path.join(p, f)).find(f => fs.existsSync(f));
      if (!cand) throw new Error(`no package-lock.json or npm-shrinkwrap.json in ${p}` + (fs.existsSync(path.join(p, 'yarn.lock')) ? ' (this project uses yarn)' : fs.existsSync(path.join(p, 'pnpm-lock.yaml')) ? ' (this project uses pnpm)' : ''));
      p = cand;
    }
    lock = fs.readFileSync(p, 'utf8');
    where = p;
    if (!pkg) { try { pkg = JSON.parse(fs.readFileSync(path.join(path.dirname(p), 'package.json'), 'utf8')); } catch (e) { pkg = null; } }
  } else if (args.lockfile != null) {
    lock = parseJson(args.lockfile, 'lockfile');
  } else throw new Error('give "lockfile_path" (file or project folder) or "lockfile" (its content)');
  return { tree: new E.Tree(lock, pkg), where };
}

function callTool(name, args) {
  args = args || {};
  if (name === 'why_npm_package') {
    const names = (Array.isArray(args.packages) ? args.packages : []).concat(args.package ? [args.package] : []).map(String).filter(Boolean);
    if (!names.length) throw new Error('give "package" (a package name) or "packages"');
    const { tree, where } = loadTree(args);
    const results = [...new Set(names)].slice(0, 20).map(n => {
      const r = E.why(tree, n.trim(), { version: args.version, max_paths: args.max_paths });
      for (const i of r.installed) if (i.dependents.length > 30) { i.dependents = i.dependents.slice(0, 30); i.dependents_truncated = true; }
      return r;
    });
    return { results, lockfile: where };
  }
  if (name === 'npm_duplicates') {
    const { tree, where } = loadTree(args);
    return Object.assign(E.duplicates(tree, { limit: args.limit }), { lockfile: where });
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
          instructions: 'Do not read package-lock.json by hand to say which version of a package is installed or why: the same package often has several copies in nested node_modules, and which copy a package gets depends on npm\'s resolution rules, overrides and workspaces. Call why_npm_package (like `npm explain`, no node_modules needed) with the project folder or the lockfile, and a version range after a security alert. Call npm_duplicates to see packages installed in several versions.' } });
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
