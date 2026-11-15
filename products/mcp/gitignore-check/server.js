#!/usr/bin/env node
'use strict';
// MCP server (stdio, no dependency): is this path ignored by git, and by which .gitignore line?
// Exact port of git's own rules (wildmatch.c + dir.c), checked against `git check-ignore` on ~80,000 random cases.
const E = require('./engine.js');
const SERVER = { name: 'gitignore-check', title: 'Gitignore checker (exact git rules)', version: '1.0.0' };

const SOURCES = {
  gitignore: { type: 'string', description: 'Content of the root .gitignore file.' },
  files: { type: 'object', additionalProperties: { type: 'string' }, description: 'Several .gitignore files at once, as { "<path>": "<content>" }, e.g. { ".gitignore": "...", "src/.gitignore": "..." }. Paths are relative to the repository root.' }
};
const RULE = { type: ['object', 'null'], properties: { source: { type: 'string' }, line: { type: 'integer' }, pattern: { type: 'string' } } };
const TOOLS = [
  {
    name: 'check_ignored',
    title: 'Is this path ignored by git?',
    description: 'Tells, exactly as git would (`git check-ignore -v`), whether each path is ignored by the given .gitignore rules, and which file and line decides. Handles negation (!), anchoring (/), directory-only rules (dir/), **, character classes, escapes, trailing spaces, nested .gitignore files, and the rule that nothing inside an ignored directory can be re-included. Use it before adding, moving or committing files, or when a .gitignore "does not work". No repository or file access needed: pass the .gitignore content and the paths.',
    inputSchema: { type: 'object', properties: Object.assign({}, SOURCES, {
      paths: { type: 'array', items: { type: 'string' }, maxItems: 5000, description: 'Paths relative to the repository root, with "/" separators. End a path with "/" if it is a directory (directory-only rules like "build/" only match directories).' },
      only: { type: 'string', enum: ['all', 'ignored', 'not_ignored'], description: 'Return all paths (default), or only the ignored ones, or only the ones git would keep.' }
    }), required: ['paths'] },
    outputSchema: { type: 'object', properties: {
      results: { type: 'array', items: { type: 'object', properties: { path: { type: 'string' }, ignored: { type: 'boolean' }, rule: RULE, excluded_parent: { type: 'string' }, note: { type: 'string' } }, required: ['path', 'ignored', 'rule', 'note'] } },
      summary: { type: 'object', properties: { checked: { type: 'integer' }, ignored: { type: 'integer' }, not_ignored: { type: 'integer' } } }
    }, required: ['results', 'summary'] },
    annotations: { readOnlyHint: true, openWorldHint: false, idempotentHint: true }
  },
  {
    name: 'explain_gitignore',
    title: 'Explain a .gitignore, line by line',
    description: 'Explains every rule of one or more .gitignore files in plain English (what it matches, anchored or not, directories only, re-include) and flags the classic mistakes: a "!" rule that cannot work because its parent directory is already ignored, trailing spaces, "#" not at the start of the line, "**" glued to other characters, unclosed "[", trailing backslash.',
    inputSchema: { type: 'object', properties: SOURCES },
    outputSchema: { type: 'object', properties: {
      rules: { type: 'array', items: { type: 'object', properties: { source: { type: 'string' }, line: { type: 'integer' }, pattern: { type: 'string' }, meaning: { type: 'string' }, warnings: { type: 'array', items: { type: 'string' } } } } },
      warnings_count: { type: 'integer' }
    }, required: ['rules', 'warnings_count'] },
    annotations: { readOnlyHint: true, openWorldHint: false, idempotentHint: true }
  }
];

function sources(args) {
  const files = Object.assign({}, args.files || {});
  if (typeof args.gitignore === 'string') files['.gitignore'] = args.gitignore;
  if (!Object.keys(files).length) throw new Error('give the .gitignore content in "gitignore", or several files in "files"');
  return E.compile(files);
}
function callTool(name, args) {
  args = args || {};
  if (name === 'check_ignored') {
    if (!Array.isArray(args.paths) || !args.paths.length) throw new Error('"paths" must be a non-empty list of paths');
    if (args.paths.length > 5000) throw new Error('at most 5000 paths per call');
    const byDir = sources(args);
    const all = args.paths.map(p => E.check(byDir, p));
    const ign = all.filter(r => r.ignored).length;
    const only = args.only || 'all';
    const results = only === 'ignored' ? all.filter(r => r.ignored) : only === 'not_ignored' ? all.filter(r => !r.ignored) : all;
    return { results, summary: { checked: all.length, ignored: ign, not_ignored: all.length - ign } };
  }
  if (name === 'explain_gitignore') {
    const rules = E.explain(sources(args));
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
          instructions: 'Do not guess .gitignore semantics: negation, anchoring, "dir/" vs "dir/*" and "**" are easy to get wrong. Call check_ignored to know exactly which paths git ignores and why, and explain_gitignore to review or debug a .gitignore.' } });
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
