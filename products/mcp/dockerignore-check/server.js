#!/usr/bin/env node
'use strict';
// MCP server (stdio, no dependency): which files does `docker build` really send, and which .dockerignore line decides?
// Exact port of Docker's own code (moby/patternmatcher + tonistiigi/fsutil), checked against it on 42,000 random cases.
const E = require('./engine.js');
const SERVER = { name: 'dockerignore-check', title: 'Dockerignore checker (exact Docker rules)', version: '1.0.0' };

const RULE = { type: ['object', 'null'], properties: { line: { type: 'integer' }, pattern: { type: 'string' } } };
const DI = { type: 'string', description: 'Content of the .dockerignore file (or of <Dockerfile name>.dockerignore, which takes precedence when it exists).' };
const TOOLS = [
  {
    name: 'check_dockerignore',
    title: 'Which files go into the Docker build context?',
    description: 'Tells, exactly as Docker BuildKit does, whether each path is sent to the build context (so COPY/ADD can see it) or excluded by .dockerignore, and which line decides. .dockerignore is NOT .gitignore: "*.log" only matches at the root (use "**/*.log"), "node_modules" does not exclude packages/app/node_modules, a trailing "/" is ignored, "#" must be at column 1, and the last matching line wins. Use it before writing a .dockerignore, when COPY fails with "not found", when the context is huge or when secrets (.env, .git) might leak into the image. Pass the .dockerignore content and the project paths; no Docker or file access needed.',
    inputSchema: { type: 'object', properties: {
      dockerignore: DI,
      paths: { type: 'array', items: { type: 'string' }, maxItems: 5000, description: 'Paths relative to the build context root, with "/" separators (e.g. the output of `git ls-files` or `find . -type f`). End a path with "/" for an empty directory.' },
      only: { type: 'string', enum: ['all', 'sent', 'excluded'], description: 'Return all paths (default), only the ones sent, or only the excluded ones.' }
    }, required: ['dockerignore', 'paths'] },
    outputSchema: { type: 'object', properties: {
      results: { type: 'array', items: { type: 'object', properties: { path: { type: 'string' }, sent: { type: 'boolean' }, rule: RULE, excluded_dir: { type: 'string' }, note: { type: 'string' } }, required: ['path', 'sent', 'rule', 'note'] } },
      context: { type: 'array', items: { type: 'string' }, description: 'Everything Docker sends (files, and directories ending with "/"), sorted.' },
      warnings: { type: 'array', items: { type: 'string' } },
      summary: { type: 'object', properties: { checked: { type: 'integer' }, sent: { type: 'integer' }, excluded: { type: 'integer' } } }
    }, required: ['results', 'context', 'summary'] },
    annotations: { readOnlyHint: true, openWorldHint: false, idempotentHint: true }
  },
  {
    name: 'explain_dockerignore',
    title: 'Explain a .dockerignore, line by line',
    description: 'Explains every rule of a .dockerignore in plain English, as Docker reads it (after its own clean-up: leading "/" removed, trailing "/" dropped, "./" and ".." resolved), and flags the classic mistakes: root-only patterns meant for any depth (*.log, node_modules), "#" not at column 1, "!" rules with nothing to re-include, invalid patterns that make the build fail.',
    inputSchema: { type: 'object', properties: { dockerignore: DI }, required: ['dockerignore'] },
    outputSchema: { type: 'object', properties: {
      rules: { type: 'array', items: { type: 'object', properties: { line: { type: 'integer' }, pattern: { type: 'string' }, meaning: { type: 'string' }, warnings: { type: 'array', items: { type: 'string' } } } } },
      warnings_count: { type: 'integer' }
    }, required: ['rules', 'warnings_count'] },
    annotations: { readOnlyHint: true, openWorldHint: false, idempotentHint: true }
  }
];

function callTool(name, args) {
  args = args || {};
  if (typeof args.dockerignore !== 'string') throw new Error('"dockerignore" must be the content of the .dockerignore file (a string, can be empty)');
  if (name === 'check_dockerignore') {
    if (!Array.isArray(args.paths) || !args.paths.length) throw new Error('"paths" must be a non-empty list of paths');
    if (args.paths.length > 5000) throw new Error('at most 5000 paths per call');
    const c = E.context(E.build(args.dockerignore), args.paths.map(String));
    const sent = c.results.filter(r => r.sent).length;
    const only = args.only || 'all';
    const results = only === 'sent' ? c.results.filter(r => r.sent) : only === 'excluded' ? c.results.filter(r => !r.sent) : c.results;
    const warnings = [];
    const secret = c.results.filter(r => r.sent && /(^|\/)(\.env(\..+)?|\.git\/.*|id_rsa|id_ed25519|\.npmrc|\.pypirc|.+\.pem|.+\.key|credentials(\.json)?|\.aws\/.*|\.ssh\/.*)$/.test(r.path.replace(/\/$/, '/x')));
    if (secret.length) warnings.push('Possible secrets sent to the build context (anyone with the image may read them if COPY . is used): ' + secret.slice(0, 10).map(r => r.path).join(', ') + (secret.length > 10 ? ' ...' : '') + '. Exclude them, e.g. "**/.env" and ".git".');
    return { results, context: c.sent, warnings, summary: { checked: c.results.length, sent, excluded: c.results.length - sent } };
  }
  if (name === 'explain_dockerignore') {
    const rules = E.explain(args.dockerignore);
    return { rules, warnings_count: rules.reduce((n, r) => n + r.warnings.length, 0) };
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
          instructions: 'Do not assume .dockerignore works like .gitignore: it does not ("*.log" is root-only, "node_modules" is root-only, trailing "/" ignored). Call check_dockerignore to know exactly which files Docker sends and why, and explain_dockerignore to review or debug a .dockerignore.' } });
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
