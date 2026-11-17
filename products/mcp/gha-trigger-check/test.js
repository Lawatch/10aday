'use strict';
// Tests of the pattern engine against nektos/act pkg/workflowpattern (Go), plus event rules from GitHub's docs.
//   node test.js --fixtures            replay recorded answers of act (fixtures.json)
//   node test.js --gen N SEED > cases  print N random cases (one JSON per line) for the Go oracle
//   ORACLE=path node test.js N SEED    live comparison with the compiled Go oracle
//   node test.js --record N SEED       (with ORACLE) write fixtures.json
const fs = require('fs'), path = require('path'), cp = require('child_process');
const E = require('./engine.js');

function rng(seed) { let s = seed >>> 0 || 1; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }
const PAT_ATOMS = ['a', 'b', 'c', 'x', '/', '/', '*', '*', '**', '**/', '?', '+', '[ab]', '[a-c]', '[0-9]', '[A-z]', '[', ']', '-', '\\', '\\*', '!', '.', '0', '9', 'Z', '_', 'é', '{', '(', '^', '$', '|', 'v', '1', 'main', 'src', '.md', '[]', '[a-]', '[-a]', '[^a]', '[z-a]', ' '];
const IN_ATOMS = ['a', 'b', 'c', 'x', '/', '/', '.', '0', '9', 'Z', '_', '-', 'é', '*', '?', '+', '!', 'v', '1', 'main', 'src', '.md', '[', ']', '{', '^', ' ', 'A', '\\'];
function gen(n, seed) {
  const r = rng(seed), pick = a => a[Math.floor(r() * a.length)];
  const cases = [];
  for (let i = 0; i < n; i++) {
    const np = 1 + Math.floor(r() * 4), patterns = [];
    for (let j = 0; j < np; j++) { let s = r() < 0.25 ? '!' : ''; const k = 1 + Math.floor(r() * 5); for (let t = 0; t < k; t++) s += pick(PAT_ATOMS); patterns.push(s); }
    const ni = Math.floor(r() * 4), inputs = [];
    for (let j = 0; j < ni; j++) {
      let s = '';
      if (r() < 0.5) { // build an input that a pattern may match
        s = patterns[Math.floor(r() * np)].replace(/^!/, '').replace(/\*\*\//g, () => pick(['', 'a/', 'a/b/'])).replace(/\*\*/g, () => pick(['', 'x/y', 'z'])).replace(/\*/g, () => pick(['', 'ab', 'c.d'])).replace(/\\(.)/g, '$1');
      } else { const k = 1 + Math.floor(r() * 6); for (let t = 0; t < k; t++) s += pick(IN_ATOMS); }
      inputs.push(s);
    }
    cases.push({ patterns, inputs });
  }
  return cases;
}

function mine(c) {
  const compiled = c.patterns.map(E.compile);
  if (compiled.some(x => x.error)) return { err: true, skip: false, filter: false };
  const inc = E.evalList(c.patterns, c.inputs, 'include');
  const ign = E.evalList(c.patterns, c.inputs, 'ignore');
  // act: empty pattern list never skips; ours is the same rule seen from the "runs" side
  const skip = c.patterns.length === 0 ? false : !inc.pass;
  const filter = c.patterns.length === 0 ? false : !ign.pass;
  return { err: false, skip, filter };
}

function compare(cases, answers) {
  let bad = 0, checks = 0;
  cases.forEach((c, i) => {
    const m = mine(c), o = answers[i];
    const hasNeg = c.patterns.some(p => p.startsWith('!'));
    const keys = hasNeg ? ['err', 'skip'] : ['err', 'skip', 'filter']; // act's Filter treats "!" in ignore lists its own way (undocumented by GitHub)
    for (const k of keys) { checks++; if (m[k] !== o[k]) { bad++; if (bad <= 15) console.log('DIFF', k, JSON.stringify(c), 'act:', JSON.stringify(o), 'ours:', JSON.stringify(m)); } }
  });
  return { bad, checks };
}

function runOracle(oracle, cases) {
  const out = cp.execFileSync(oracle, { input: cases.map(c => JSON.stringify(c)).join('\n') + '\n', maxBuffer: 1 << 28 }).toString().trim().split('\n');
  return out.map(l => JSON.parse(l));
}

// ---- event rules: documented GitHub behaviour (docs.github.com, "Workflow syntax" and "Events that trigger workflows")
function eventTests() {
  const W = 'on:\n  push:\n    branches:\n      - main\n      - "releases/**"\n      - "!releases/**-alpha"\n    paths:\n      - "src/**"\n      - "!src/**/*.md"\n  pull_request:\n    branches: [main]\n    types: [opened, labeled]\n';
  const T = [
    [W, { branch: 'main', changed_files: ['src/a.js'] }, true],
    [W, { branch: 'releases/10', changed_files: ['src/a.js'] }, true],
    [W, { branch: 'releases/10-alpha', changed_files: ['src/a.js'] }, false],
    [W, { branch: 'main', changed_files: ['docs/x.md', 'src/b/README.md'] }, false],
    [W, { branch: 'main', changed_files: ['src/b/README.md', 'src/b/c.ts'] }, true],
    [W, { branch: 'feature/x', changed_files: ['src/a.js'] }, false],
    [W, { tag: 'v1.0.0' }, false],                       // only branch filters: tags never trigger
    [W, { branch: 'main' }, null],                        // depends on files
    [W, { branch: 'main', changed_files: ['src/a.js'], commit_message: 'wip\n\nskip-checks: true' }, false],
    [W, { branch: 'main', changed_files: ['src/a.js'], commit_message: 'docs [ci skip]' }, false],
    [W, { event: 'pull_request', branch: 'main', action: 'labeled', changed_files: ['x'] }, true], // no paths on pull_request
    [W, { event: 'pull_request', branch: 'main', action: 'synchronize' }, false],
    [W, { event: 'pull_request', branch: 'dev', action: 'opened' }, false],
    [W, { event: 'pull_request_target', branch: 'main' }, false],
    ['on: [push, pull_request]\n', { event: 'pull_request', branch: 'x', action: 'closed' }, false], // default types
    ['on: [push, pull_request]\n', { event: 'pull_request', branch: 'x', action: 'reopened' }, true],
    ['on: [push, pull_request]\n', { event: 'pull_request', branch: 'x', has_merge_conflict: true }, false],
    ['on: [push, pull_request]\n', { tag: 'v1', tags_pushed_count: 4 }, false],
    ['on: [push, pull_request]\n', { tag: 'v1', tags_pushed_count: 3 }, true],
    ['on:\n  push:\n    tags: ["v*"]\n', { branch: 'main' }, false],
    ['on:\n  push:\n    tags: ["v*"]\n', { tag: 'v2.1' }, true],
    ['on:\n  push:\n    tags: ["v*"]\n', { tag: 'release-2' }, false],
    ['on:\n  push:\n    paths: ["src/**"]\n', { tag: 'v2' }, true],     // paths not evaluated for tags
    ['on:\n  push:\n    paths-ignore: ["docs/**", "**.md"]\n', { branch: 'main', changed_files: ['docs/a.txt', 'README.md'] }, false],
    ['on:\n  push:\n    paths-ignore: ["docs/**", "**.md"]\n', { branch: 'main', changed_files: ['docs/a.txt', 'app.py'] }, true],
    ['on:\n  push:\n    branches: [main]\n    branches-ignore: [dev]\n', { branch: 'main' }, false],     // invalid workflow
    ['on:\n  push:\n    branches: ["feature/*"]\n', { branch: 'feature/a/b' }, false],                 // * stops at /
    ['on:\n  push:\n    branches: ["feature/**"]\n', { ref: 'refs/heads/feature/a/b' }, true],
    ['on:\n  push:\n    branches: ["[a-]"]\n', { branch: 'a' }, false],                                // invalid pattern
    ['on:\n  push:\n    branches-ignore: ["dependabot/**"]\n', { branch: 'dependabot/npm/x' }, false],
    ['on:\n  workflow_dispatch:\n', { event: 'push', branch: 'main' }, false],
    ['on: push\n', { branch: 'anything', changed_files: [] }, true],
  ];
  let bad = 0;
  T.forEach(([w, a, want], i) => { const r = E.evaluate(w, a); if (r.runs !== want) { bad++; console.log('EVENT DIFF #' + i, JSON.stringify(a), 'want', want, 'got', r.runs, r.steps.join(' | ')); } });
  return { bad, checks: T.length };
}

const argv = process.argv.slice(2);
if (argv[0] === '--gen') { gen(+argv[1], +argv[2]).forEach(c => console.log(JSON.stringify(c))); process.exit(0); }
let total = 0, bad = 0;
const ev = eventTests(); total += ev.checks; bad += ev.bad;
console.log('event rules: ' + ev.checks + ' cases, ' + ev.bad + ' wrong');
if (argv[0] === '--fixtures' || argv[0] === undefined) {
  const fx = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures.json'), 'utf8'));
  const r = compare(fx.cases, fx.answers); total += r.checks; bad += r.bad;
  console.log('recorded act answers: ' + fx.cases.length + ' cases, ' + r.checks + ' checks, ' + r.bad + ' differences');
} else if (argv[0] === '--record') {
  const cases = gen(+argv[1], +argv[2]); const answers = runOracle(process.env.ORACLE, cases);
  fs.writeFileSync(path.join(__dirname, 'fixtures.json'), JSON.stringify({ source: 'nektos/act v0.2.98 pkg/workflowpattern', cases, answers }));
  const r = compare(cases, answers); total += r.checks; bad += r.bad;
  console.log('recorded ' + cases.length + ' cases, ' + r.bad + ' differences');
} else {
  const cases = gen(+argv[0], +(argv[1] || 1)); const answers = runOracle(process.env.ORACLE, cases);
  const r = compare(cases, answers); total += r.checks; bad += r.bad;
  const errs = answers.filter(a => a.err).length;
  console.log('live act comparison: ' + cases.length + ' cases (' + errs + ' invalid patterns), ' + r.checks + ' checks, ' + r.bad + ' differences');
}
if (bad) { console.log('FAILED: ' + bad + ' of ' + total); process.exit(1); }
console.log('OK');
