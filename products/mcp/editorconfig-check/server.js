#!/usr/bin/env node
'use strict';
// MCP server (stdio, no dependency): which EditorConfig settings apply to a file (indent, line endings, charset,
// final newline, trailing whitespace...), and which .editorconfig section and line decide. Same answer as the reference
// JavaScript core (npm "editorconfig", used by Prettier and many editors), checked on ~225,000 random cases.
const E = require('./engine.js');
const SERVER = { name: 'editorconfig-check', title: 'EditorConfig checker (exact rules)', version: '1.0.0' };

const SOURCES = {
  editorconfig: { type: 'string', description: 'Content of the root .editorconfig file.' },
  files: { type: 'object', additionalProperties: { type: 'string' }, description: 'Several .editorconfig files at once, as { "<path>": "<content>" }, e.g. { ".editorconfig": "...", "src/legacy/.editorconfig": "..." }. Paths are relative to the project root.' }
};
const WHERE = { type: 'object', properties: { source: { type: 'string' }, section: { type: 'string' }, line: { type: 'integer' }, text: { type: 'string' } } };
const TOOLS = [
  {
    name: 'check_editorconfig',
    title: 'Which EditorConfig settings apply to this file?',
    description: 'Tells, exactly as editors and Prettier read it (reference EditorConfig core), which settings apply to each file: indent_style, indent_size, tab_width, end_of_line, charset, insert_final_newline, trim_trailing_whitespace, max_line_length and any custom key, with the file, [section] and line that decides each one, every section that matched, and the values derived automatically (tab_width from indent_size, indent_size = tab). Handles globs exactly (*, **, ?, [a-z], [!x], {a,b}, {1..10}, escapes), nested .editorconfig files, root = true, unset, and the parser trap where one bad line hides the rest of the file. No project needed: pass the .editorconfig content and the paths.',
    inputSchema: { type: 'object', properties: Object.assign({}, SOURCES, {
      paths: { type: 'array', items: { type: 'string' }, maxItems: 5000, description: 'File paths relative to the project root, with "/" separators.' }
    }), required: ['paths'] },
    outputSchema: { type: 'object', properties: {
      results: { type: 'array', items: { type: 'object', properties: {
        path: { type: 'string' },
        properties: { type: 'object', description: 'Final settings, as the editor applies them.' },
        decided_by: { type: 'object', additionalProperties: WHERE },
        derived: { type: 'object', additionalProperties: { type: 'string' } },
        matching_sections: { type: 'array', items: WHERE },
        files_read: { type: 'array', items: { type: 'string' } },
        stopped_at_root: { type: ['string', 'null'] } }, required: ['path', 'properties'] } },
      problems_count: { type: 'integer' }
    }, required: ['results'] },
    annotations: { readOnlyHint: true, openWorldHint: false, idempotentHint: true }
  },
  {
    name: 'lint_editorconfig',
    title: 'Find the mistakes in an .editorconfig',
    description: 'Checks one or more .editorconfig files and flags what silently breaks them: a line the parser does not understand (editors then ignore every line below it), comments at the end of a value ("indent_size = 4 # four" is invalid), invalid values (indent_style, end_of_line, charset, booleans, sizes), misspelled property names ("indent_sise"), "root" in the wrong place or missing, keys before any [section], braces with one choice ({js} is literal), ".." in globs, spaces inside brackets, duplicate keys.',
    inputSchema: { type: 'object', properties: SOURCES },
    outputSchema: { type: 'object', properties: {
      problems: { type: 'array', items: { type: 'object', properties: { source: { type: 'string' }, line: { type: 'integer' }, severity: { type: 'string' }, message: { type: 'string' } } } },
      sections: { type: 'array', items: { type: 'object' } }
    }, required: ['problems'] },
    annotations: { readOnlyHint: true, openWorldHint: false, idempotentHint: true }
  }
];

function sources(args) {
  const files = Object.assign({}, args.files || {});
  if (typeof args.editorconfig === 'string') files['.editorconfig'] = args.editorconfig;
  if (!Object.keys(files).length) throw new Error('give the .editorconfig content in "editorconfig", or several files in "files"');
  return E.compile(files);
}
function callTool(name, args) {
  args = args || {};
  if (name === 'check_editorconfig') {
    if (!Array.isArray(args.paths) || !args.paths.length) throw new Error('"paths" must be a non-empty list of file paths');
    if (args.paths.length > 5000) throw new Error('at most 5000 paths per call');
    const c = sources(args);
    const results = args.paths.map(p => {
      const r = E.check(c, p);
      const res = { path: r.path, properties: r.properties, decided_by: r.decided_by, matching_sections: r.sections, files_read: r.files_read, stopped_at_root: r.stopped_at_root };
      if (Object.keys(r.derived).length) res.derived = r.derived;
      if (!r.sections.length) res.note = 'No section matches this file: the editor keeps its own defaults.';
      return res;
    });
    const problems = E.lint(c).filter(p => p.severity === 'error');
    const out = { results, problems_count: problems.length };
    if (problems.length) out.problems = problems;
    return out;
  }
  if (name === 'lint_editorconfig') {
    const c = sources(args);
    const sections = [];
    Object.keys(c).sort().forEach(d => c[d].sections.forEach(s => sections.push({ source: c[d].source, section: '[' + s.name + ']', line: s.line, properties: s.props.length })));
    return { problems: E.lint(c), sections };
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
          instructions: 'Do not guess .editorconfig semantics: sections are matched in order and later ones win, a glob without "/" matches at any depth, {js} with one choice is literal, end-of-line comments are part of the value, one bad line makes editors ignore the rest of the file, and root = true stops the search. Call check_editorconfig to know exactly which settings (indentation, line endings, charset, final newline, trailing spaces) apply to a file, and lint_editorconfig to review or debug a .editorconfig file.' } });
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
