'use strict';
// Which files "npm pack" / "npm publish" put in the tarball, and which rule decides each one.
// Line-by-line port of npm-packlist 9.0.0 + ignore-walk 7.0.0 (the code npm 10 runs), on a virtual file list instead
// of the disk, with the exact glob engine npm uses (minimatch 9.0.9, bundled in ./minimatch.js).
const { Minimatch } = require('./minimatch.js');
const P = require('path').posix;

const DEFAULTS = ['.npmignore', '.gitignore', '**/.git', '**/.svn', '**/.hg', '**/CVS', '**/.git/**', '**/.svn/**', '**/.hg/**',
  '**/CVS/**', '/.lock-wscript', '/.wafpickle-*', '/build/config.gypi', 'npm-debug.log', '**/.npmrc', '.*.swp', '.DS_Store',
  '**/.DS_Store/**', '._*', '**/._*/**', '*.orig', '/archived-packages/**'];
const STRICT_DEFAULTS = ['/.git'];
const DEF = 'npm built-in rules', STRICT = 'npm forced rules';
const MMOPT = { matchBase: true, dot: true, flipNegate: true, nocase: true };

// ---- virtual file system -------------------------------------------------------------------------------------------
function clean(p) {
  p = String(p).replace(/\\/g, '/').replace(/^\.\//, '').replace(/^\/+/, '');
  const n = P.normalize(p);
  if (n === '.' || n === '' || n.startsWith('../') || n === '..') throw new Error('bad path "' + p + '": give paths relative to the package root');
  return n.replace(/\/+$/, '');
}
function buildFs(paths, contents) {
  const files = new Map(); // path -> content (string or null)
  const dirs = new Map([['', new Set()]]);
  const add = (p, c) => {
    p = clean(p);
    if (dirs.has(p)) throw new Error('"' + p + '" is used both as a file and as a folder');
    files.set(p, c === undefined ? (files.get(p) ?? null) : c);
    const parts = p.split('/');
    for (let i = 0; i < parts.length; i++) {
      const parent = parts.slice(0, i).join('/'), cur = parts.slice(0, i + 1).join('/');
      if (i < parts.length - 1) {
        if (files.has(cur)) throw new Error('"' + cur + '" is used both as a file and as a folder');
        if (!dirs.has(cur)) dirs.set(cur, new Set());
      }
      dirs.get(parent).add(parts[i]);
    }
  };
  for (const p of paths) add(p);
  for (const p of Object.keys(contents)) add(p, String(contents[p]));
  return { files, dirs };
}
// lstat-like: 'file', 'dir' or null (missing / error)
function lstat(fs, rel, trailingSlash) {
  if (rel === '') return 'dir';
  if (fs.dirs.has(rel)) return 'dir';
  if (fs.files.has(rel)) return trailingSlash ? null : 'file';
  return null;
}

// ---- package.json normalisation done by read-package-json-fast before npm-packlist sees it -------------------------
function normalizeBin(pkg) {
  const b = pkg.bin;
  let obj;
  if (!b) { delete pkg.bin; return pkg; }
  if (typeof b === 'string') { if (!pkg.name) { delete pkg.bin; return pkg; } obj = { [pkg.name]: b }; }
  else if (Array.isArray(b)) { obj = {}; for (const k of b) obj[P.basename(String(k))] = k; }
  else if (typeof b === 'object') obj = b;
  else { delete pkg.bin; return pkg; }
  const out = {}; let has = false;
  for (const key of Object.keys(obj)) {
    const base = P.join('/', P.basename(key.replace(/\\|:/g, '/'))).slice(1);
    if (typeof obj[key] !== 'string' || !base) continue;
    const target = P.join('/', obj[key].replace(/\\/g, '/')).slice(1);
    if (!target) continue;
    out[base] = target; has = true;
  }
  if (has) pkg.bin = out; else delete pkg.bin;
  return pkg;
}
function normalizePkg(pkg) {
  pkg = JSON.parse(JSON.stringify(pkg));
  if (pkg.bundledDependencies !== undefined && pkg.bundleDependencies === undefined) pkg.bundleDependencies = pkg.bundledDependencies;
  delete pkg.bundledDependencies;
  if (pkg.bundleDependencies === true) pkg.bundleDependencies = Object.keys(pkg.dependencies || {});
  return normalizeBin(pkg);
}

// ---- the walker ------------------------------------------------------------------------------------------------------
function mkRules(lines, source, metas) {
  // same filtering as ignore-walk: drop empty lines and comments, trim the rest
  const out = [];
  lines.forEach((raw, i) => {
    const t = raw.trim();
    if (/^#|^$/.test(t)) return;
    const m = new Minimatch(t, MMOPT);
    m.meta = Object.assign({ source, line: i + 1, rule: t }, metas ? metas[i] : null);
    out.push(m);
  });
  return out;
}
function readIgnoreText(text, source) {
  return mkRules(String(text).split(/\r?\n/), source);
}

class Walker {
  constructor(ctx, opts) {
    this.ctx = ctx;
    this.path = opts.path; // relative dir, '' = root
    this.basename = this.path === '' ? ctx.rootName : P.basename(this.path);
    this.parent = opts.parent || null;
    this.exact = opts.exact;
    this.isPackage = !!opts.isPackage;
    this.ignoreFiles = opts.ignoreFiles || [DEF, 'package.json', '.npmignore', '.gitignore', STRICT];
    this.requiredFiles = opts.requiredFiles || [];
    this.ignoreRules = {};
    this.ruleSources = {};
    this.injectRules(DEF, DEFAULTS.map((r, i) => ({ r, meta: { why: defaultWhy(r) } })));
    if (!this.isPackage) {
      this.injectRules(STRICT, STRICT_DEFAULTS.map(r => ({ r, meta: { why: 'the .git folder is never packed' } }))
        .concat(this.requiredFiles.map(f => ({ r: '!' + f, meta: { why: 'listed as an exact file in "files": always packed' } }))));
    }
  }
  rel(entry) { return this.path === '' ? entry : this.path + '/' + entry; }
  injectRules(name, list) {
    this.ignoreRules[name] = list.map((x, i) => {
      const m = new Minimatch(x.r.trim(), MMOPT);
      m.meta = Object.assign({ source: name, line: null, rule: x.r }, x.meta);
      return m;
    });
  }
  start() {
    const entries = Array.from(this.ctx.fs.dirs.get(this.path) || []);
    this.entries = entries;
    if (!entries.length) return;
    for (const e of entries.filter(e => this.ignoreFiles.indexOf(e) !== -1)) this.addIgnoreFile(e);
    this.filterEntries();
  }
  addIgnoreFile(file) {
    if (file === 'package.json' && this.isPackage) return this.processPackage();
    const rel = this.rel(file);
    if (this.ctx.fs.dirs.has(rel)) { this.ctx.errors.push('"' + rel + '" is a folder: npm fails with EISDIR when it tries to read it as an ignore file'); this.ignoreRules[file] = []; return; }
    const content = this.ctx.fs.files.get(rel);
    if (content === null || content === undefined) {
      this.ctx.unknownIgnore.push(rel);
      this.ignoreRules[file] = [];
      return;
    }
    this.ignoreRules[file] = readIgnoreText(content, rel);
  }
  processPackage() {
    const { bin, browser, files, main } = this.ctx.pkg;
    const ignores = [];
    const strict = STRICT_DEFAULTS.map(r => ({ r, meta: { why: 'the .git folder is never packed' } })).concat([
      { r: '!/package.json', meta: { why: 'package.json is always packed' } },
      { r: '!/readme{,.*[^~$]}', meta: { why: 'README files at the root are always packed' } },
      { r: '!/copying{,.*[^~$]}', meta: { why: 'COPYING files at the root are always packed' } },
      { r: '!/license{,.*[^~$]}', meta: { why: 'LICENSE files at the root are always packed' } },
      { r: '!/licence{,.*[^~$]}', meta: { why: 'LICENCE files at the root are always packed' } },
      { r: '/.git', meta: { why: 'the .git folder is never packed' } },
      { r: '/node_modules', meta: { why: 'node_modules is never packed (except bundled dependencies, not modelled here)' } },
      { r: '.npmrc', meta: { why: '.npmrc files are never packed (they may hold tokens)' } },
      { r: '/package-lock.json', meta: { why: 'package-lock.json is never packed' } },
      { r: '/yarn.lock', meta: { why: 'yarn.lock is never packed' } },
      { r: '/pnpm-lock.yaml', meta: { why: 'pnpm-lock.yaml is never packed' } }]);
    if (files) {
      const list = Array.isArray(files) ? files : [];
      list.forEach((orig, idx) => {
        let file = String(orig);
        if (file.startsWith('./')) file = file.slice(1);
        if (file.endsWith('/*')) file += '*';
        const inverse = '!' + file;
        const meta = { why: '"files" entry #' + (idx + 1) + ' ' + JSON.stringify(orig), files_index: idx };
        const target = P.join('/', file.replace(/^!+/, '')).slice(1);
        const st = lstat(this.ctx.fs, P.normalize(target).replace(/^\.\/?$/, '').replace(/\/+$/, ''), /\/$/.test(target));
        if (st === 'file') {
          strict.unshift({ r: inverse, meta: Object.assign({}, meta, { why: meta.why + ' (an exact file: always packed)' }) });
          this.requiredFiles.push(file.startsWith('/') ? file.slice(1) : file);
          this.ctx.filesKinds[idx] = 'file';
        } else if (st === 'dir') {
          ignores.push({ r: inverse, meta: Object.assign({}, meta, { why: meta.why + ' (a folder)' }) });
          ignores.push({ r: inverse + '/**', meta: Object.assign({}, meta, { why: meta.why + ' (everything inside the folder)' }) });
          this.ctx.filesKinds[idx] = 'dir';
        } else {
          ignores.push({ r: inverse, meta: Object.assign({}, meta, { why: meta.why + ' (a pattern)' }) });
          this.ctx.filesKinds[idx] = 'pattern';
        }
      });
      this.injectRules('package.json', [{ r: '*', meta: { why: '"files" is set: everything not listed in it is left out' } }].concat(ignores));
    }
    if (browser) strict.push({ r: '!/' + browser, meta: { why: '"browser" field: always packed' } });
    if (main) strict.push({ r: '!/' + main, meta: { why: '"main" field: always packed' } });
    if (bin) for (const k in bin) strict.push({ r: '!/' + bin[k], meta: { why: '"bin" field (' + k + '): always packed' } });
    this.injectRules(STRICT, strict);
  }
  filterEntries() {
    if (this.ignoreRules['package.json']) { this.ignoreRules['.npmignore'] = null; this.ignoreRules['.gitignore'] = null; }
    else if (this.ignoreRules['.npmignore']) this.ignoreRules['.gitignore'] = null;
    for (const entry of this.entries) {
      const tf = {}, td = {};
      const passFile = this.filterEntry(entry, false, undefined, tf);
      const passDir = this.filterEntry(entry, true, undefined, td);
      const rel = this.rel(entry);
      if (!(passFile || passDir)) { this.ctx.record(rel, false, tf.rule, this.ctx.fs.dirs.has(rel) ? td.rule : null); continue; }
      if (/\*/.test(entry)) { this.ctx.record(rel, false, { meta: { source: 'npm', rule: null, why: 'npm refuses names containing "*"' } }); continue; }
      const st = lstat(this.ctx.fs, rel);
      if (st !== 'dir') {
        this.ctx.record(rel, passFile, tf.rule);
      } else if (passDir) {
        this.walker(entry, { exact: passFile || this.filterEntry(entry + '/') });
      } else {
        this.ctx.record(rel, false, tf.rule, td.rule);
      }
    }
  }
  walkerOpt(entry, opts) {
    let ignoreFiles = null;
    if (!this.ctx.hasWorkspaces) ignoreFiles = [DEF, '.npmignore', '.gitignore', STRICT];
    const requiredFiles = this.requiredFiles.map(f => P.relative(f, entry) === '..' ? P.relative(entry, f) : false).filter(Boolean);
    return Object.assign({ path: this.rel(entry), parent: this }, opts, { ignoreFiles, requiredFiles });
  }
  walker(entry, opts) { new Walker(this.ctx, this.walkerOpt(entry, opts)).start(); }
  filterEntry(entry, partial, entryBasename, track) {
    let included = true;
    if (this.parent) {
      included = this.parent.filterEntry(this.basename + '/' + entry, partial, entryBasename || entry, track);
      if (!included && !this.exact) return false;
    }
    for (const f of this.ignoreFiles) {
      const rules = this.ignoreRules[f];
      if (!rules) continue;
      for (const rule of rules) {
        if (rule.negate === included) continue;
        const isRelativeRule = entryBasename && rule.globParts.some(part => part.length <= (part.slice(-1)[0] ? 1 : 2));
        const match = rule.match('/' + entry) || rule.match(entry) ||
          !!partial && (rule.match('/' + entry + '/') || rule.match(entry + '/') ||
            rule.negate && (rule.match('/' + entry, true) || rule.match(entry, true)) ||
            isRelativeRule && (rule.match('/' + entryBasename + '/') || rule.match(entryBasename + '/') ||
              rule.negate && (rule.match('/' + entryBasename, true) || rule.match(entryBasename, true))));
        if (match) { included = rule.negate; if (track) track.rule = rule; }
      }
    }
    return included;
  }
}

function defaultWhy(r) {
  if (/\.npmignore|\.gitignore/.test(r)) return 'ignore files themselves are not packed';
  if (/git|svn|hg|CVS/.test(r)) return 'version-control folders are never packed';
  if (/npmrc/.test(r)) return '.npmrc files are never packed';
  return 'npm leaves this junk file out by default';
}

// Arborist only sets tree.workspaces when at least one folder matching "workspaces" has its own package.json
function hasWorkspaces(pkg, fs) {
  let pats = pkg.workspaces;
  if (pats && !Array.isArray(pats) && typeof pats === 'object') pats = pats.packages;
  if (!Array.isArray(pats)) return false;
  const ms = pats.filter(p => typeof p === 'string' && !p.startsWith('!')).map(p => new Minimatch(P.normalize(p).replace(/\/+$/, '')));
  for (const d of fs.dirs.keys()) if (d && fs.files.has(d + '/package.json') && ms.some(m => m.match(d))) return true;
  return false;
}

// ---- public API -------------------------------------------------------------------------------------------------------
function describe(rule) {
  if (!rule) return null;
  const m = rule.meta;
  const out = { source: m.source === DEF || m.source === STRICT ? m.source : m.source, rule: m.rule };
  if (m.line) out.line = m.line;
  if (m.why) out.why = m.why;
  return out;
}
function sortNpm(a, b) {
  const ea = P.extname(a).toLowerCase(), eb = P.extname(b).toLowerCase();
  const ba = P.basename(a).toLowerCase(), bb = P.basename(b).toLowerCase();
  return ea.localeCompare(eb, 'en') || ba.localeCompare(bb, 'en') || a.localeCompare(b, 'en');
}
function pack(input) {
  let pkg = input.package_json;
  if (typeof pkg === 'string') { try { pkg = JSON.parse(pkg); } catch (e) { throw new Error('package.json is not valid JSON: ' + e.message); } }
  if (!pkg || typeof pkg !== 'object' || Array.isArray(pkg)) throw new Error('"package_json" must be the package.json content (object or JSON text)');
  const contents = Object.assign({}, input.ignore_files || {});
  delete contents['package.json'];
  const fs = buildFs((input.paths || []).filter(p => clean(p) !== 'package.json'), contents);
  fs.files.set('package.json', JSON.stringify(pkg)); fs.dirs.get('').add('package.json');
  const ctx = {
    fs, pkg: normalizePkg(pkg), rootName: input.root_name || 'package', errors: [], unknownIgnore: [], filesKinds: {},
    hasWorkspaces: hasWorkspaces(pkg, fs), decisions: new Map(),
    record(rel, included, rule, dirRule) { this.decisions.set(rel, { included, rule, dirRule }); }
  };
  new Walker(ctx, { path: '', isPackage: true }).start();
  // every file gets a verdict: files under a skipped folder inherit the folder's decision
  const included = [], excluded = [], details = {};
  for (const f of fs.files.keys()) {
    let d = ctx.decisions.get(f), via = null;
    if (!d) {
      const parts = f.split('/');
      for (let i = 1; i < parts.length; i++) {
        const dir = parts.slice(0, i).join('/');
        if (ctx.decisions.has(dir)) { d = ctx.decisions.get(dir); via = dir; break; }
      }
    }
    if (!d) d = { included: false, rule: null };
    const rule = via ? (d.dirRule || d.rule) : d.rule;
    details[f] = { included: !!d.included, decided_by: describe(rule), via_folder: via };
    (d.included ? included : excluded).push(f);
  }
  // npm sorts after writing names that start with "@" as "./@..."
  const sorted = included.map(f => /^@/.test(f) ? './' + f : f).sort(sortNpm).map(f => f.replace(/^\.\//, ''));
  included.length = 0; included.push(...sorted); excluded.sort();
  return { included, excluded, details, ctx };
}

module.exports = { pack, sortNpm, clean };
