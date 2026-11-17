#!/usr/bin/env node
'use strict';
// MCP server (stdio, no dependency): will this GitHub Actions workflow run for this push or pull request, and which line
// of the workflow decides? Branch, tag and path filters (glob syntax ported from nektos/act, checked against its Go code
// on 300,000 random cases), activity types, [skip ci], tag-only / branch-only filters, more than 3 tags, merge conflicts.
const fs = require('fs'), path = require('path');
const E = require('./engine.js');
const SERVER = { name: 'gha-trigger-check', title: 'GitHub Actions trigger checker', version: '1.0.0' };

const EVENT_ARGS = {
  event: { type: 'string', description: 'push (default), pull_request or pull_request_target. Other events are only checked for presence under on:.' },
  branch: { type: 'string', description: 'push: the pushed branch (e.g. "main", "feature/login"; "refs/heads/..." accepted). pull_request / pull_request_target: the BASE branch the PR targets (branch filters compare with the base, not the PR branch).' },
  tag: { type: 'string', description: 'push only: the pushed tag (e.g. "v1.2.0"). Give a branch or a tag, not both.' },
  ref: { type: 'string', description: 'Alternative to branch/tag: a full ref, "refs/heads/main" or "refs/tags/v1.0".' },
  changed_files: { type: 'array', items: { type: 'string' }, description: 'Files changed, relative to the repo root ("src/app.ts"). push: files changed by the pushed commits (e.g. `git diff --name-only <before>..<after>`); pull request: `git diff --name-only origin/<base>...HEAD`. Needed only when the workflow has paths or paths-ignore.' },
  action: { type: 'string', description: 'pull_request(_target) activity type: opened (default), synchronize (new commits pushed), reopened, labeled, closed, ready_for_review, edited...' },
  commit_message: { type: 'string', description: 'Head commit message, to detect [skip ci], [ci skip], [no ci], [skip actions], [actions skip] and the "skip-checks: true" trailer.' },
  tags_pushed_count: { type: 'integer', description: 'push of tags: how many tags were pushed at once (GitHub creates no event above 3).' },
  has_merge_conflict: { type: 'boolean', description: 'pull_request: true if the PR currently has a merge conflict (pull_request workflows then do not run).' }
};
const TOOLS = [
  {
    name: 'will_workflow_run',
    title: 'Will this GitHub Actions workflow run, and which line decides?',
    description: 'Answers "why didn\'t my GitHub Actions workflow run?" or "will this push / PR trigger it?" exactly as GitHub filters events. Give the workflow YAML (or its path) and the push or pull request: branch or tag, changed files, activity type, commit message. Returns runs = true / false (null if a needed input is missing), the step-by-step reasoning, and the workflow line and pattern that decide. Covers: branches / branches-ignore / tags / tags-ignore / paths / paths-ignore with the exact glob rules ("*" stops at "/", "**", "?" and "+" repeat the previous character, [a-z], "!" exceptions where the last matching pattern wins), branch filters of pull_request compared with the BASE branch, tag pushes ignored when only branch filters exist (and the reverse), paths not evaluated for tags, paths-ignore needing ALL files ignored, default pull_request types (opened, synchronize, reopened), [skip ci] markers, more than 3 tags pushed at once, merge conflicts, more than 300 changed files, and invalid filters that make GitHub reject the whole file (branches with branches-ignore, bad patterns). Offline, read-only.',
    inputSchema: { type: 'object', properties: Object.assign({
      workflow: { type: 'string', description: 'Content of the workflow file (.github/workflows/*.yml).' },
      workflow_path: { type: 'string', description: 'Or a path to the workflow file, if the server can read the project.' }
    }, EVENT_ARGS) },
    annotations: { readOnlyHint: true, openWorldHint: false, idempotentHint: true }
  },
  {
    name: 'which_workflows_run',
    title: 'Which workflows run for this push or pull request?',
    description: 'Checks every workflow of a repository at once for one push or pull request and lists which ones run, which do not, and why (the deciding line of each). Give the workflows as { "<file name>": "<YAML>" }, or let the server read .github/workflows/ in "dir" (default: current directory). Same rules and inputs as will_workflow_run. Use it to predict the CI of a PR, or to find why a check never appears.',
    inputSchema: { type: 'object', properties: Object.assign({
      workflows: { type: 'object', additionalProperties: { type: 'string' }, description: 'The workflow files, as { ".github/workflows/ci.yml": "<content>" }.' },
      dir: { type: 'string', description: 'Repository root to read .github/workflows/ from, when "workflows" is not given. Default: current directory.' }
    }, EVENT_ARGS) },
    annotations: { readOnlyHint: true, openWorldHint: false, idempotentHint: true }
  },
  {
    name: 'test_filter_patterns',
    title: 'Test GitHub Actions branch / tag / path patterns',
    description: 'Tests a list of GitHub Actions filter patterns (as written under branches, tags or paths, "!" exceptions included) against branch names, tags or file paths, and says for each one whether it is selected and which pattern decides (the last matching one). Also returns the exact regular expression of each pattern and the error GitHub gives for an invalid one ("[]", ranges outside a-z/A-Z/0-9, trailing "\\", "?" or "+" after "**"). Use it to write or fix a filter before pushing.',
    inputSchema: { type: 'object', properties: {
      patterns: { type: 'array', items: { type: 'string' }, description: 'Patterns in order, e.g. ["src/**", "!src/**/*.md"].' },
      names: { type: 'array', items: { type: 'string' }, description: 'Branch names, tags or file paths to test.' },
      list: { type: 'string', enum: ['branches', 'tags', 'paths', 'branches-ignore', 'tags-ignore', 'paths-ignore'], description: 'Which filter the patterns belong to (default "paths"). With -ignore lists, a name matched by the list is ignored.' }
    }, required: ['patterns', 'names'] },
    annotations: { readOnlyHint: true, openWorldHint: false, idempotentHint: true }
  }
];

function shortResult(r) {
  const o = { runs: r.runs, why: r.steps[r.steps.length - 1] };
  if (r.decided_by) o.decided_by = r.decided_by;
  if (r.warnings && r.warnings.length) o.warnings = r.warnings;
  if (r.missing) o.missing = r.missing;
  if (r.error) o.error = r.error;
  return o;
}

function callTool(name, args) {
  args = args || {};
  if (name === 'will_workflow_run') {
    let text = args.workflow;
    if (typeof text !== 'string') {
      if (!args.workflow_path) throw new Error('give "workflow" (the YAML text) or "workflow_path"');
      text = fs.readFileSync(path.resolve(String(args.workflow_path)), 'utf8');
    }
    const r = E.evaluate(text, args);
    if (r.runs === null) r.note = 'Give the missing input(s) to get a yes / no answer.';
    return r;
  }
  if (name === 'which_workflows_run') {
    let wfs = args.workflows;
    if (!wfs || typeof wfs !== 'object') {
      const d = path.join(path.resolve(String(args.dir || '.')), '.github', 'workflows');
      if (!fs.existsSync(d)) throw new Error('no "workflows" given and no ' + d + ' folder found');
      wfs = {};
      for (const f of fs.readdirSync(d).sort()) if (/\.ya?ml$/.test(f)) wfs['.github/workflows/' + f] = fs.readFileSync(path.join(d, f), 'utf8');
    }
    const out = { event: args.event || 'push', run: [], do_not_run: [], undecided: [], details: {} };
    for (const [f, text] of Object.entries(wfs)) {
      const r = E.evaluate(String(text), args);
      const s = shortResult(r); if (r.workflow_name) s.name = r.workflow_name;
      out.details[f] = s;
      (r.runs === true ? out.run : r.runs === false ? out.do_not_run : out.undecided).push(f);
    }
    out.summary = out.run.length + ' workflow(s) run, ' + out.do_not_run.length + ' do not' + (out.undecided.length ? ', ' + out.undecided.length + ' need more input (see "missing")' : '') + '.';
    return out;
  }
  if (name === 'test_filter_patterns') {
    if (!Array.isArray(args.patterns) || !Array.isArray(args.names)) throw new Error('"patterns" and "names" must be lists of strings');
    const list = args.list || 'paths';
    const kind = list.endsWith('-ignore') ? 'ignore' : 'include';
    const pats = args.patterns.map(String);
    const r = E.evalList(pats, args.names.map(String), kind);
    const compiled = pats.map(E.compile).map(c => c.error ? { pattern: c.raw, error: c.error } : { pattern: c.raw, exception: c.negative, regex: c.source });
    const out = { list, patterns: compiled, results: r.per };
    if (r.errors.length) out.invalid = 'GitHub rejects the workflow file: ' + r.errors.join('; ');
    else if (kind === 'include') out.verdict = r.pass ? 'At least one name is selected: the filter lets the workflow run.' : 'No name is selected: the filter blocks the workflow.';
    else out.verdict = r.pass ? 'At least one name is not ignored: the filter lets the workflow run.' : 'Every name is ignored: the filter blocks the workflow.';
    if (kind === 'include' && pats.length && pats.every(p => p.startsWith('!'))) out.warning = 'Only "!" patterns: nothing can be selected. Put a positive pattern first.';
    return out;
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
          instructions: 'Do not guess whether a GitHub Actions workflow runs: "*" does not cross "/", the last matching "!" pattern wins, pull_request branch filters use the BASE branch, a push with only branch filters ignores tags (and the reverse), paths are not checked for tags, paths-ignore needs every file ignored, default pull_request types exclude labeled and closed, [skip ci] skips push and pull_request, and branches + branches-ignore together make the file invalid. Call will_workflow_run (one workflow) or which_workflows_run (all of them) with the branch or tag and changed files, and test_filter_patterns to write a filter.' } });
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
