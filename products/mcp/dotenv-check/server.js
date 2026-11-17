#!/usr/bin/env node
'use strict';
// MCP server (stdio, no dependency): what value each .env variable really gets, and which file and line decide, for the
// four loaders developers use: npm dotenv (+ dotenv-expand), node --env-file, Vite and Next.js. Same code as the real
// loaders (vendored unchanged, or ported line by line), checked against them on thousands of random files.
const E = require('./engine.js');
const SERVER = { name: 'dotenv-check', title: '.env checker (dotenv, Node, Vite, Next.js)', version: '1.0.0' };

const FILES = { type: 'object', additionalProperties: { type: 'string' }, description: 'The .env files, as { "<file name>": "<content>" }, e.g. { ".env": "PORT=3000", ".env.local": "PORT=4000" }. For vite and nextjs, use the real file names (.env, .env.local, .env.development, .env.production.local...): the loader picks the ones it reads.' };
const TOOLS = [
  {
    name: 'resolve_env',
    title: 'What value does each .env variable really get?',
    description: 'Answers "why is my env variable empty / wrong / undefined?" exactly as the real loader does it. Give the .env files and the loader: "dotenv" (npm dotenv 17, optional dotenv-expand 12 and override), "node" (node --env-file / process.loadEnvFile), "vite" (Vite loadEnv: .env, .env.local, .env.[mode], .env.[mode].local, VITE_ prefix) or "nextjs" (@next/env: .env.[mode].local, .env.local, .env.[mode], .env; NEXT_PUBLIC_). Returns for each variable: the final value, the file:line that decides it, the definitions that lose and why (first file wins vs last file wins, variables already set in the environment win), the raw text before $VAR expansion, whether it reaches browser code, plus the traps found: unquoted "#" cutting a value, an unclosed quote swallowing the next lines, "KEY= " eating the next line under Node and Vite, $VAR left literal or expanded inside single quotes, references to undefined variables, self-references that crash the loader, secrets exposed by VITE_ or NEXT_PUBLIC_, files the loader never reads in this mode. Offline: nothing is sent anywhere.',
    inputSchema: { type: 'object', properties: {
      loader: { type: 'string', enum: ['dotenv', 'node', 'vite', 'nextjs'], description: 'Who loads the files. dotenv = require("dotenv").config(...); node = node --env-file=...; vite = Vite dev/build; nextjs = next dev/build/start.' },
      files: FILES,
      mode: { type: 'string', description: 'vite: the mode (default "development"; "vite build" uses "production"). nextjs: development (next dev, default), production (next build / next start) or test (NODE_ENV=test).' },
      order: { type: 'array', items: { type: 'string' }, description: 'dotenv and node only: the files in the order given to config({ path: [...] }) or to the --env-file flags. Default: ".env" alone for dotenv, all files in the given order for node.' },
      expand: { type: 'boolean', description: 'dotenv only: also run dotenv-expand (expands $VAR and ${VAR:-default}). Default false.' },
      override: { type: 'boolean', description: 'dotenv only: config({ override: true }). Default false.' },
      process_env: { type: 'object', additionalProperties: { type: 'string' }, description: 'Variables already set in the shell or CI before the loader runs (they usually win over the files). Only names that matter; never needed for a simple check.' },
      env_prefix: { type: ['string', 'array'], items: { type: 'string' }, description: 'vite only: envPrefix from vite.config (default "VITE_").' },
      keys: { type: 'array', items: { type: 'string' }, description: 'Only report these variables (default: all).' }
    }, required: ['loader', 'files'] },
    outputSchema: { type: 'object', properties: {
      loader: { type: 'string' }, mode: { type: 'string' },
      files_read_in_order: { type: 'array', items: { type: 'string' } },
      variables: { type: 'object', additionalProperties: { type: 'object', properties: {
        value: { type: ['string', 'null'] }, source: { type: 'string' }, defined_in: { type: 'array', items: { type: 'string' } },
        ignored_definitions: { type: 'array', items: { type: 'object' } }, written_as: { type: 'string' }, exposed_to_browser: { type: 'boolean' }, note: { type: 'string' } } } },
      problems: { type: 'array', items: { type: 'object', properties: { file: { type: 'string' }, line: { type: 'integer' }, severity: { type: 'string' }, message: { type: 'string' } } } },
      notes: { type: 'array', items: { type: 'string' } }
    }, required: ['variables', 'problems'] },
    annotations: { readOnlyHint: true, openWorldHint: false, idempotentHint: true }
  },
  {
    name: 'parse_env_file',
    title: 'Parse one .env file exactly, line by line',
    description: 'Parses one .env file with the real parser of "dotenv" (npm dotenv 16-17; also Next.js, dotenv-cli, Prisma, many CLIs) or "node" (node --env-file, process.loadEnvFile, util.parseEnv; also Vite 8) and returns each value with its line, plus every line that is silently ignored, values cut at "#", unclosed quotes, multi-line values, duplicate keys and other traps. Use it to review or debug a .env / .env.example file.',
    inputSchema: { type: 'object', properties: {
      content: { type: 'string', description: 'Content of the .env file.' },
      parser: { type: 'string', enum: ['dotenv', 'node'], description: 'Default "dotenv".' }
    }, required: ['content'] },
    annotations: { readOnlyHint: true, openWorldHint: false, idempotentHint: true }
  },
  {
    name: 'compare_env_parsers',
    title: 'Does this .env read the same with dotenv and with Node / Vite 8?',
    description: 'Parses the same .env content with npm dotenv and with Node\'s built-in parser (node --env-file, used by Vite 8) and lists every variable whose value differs. Run it before switching from dotenv to node --env-file, or when upgrading Vite: the two parsers disagree on keys with spaces, "KEY= " followed by a new line, backslash escapes, unclosed quotes, inline comments and more.',
    inputSchema: { type: 'object', properties: { content: { type: 'string', description: 'Content of the .env file.' } }, required: ['content'] },
    annotations: { readOnlyHint: true, openWorldHint: false, idempotentHint: true }
  }
];

function callTool(name, args) {
  args = args || {};
  if (name === 'resolve_env') return E.resolve(args);
  if (name === 'parse_env_file') {
    if (typeof args.content !== 'string') throw new Error('"content" must be the text of the .env file');
    return E.parseOnly(args.content, args.parser || 'dotenv');
  }
  if (name === 'compare_env_parsers') {
    if (typeof args.content !== 'string') throw new Error('"content" must be the text of the .env file');
    const r = E.compareParsers(args.content);
    return { same: r.same, differences: r.differences, note: r.same ? 'Both parsers give exactly the same values.' : r.differences.length + ' variable(s) read differently: dotenv = npm dotenv / Next.js; node = node --env-file / process.loadEnvFile / Vite 8. null = not defined by that parser.' };
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
          instructions: 'Do not guess how .env files are read: dotenv, node --env-file, Vite and Next.js use different parsers and different precedence (first file wins in dotenv and Next.js, last file wins in Node and Vite, the shell environment wins over files), an unquoted # starts a comment even inside a password, "KEY= " with a trailing space takes the next line as its value under Node and Vite, and $VAR is expanded only by some loaders, even inside single quotes. Call resolve_env when a variable is empty, wrong or undefined, parse_env_file to review a .env file, and compare_env_parsers before switching parser.' } });
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
