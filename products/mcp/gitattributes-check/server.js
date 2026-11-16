#!/usr/bin/env node
'use strict';
// MCP server (stdio, no dependency): which git attributes apply to a path (line endings, binary, LFS, diff/merge drivers,
// export-ignore, GitHub Linguist), and which .gitattributes line decides. Exact port of git's attr.c + wildmatch.c,
// checked against `git check-attr -a` on ~77,000 random cases.
const E = require('./engine.js');
const SERVER = { name: 'gitattributes-check', title: 'Gitattributes checker (exact git rules)', version: '1.0.0' };

const SOURCES = {
  gitattributes: { type: 'string', description: 'Content of the root .gitattributes file.' },
  files: { type: 'object', additionalProperties: { type: 'string' }, description: 'Several attribute files at once, as { "<path>": "<content>" }, e.g. { ".gitattributes": "...", "docs/.gitattributes": "...", ".git/info/attributes": "..." }. Paths are relative to the repository root.' }
};
const RULE = { type: 'object', properties: { source: { type: 'string' }, line: { type: 'integer' }, text: { type: 'string' } } };
const TOOLS = [
  {
    name: 'check_attributes',
    title: 'Which git attributes apply to this path?',
    description: 'Tells, exactly as `git check-attr -a` would, which attributes apply to each path (text, eol, binary, diff, merge, filter=lfs, export-ignore, linguist-*, any custom attribute), with the file and line that decides each one, and what that means in practice: line-ending conversion, binary diffs, Git LFS storage, files left out of release archives, GitHub language stats and collapsed generated files. Handles macros ([attr], built-in "binary"), set / -unset / !unspecified / value, nested .gitattributes files, .git/info/attributes, quoted patterns, and the trap that "dir/" never applies to the files inside. No repository needed: pass the .gitattributes content and the paths.',
    inputSchema: { type: 'object', properties: Object.assign({}, SOURCES, {
      paths: { type: 'array', items: { type: 'string' }, maxItems: 5000, description: 'Paths relative to the repository root, with "/" separators. End a path with "/" if it is a directory.' },
      attributes: { type: 'array', items: { type: 'string' }, description: 'Only report these attributes (like `git check-attr text eol -- path`), including "unspecified" ones. Default: every attribute that is set, unset or has a value (like `git check-attr -a`).' }
    }), required: ['paths'] },
    outputSchema: { type: 'object', properties: {
      results: { type: 'array', items: { type: 'object', properties: {
        path: { type: 'string' },
        attributes: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, state: { type: 'string', description: 'set, unset, unspecified, or the value' }, rule: RULE, via_macro: { type: 'string' }, macro_defined_at: RULE } } },
        effects: { type: 'array', items: { type: 'string' } }, notes: { type: 'array', items: { type: 'string' } } }, required: ['path', 'attributes', 'effects'] } },
      ignored_lines: { type: 'array', items: { type: 'object' } }
    }, required: ['results'] },
    annotations: { readOnlyHint: true, openWorldHint: false, idempotentHint: true }
  },
  {
    name: 'explain_gitattributes',
    title: 'Explain a .gitattributes, line by line',
    description: 'Explains every line of one or more .gitattributes files in plain English and flags the classic mistakes: "dir/" patterns that never reach the files inside, negative "!" patterns (ignored by git), macros outside the root file, invalid attribute names that make git drop the whole line, unquoted patterns with spaces, Git LFS rules without -text, bad eol / text values, the old crlf attribute.',
    inputSchema: { type: 'object', properties: SOURCES },
    outputSchema: { type: 'object', properties: {
      lines: { type: 'array', items: { type: 'object', properties: { source: { type: 'string' }, line: { type: 'integer' }, text: { type: 'string' }, meaning: { type: 'string' }, warnings: { type: 'array', items: { type: 'string' } } } } },
      warnings_count: { type: 'integer' }
    }, required: ['lines', 'warnings_count'] },
    annotations: { readOnlyHint: true, openWorldHint: false, idempotentHint: true }
  }
];

function sources(args) {
  const files = Object.assign({}, args.files || {});
  if (typeof args.gitattributes === 'string') files['.gitattributes'] = args.gitattributes;
  if (!Object.keys(files).length) throw new Error('give the .gitattributes content in "gitattributes", or several files in "files"');
  return E.compile(files);
}
function callTool(name, args) {
  args = args || {};
  if (name === 'check_attributes') {
    if (!Array.isArray(args.paths) || !args.paths.length) throw new Error('"paths" must be a non-empty list of paths');
    if (args.paths.length > 5000) throw new Error('at most 5000 paths per call');
    const c = sources(args);
    const only = Array.isArray(args.attributes) && args.attributes.length ? args.attributes.map(String) : null;
    const results = args.paths.map(p => {
      const r = E.check(c, p);
      const names = only || Object.keys(r.attrs).filter(n => r.attrs[n].state !== null);
      const attributes = names.map(n => {
        const a = r.attrs[n];
        if (!a) return { name: n, state: 'unspecified', rule: null };
        return Object.assign({ name: n, state: E.stateWord(a.state) }, a, { state: E.stateWord(a.state) });
      });
      const res = { path: r.path, attributes, effects: E.effects(r.attrs) };
      if (r.notes.length) res.notes = r.notes;
      return res;
    });
    const out = { results };
    if (c.problems.length) out.ignored_lines = c.problems;
    return out;
  }
  if (name === 'explain_gitattributes') {
    const lines = E.explain(sources(args));
    return { lines, warnings_count: lines.reduce((n, r) => n + r.warnings.length, 0) };
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
          instructions: 'Do not guess .gitattributes semantics: last matching line wins per attribute, "dir/" does not apply to files inside, macros expand only when set, and nested files override the root. Call check_attributes to know exactly which attributes (line endings, binary, LFS, export-ignore, linguist) apply to a path, and explain_gitattributes to review or debug a .gitattributes file.' } });
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
