'use strict';
// Does this GitHub Actions workflow run for this push / pull request, and which line of the workflow decides?
// Pattern syntax: a line-by-line port of nektos/act pkg/workflowpattern (PatternToRegex), itself written from GitHub's
// documented filter syntax and its cheat sheet; checked against act's Go code on random patterns (see test.js).
// Event rules (branch vs tag filters, paths, types, [skip ci], 3 tags, merge conflicts): GitHub's workflow syntax docs.
const YAML = require('./vendor/yaml.js');

const QUOTE = /[\\.+*?()|[\]{}^$]/;
function quote(c) { return QUOTE.test(c) ? '\\' + c : c; }
const isIn = (a, b, t) => t >= a && t <= b;

// Returns { source, errors[] }. Same output as act's PatternToRegex, written for JS ('.' -> [^\n], as Go's '.').
function patternToRegex(pattern) {
  const p = Array.from(pattern);
  let out = '^', pos = 0;
  const errors = [];
  while (pos < p.length) {
    const c = p[pos];
    if (c === '*') {
      if (p[pos + 1] === '*') {
        if (p[pos + 2] === '/') { out += '([^\\n]+/)?'; pos += 3; } else { out += '[^\\n]*'; pos += 2; }
      } else { out += '[^/]*'; pos++; }
    } else if (c === '+' || c === '?') {
      out += pos > 0 ? c : quote(c); pos++;
    } else if (c === '[') {
      out += '['; pos++;
      if (p[pos] === ']') { errors.push([pos, "Unexpected empty brackets '[]'"]); pos++; continue; }
      const start = pos;
      while (pos < p.length && p[pos] !== ']') {
        const ch = p[pos];
        if (ch === '-') {
          if (pos <= start || pos + 1 >= p.length) { errors.push([pos, 'Invalid range']); pos++; continue; }
          const a = p[pos - 1], b = p[pos + 1];
          const vr = (x, y) => isIn(x, y, a) && isIn(x, y, b) && a <= b;
          if (a.length > 1 || b.length > 1 || (!vr('A', 'z') && !vr('0', '9'))) { errors.push([pos, 'Ranges can only include a-z, A-Z, A-z, and 0-9']); pos++; continue; }
          out += '-' + b; pos += 2;
        } else {
          if (ch.length > 1 || (!isIn('A', 'z', ch) && !isIn('0', '9', ch))) { errors.push([pos, 'Ranges can only include a-z, A-Z and 0-9']); pos++; continue; }
          out += quote(ch); pos++;
        }
      }
      if (pos >= p.length || p[pos] !== ']') { errors.push([pos, "Missing closing bracket ']' after '['"]); pos++; }
      out += ']'; pos++;
    } else if (c === '\\') {
      if (pos + 1 >= p.length) { errors.push([pos, 'Missing symbol after \\']); pos++; continue; }
      out += quote(p[pos + 1]); pos += 2;
    } else { out += quote(c); pos++; }
  }
  return { source: out + '$', errors };
}

function compile(raw) {
  raw = String(raw);
  const negative = raw.startsWith('!');
  const pattern = negative ? raw.slice(1) : raw;
  const r = patternToRegex(pattern);
  if (r.errors.length) return { raw, pattern, negative, error: "invalid pattern '" + pattern + "': " + r.errors.map(e => 'position ' + e[0] + ': ' + e[1]).join(', ') };
  try { return { raw, pattern, negative, regex: new RegExp(r.source, 'u'), source: r.source }; }
  catch (e) { return { raw, pattern, negative, error: "invalid pattern '" + pattern + "': " + e.message.replace(/^Invalid regular expression: /, '') }; }
}

// The last pattern that matches decides (a "!" pattern excludes again what an earlier one included).
function decide(compiled, name) {
  let hit = null;
  compiled.forEach((c, i) => { if (c.regex && c.regex.test(name)) hit = { index: i, pattern: c.raw, negative: c.negative }; });
  return hit;
}

// include list (branches, tags, paths): runs if at least one name is included.
// ignore list (branches-ignore, tags-ignore, paths-ignore): runs unless every name is ignored.
function evalList(rawPatterns, names, kind) {
  const compiled = rawPatterns.map(compile);
  const errors = compiled.filter(c => c.error).map(c => c.error);
  const per = names.map(n => {
    const h = decide(compiled, n);
    const selected = !!(h && !h.negative);
    return { name: n, [kind === 'ignore' ? 'ignored' : 'included']: selected, decided_by: h ? h.pattern : null, pattern_index: h ? h.index : null };
  });
  const key = kind === 'ignore' ? 'ignored' : 'included';
  const pass = kind === 'ignore' ? per.some(x => !x.ignored) : per.some(x => x.included);
  return { pass: errors.length ? false : pass, errors, per, key };
}

// ---------- workflow reading ----------
function toList(v) { if (v === null || v === undefined) return []; return Array.isArray(v) ? v.map(x => x === null ? '' : String(x)) : [String(v)]; }

function readWorkflow(text) {
  const lc = new YAML.LineCounter();
  const doc = YAML.parseDocument(String(text), { lineCounter: lc, uniqueKeys: false });
  if (doc.errors.length) return { error: 'invalid YAML: ' + doc.errors[0].message.split('\n')[0] };
  const js = doc.toJS({ maxAliasCount: 1000 }) || {};
  if (typeof js !== 'object' || Array.isArray(js)) return { error: 'the workflow must be a YAML mapping' };
  let onKey = 'on';
  if (!('on' in js) && 'true' in js) onKey = 'true';
  if (!(onKey in js)) return { error: 'no "on:" key: this workflow is never triggered' };
  const lineOf = (pathArr) => {
    const n = doc.getIn(pathArr, true);
    if (n && n.range) return lc.linePos(n.range[0]).line;
    return null;
  };
  let on = js[onKey];
  let events = {};
  if (typeof on === 'string') events[on] = null;
  else if (Array.isArray(on)) on.forEach(e => { events[String(e)] = null; });
  else if (on && typeof on === 'object') events = on;
  else return { error: '"on:" is empty' };
  return { name: js.name || null, events, lineOf: (ev, filter, i) => {
    const base = Array.isArray(on) || typeof on === 'string' ? [onKey] : [onKey, ev];
    if (filter === undefined) return lineOf(base);
    const v = events[ev] && events[ev][filter];
    if (Array.isArray(v) && i !== undefined) return lineOf(base.concat([filter, i]));
    return lineOf(base.concat([filter]));
  } };
}

const SKIP_MARKERS = ['[skip ci]', '[ci skip]', '[no ci]', '[skip actions]', '[actions skip]'];
const DEFAULT_PR_TYPES = ['opened', 'synchronize', 'reopened'];
const FILTER_EVENTS = { push: 1, pull_request: 1, pull_request_target: 1 };

function stripRef(ref) {
  ref = String(ref || '');
  if (ref.startsWith('refs/heads/')) return { kind: 'branch', name: ref.slice(11) };
  if (ref.startsWith('refs/tags/')) return { kind: 'tag', name: ref.slice(10) };
  return { kind: null, name: ref };
}

function evaluate(text, a) {
  a = a || {};
  const event = String(a.event || 'push');
  const wf = readWorkflow(text);
  const res = { runs: false, event, steps: [], warnings: [] };
  if (wf.error) { res.error = wf.error; res.steps.push(wf.error); return res; }
  res.workflow_name = wf.name;
  const listened = Object.keys(wf.events);
  if (!(event in wf.events)) {
    res.steps.push('The workflow does not listen to "' + event + '". It listens to: ' + (listened.join(', ') || 'nothing') + '.');
    res.decided_by = { line: wf.lineOf(event), text: 'on: ' + listened.join(', ') };
    return res;
  }
  let cfg = wf.events[event];
  if (cfg === null || cfg === undefined) cfg = {};
  if (typeof cfg !== 'object' || Array.isArray(cfg)) { res.error = 'on.' + event + ' must be a mapping of filters'; res.steps.push(res.error); return res; }
  const step = (s) => res.steps.push(s);
  const L = (f, i) => wf.lineOf(event, f, i);

  if (!FILTER_EVENTS[event]) {
    res.runs = true;
    step('"' + event + '" is listed under on:. This tool checks branch, tag and path filters only for push, pull_request and pull_request_target; other events have their own conditions (cron time, manual run, types...).');
    if (cfg.types) res.warnings.push('on.' + event + '.types = ' + JSON.stringify(cfg.types) + ': only these activity types trigger it.');
    if (event === 'workflow_run' && (cfg.branches || cfg['branches-ignore'])) res.warnings.push('workflow_run branch filters apply to the head branch of the triggering workflow run.');
    return res;
  }

  // invalid combinations: GitHub refuses the whole workflow file
  for (const [x, y] of [['branches', 'branches-ignore'], ['tags', 'tags-ignore'], ['paths', 'paths-ignore']]) {
    if (cfg[x] !== undefined && cfg[y] !== undefined) {
      res.error = 'on.' + event + ' uses both "' + x + '" and "' + y + '": GitHub rejects this workflow file (invalid workflow), so it never runs. Use "' + x + '" with "!" patterns instead.';
      res.decided_by = { line: L(y), text: y };
      step(res.error); return res;
    }
  }
  for (const f of ['branches', 'branches-ignore', 'tags', 'tags-ignore', 'paths', 'paths-ignore']) {
    const pats = toList(cfg[f]);
    pats.forEach((p, i) => { const c = compile(p); if (c.error) { res.error = 'on.' + event + '.' + f + ': ' + c.error + ' GitHub rejects this workflow file.'; res.decided_by = { line: L(f, i), text: p }; } });
    if (res.error) { step(res.error); return res; }
    if (pats.length && pats.every(p => p.startsWith('!')) && (f === 'branches' || f === 'tags' || f === 'paths')) res.warnings.push('on.' + event + '.' + f + ' has only "!" patterns: nothing can match, so this filter never lets the workflow run. Add a positive pattern first (e.g. "**" or "*"), or use ' + f + '-ignore.');
    if ((f.endsWith('-ignore')) && pats.some(p => p.startsWith('!'))) res.warnings.push('on.' + event + '.' + f + ' contains a "!" pattern. GitHub documents "!" for ' + f.replace('-ignore', '') + ', not for ' + f + '; here the last matching pattern decides. Prefer ' + f.replace('-ignore', '') + ' with "!" patterns.');
  }

  const isPR = event !== 'push';
  let ref = a.ref !== undefined ? stripRef(a.ref) : null;
  let branch = a.branch !== undefined ? stripRef(a.branch).name : (ref && ref.kind !== 'tag' ? ref.name : null);
  let tag = a.tag !== undefined ? stripRef(a.tag).name : (ref && ref.kind === 'tag' ? ref.name : null);
  const files = Array.isArray(a.changed_files) ? a.changed_files.map(String).map(f => f.replace(/^\.\//, '')) : null;
  let unknown = [];

  if (isPR) {
    if (cfg.tags !== undefined || cfg['tags-ignore'] !== undefined) res.warnings.push('tags / tags-ignore have no effect on ' + event + ' (only on push).');
    const action = a.action ? String(a.action) : 'opened';
    const types = cfg.types !== undefined ? toList(cfg.types) : DEFAULT_PR_TYPES;
    if (types.indexOf(action) < 0) {
      step('Activity "' + action + '" is not in types ' + JSON.stringify(types) + (cfg.types === undefined ? ' (the default when "types" is not set)' : '') + ': no run.');
      res.decided_by = { line: cfg.types !== undefined ? L('types') : L(), text: 'types: ' + JSON.stringify(types) };
      return res;
    }
    step('Activity "' + action + '" is in types ' + JSON.stringify(types) + (cfg.types === undefined ? ' (default)' : '') + '.');
    if (event === 'pull_request' && a.has_merge_conflict) {
      step('The pull request has a merge conflict: GitHub does not run pull_request workflows until it is resolved.');
      res.decided_by = { line: null, text: 'merge conflict' }; return res;
    }
    if (tag) res.warnings.push('"tag" ignored for ' + event + ': branch filters are compared with the BASE branch of the pull request.');
  } else {
    if (branch && tag) { res.error = 'give either a branch or a tag for one push, not both'; step(res.error); return res; }
    const hasB = cfg.branches !== undefined || cfg['branches-ignore'] !== undefined;
    const hasT = cfg.tags !== undefined || cfg['tags-ignore'] !== undefined;
    if (tag) {
      if (hasB && !hasT) {
        step('Tag push: on.push only has branch filters, so pushing a tag never triggers it.');
        res.decided_by = { line: L(cfg.branches !== undefined ? 'branches' : 'branches-ignore'), text: cfg.branches !== undefined ? 'branches' : 'branches-ignore' };
        return res;
      }
      if (Number(a.tags_pushed_count) > 3) {
        step(a.tags_pushed_count + ' tags pushed at once: GitHub creates no push event for tags when more than 3 are pushed together.');
        res.decided_by = { line: null, text: 'more than 3 tags pushed at once' }; return res;
      }
    }
    if (branch !== null && hasT && !hasB) {
      step('Branch push: on.push only has tag filters, so pushing a branch never triggers it.');
      res.decided_by = { line: L(cfg.tags !== undefined ? 'tags' : 'tags-ignore'), text: cfg.tags !== undefined ? 'tags' : 'tags-ignore' };
      return res;
    }
    if (branch === null && tag === null && (hasB || hasT)) unknown.push('branch or tag');
  }

  // branch / tag filters
  const refFilters = isPR ? [['branches', branch], ['branches-ignore', branch]] : (tag !== null ? [['tags', tag], ['tags-ignore', tag]] : [['branches', branch], ['branches-ignore', branch]]);
  for (const [f, name] of refFilters) {
    if (cfg[f] === undefined) continue;
    if (name === null || name === undefined) { if (unknown.indexOf(isPR ? 'base branch' : 'branch or tag') < 0) unknown.push(isPR ? 'base branch' : 'branch or tag'); continue; }
    const pats = toList(cfg[f]);
    const r = evalList(pats, [name], f.endsWith('-ignore') ? 'ignore' : 'include');
    const d = r.per[0];
    const what = isPR ? 'base branch "' + name + '"' : (tag !== null ? 'tag "' + name + '"' : 'branch "' + name + '"');
    if (f.endsWith('-ignore')) {
      if (d.ignored) { step(what + ' is ignored by on.' + event + '.' + f + ' pattern "' + d.decided_by + '": no run.'); res.decided_by = { line: L(f, d.pattern_index), text: d.decided_by }; return res; }
      step(what + ' is not ignored by ' + f + (d.decided_by ? ' (last matching pattern "' + d.decided_by + '" is a "!" exception)' : ' (no pattern matches)') + '.');
    } else {
      if (!d.included) {
        step(what + (d.decided_by ? ' is excluded by on.' + event + '.' + f + ' pattern "' + d.decided_by + '"' : ' matches none of on.' + event + '.' + f + ' ' + JSON.stringify(pats)) + ': no run.');
        res.decided_by = { line: d.decided_by ? L(f, d.pattern_index) : L(f), text: d.decided_by || f };
        return res;
      }
      step(what + ' matches on.' + event + '.' + f + ' pattern "' + d.decided_by + '".');
      res.decided_by = { line: L(f, d.pattern_index), text: d.decided_by };
    }
  }

  // path filters (not evaluated for tag pushes)
  const pf = cfg.paths !== undefined ? 'paths' : (cfg['paths-ignore'] !== undefined ? 'paths-ignore' : null);
  if (pf && !isPR && tag !== null) step('Path filters are not evaluated for tag pushes: on.push.' + pf + ' is skipped.');
  else if (pf) {
    if (!files) unknown.push('changed files (on.' + event + '.' + pf + ' decides)');
    else if (!files.length) {
      step('No changed file given: with on.' + event + '.' + pf + ', a push or pull request without file changes does not run the workflow.');
      res.decided_by = { line: L(pf), text: pf }; return res;
    } else {
      const pats = toList(cfg[pf]);
      const r = evalList(pats, files, pf === 'paths' ? 'include' : 'ignore');
      if (files.length > 300) res.warnings.push(files.length + ' changed files: GitHub only looks at the first 300 files of the diff. If none of those 300 matches, the workflow does not run, even if a later file would.');
      if (pf === 'paths') {
        const hit = r.per.find(x => x.included);
        if (!hit) {
          const excl = r.per.filter(x => x.decided_by).slice(0, 5).map(x => x.name + ' (excluded by "' + x.decided_by + '")');
          step('None of the ' + files.length + ' changed file(s) matches on.' + event + '.paths ' + JSON.stringify(pats) + (excl.length ? '; ' + excl.join(', ') : '') + ': no run.');
          res.decided_by = { line: L('paths'), text: 'paths' }; res.files = r.per.slice(0, 100); return res;
        }
        step('File "' + hit.name + '" matches on.' + event + '.paths pattern "' + hit.decided_by + '".');
        res.decided_by = { line: L('paths', hit.pattern_index), text: hit.decided_by, file: hit.name };
      } else {
        const kept = r.per.find(x => !x.ignored);
        if (!kept) {
          step('All ' + files.length + ' changed file(s) are ignored by on.' + event + '.paths-ignore: no run.');
          res.decided_by = { line: L('paths-ignore'), text: 'paths-ignore' }; res.files = r.per.slice(0, 100); return res;
        }
        step('File "' + kept.name + '" is not ignored by on.' + event + '.paths-ignore' + (kept.decided_by ? ' (last matching pattern "' + kept.decided_by + '" is a "!" exception)' : '') + ', so the workflow runs.');
        res.decided_by = { line: L('paths-ignore'), text: 'paths-ignore', file: kept.name };
      }
      res.files = r.per.slice(0, 100);
    }
  }

  // [skip ci]
  if (a.commit_message && (event === 'push' || event === 'pull_request')) {
    const m = String(a.commit_message);
    const mk = SKIP_MARKERS.find(s => m.indexOf(s) >= 0) || (/^skip-checks: ?true\s*$/m.test(m) ? 'skip-checks: true' : null);
    if (mk) { step('The commit message contains "' + mk + '": GitHub skips push and pull_request workflows for this commit.'); res.decided_by = { line: null, text: mk }; res.unknown = unknown; if (unknown.length) res.runs = false; return res; }
  }

  if (unknown.length) {
    res.runs = null;
    res.missing = unknown;
    step('Cannot decide yet: give the ' + unknown.join(' and ') + '.');
    return res;
  }
  res.runs = true;
  if (!res.decided_by) { res.decided_by = { line: L(), text: 'on: ' + event + ' (no filter)' }; step('on.' + event + ' has no branch, tag or path filter: it runs on every ' + event + (isPR ? ' of the listed types.' : '.')); }
  else step('All filters pass: the workflow runs.');
  return res;
}

module.exports = { patternToRegex, compile, evalList, evaluate, readWorkflow, SKIP_MARKERS };
