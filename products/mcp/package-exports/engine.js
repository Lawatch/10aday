'use strict';
// Which file does Node load for `import "pkg/sub"` or `require("pkg/sub")`? A line-by-line port of Node 22's own
// resolver (lib/internal/modules/esm/resolve.js: packageExportsResolve, packageImportsResolve, resolvePackageTarget,
// legacyMainResolve, finalizeResolution; lib/internal/modules/cjs/loader.js: resolveExports, finalizeEsmResolution,
// _findPath, tryPackage), with a trace of every decision. Checked against the real Node (see test.js).
const fs = require('fs');
const path = require('path');
const { pathToFileURL, fileURLToPath } = require('url');

const BUILTINS = new Set(require('module').builtinModules);
const FAKE_ROOT = '/__package__';

class ResolveError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}

// File system view of one package: a real folder, a list of files, or nothing (existence unknown).
class PkgFS {
  constructor(opts) {
    this.root = opts.root ? path.resolve(opts.root) : null;
    this.files = null;
    if (!this.root && Array.isArray(opts.files)) {
      this.files = new Set(); this.dirs = new Set(['']);
      for (let f of opts.files) {
        f = String(f).replace(/\\/g, '/').replace(/^\.\//, '').replace(/^\/+/, '').replace(/\/+$/, '');
        if (!f) continue;
        this.files.add(f);
        const parts = f.split('/');
        for (let i = 1; i < parts.length; i++) this.dirs.add(parts.slice(0, i).join('/'));
      }
    }
    this.base = this.root || FAKE_ROOT;
  }
  get known() { return !!(this.root || this.files); }
  // 0 = file, 1 = directory, -1 = missing, null = unknown (like Node's internalModuleStat, plus "unknown")
  stat(abs) {
    if (this.root) {
      try { const st = fs.statSync(abs); return st.isDirectory() ? 1 : 0; } catch (e) { return -1; }
    }
    if (!this.files) return null;
    if (abs.endsWith('/') && abs.length > 1) {
      // a trailing slash only works for a directory (ENOTDIR on a file)
      const r = this.rel(abs.replace(/\/+$/, ''));
      if (r === null) return -1;
      return this.dirs.has(r) ? 1 : -1;
    }
    const r = this.rel(abs);
    if (r === null) return -1;
    if (this.files.has(r)) return 0;
    if (this.dirs.has(r)) return 1;
    return -1;
  }
  rel(abs) {
    const n = path.posix.normalize(abs);
    if (n === this.base) return '';
    if (!n.startsWith(this.base + '/')) return null;
    return n.slice(this.base.length + 1);
  }
  readJson(abs) {
    if (!this.root) return null;
    try { return JSON.parse(fs.readFileSync(abs, 'utf8')); } catch (e) { return null; }
  }
  display(abs) {
    const r = this.rel(abs);
    if (r === null) return abs;
    return './' + r;
  }
}

// What Node keeps from package.json (C++ reader): strings for main/name/type, objects/arrays/strings for exports & imports.
function readConfig(pkg) {
  const c = { name: undefined, main: undefined, type: 'none', exports: undefined, imports: undefined };
  if (!pkg || typeof pkg !== 'object') return c;
  if (typeof pkg.name === 'string') c.name = pkg.name;
  if (typeof pkg.main === 'string') c.main = pkg.main;
  if (pkg.type === 'module' || pkg.type === 'commonjs') c.type = pkg.type;
  const keep = v => (typeof v === 'string' || (typeof v === 'object' && v !== null)) ? v : undefined;
  c.exports = keep(pkg.exports);
  c.imports = (typeof pkg.imports === 'object' && pkg.imports !== null && !Array.isArray(pkg.imports)) ? pkg.imports : undefined;
  return c;
}

const invalidSegmentRegEx = /(^|\\|\/)((\.|%2e)(\.|%2e)?|(n|%6e|%4e)(o|%6f|%4f)(d|%64|%44)(e|%65|%45)(_|%5f)(m|%6d|%4d)(o|%6f|%4f)(d|%64|%44)(u|%75|%55)(l|%6c|%4c)(e|%65|%45)(s|%73|%53))?(\\|\/|$)/i;
const deprecatedInvalidSegmentRegEx = /(^|\\|\/)((\.|%2e)(\.|%2e)?|(n|%6e|%4e)(o|%6f|%4f)(d|%64|%44)(e|%65|%45)(_|%5f)(m|%6d|%4d)(o|%6f|%4f)(d|%64|%44)(u|%75|%55)(l|%6c|%4c)(e|%65|%45)(s|%73|%53))(\\|\/|$)/i;
const patternRegEx = /\*/g;
const encodedSepRegEx = /%2F|%5C/i;

function isArrayIndex(key) {
  const n = +key;
  if (`${n}` !== key) return false;
  return n >= 0 && n < 0xFFFFFFFF;
}

function patternKeyCompare(a, b) {
  const ai = a.indexOf('*'), bi = b.indexOf('*');
  const la = ai === -1 ? a.length : ai + 1, lb = bi === -1 ? b.length : bi + 1;
  if (la > lb) return -1;
  if (lb > la) return 1;
  if (ai === -1) return 1;
  if (bi === -1) return -1;
  if (a.length > b.length) return -1;
  if (b.length > a.length) return 1;
  return 0;
}

function bestPatternMatch(map, request) {
  let bestMatch = '', bestMatchSubpath;
  for (const key of Object.getOwnPropertyNames(map)) {
    const pi = key.indexOf('*');
    if (pi !== -1 && request.startsWith(key.slice(0, pi))) {
      const trailer = key.slice(pi + 1);
      if (request.length >= key.length && request.endsWith(trailer) && patternKeyCompare(bestMatch, key) === 1 && key.lastIndexOf('*') === pi) {
        bestMatch = key;
        bestMatchSubpath = request.slice(pi, request.length - trailer.length);
      }
    }
  }
  return bestMatch ? { key: bestMatch, sub: bestMatchSubpath } : null;
}

class Resolver {
  constructor(pkgJson, opts) {
    this.raw = pkgJson;
    this.cfg = readConfig(pkgJson);
    this.fs = new PkgFS(opts || {});
    this.pjsonUrl = new URL('package.json', pathToFileURL(this.fs.base + '/'));
    this.trace = [];
    this.conds = [];
  }
  log(s) { this.trace.push(s); }
  where() { return this.conds.length ? ' (' + this.conds.join(' › ') + ')' : ''; }

  invalidTarget(match, target, internal) {
    const t = (typeof target === 'object' && target !== null) ? JSON.stringify(target) : `${target}`;
    return new ResolveError('ERR_INVALID_PACKAGE_TARGET', `Invalid "${internal ? 'imports' : 'exports'}" target ${JSON.stringify(t)} for "${match}": targets must start with "./" and stay inside the package` + (internal ? ' (or name another package)' : ''));
  }

  targetString(target, subpath, match, pattern, internal, isPathMap) {
    if (subpath !== '' && !pattern && target[target.length - 1] !== '/') throw this.invalidTarget(match, target, internal);
    if (!target.startsWith('./')) {
      if (internal && target[0] !== '/' && !target.startsWith('../')) {
        if (!URL.canParse(target)) {
          const exportTarget = pattern ? target.replace(patternRegEx, () => subpath) : target + subpath;
          this.log(`target "${target}" names another package: ${exportTarget}`);
          return { external: exportTarget };
        }
      }
      throw this.invalidTarget(match, target, internal);
    }
    if (invalidSegmentRegEx.exec(target.slice(2)) !== null) {
      if (deprecatedInvalidSegmentRegEx.exec(target.slice(2)) === null) {
        if (!isPathMap) this.log(`warning: target "${target}" has an empty path segment (deprecated, DEP0166)`);
      } else throw this.invalidTarget(match, target, internal);
    }
    const resolved = new URL(target, this.pjsonUrl);
    const packagePath = new URL('.', this.pjsonUrl).pathname;
    if (!resolved.pathname.startsWith(packagePath)) throw this.invalidTarget(match, target, internal);
    if (subpath === '') return { url: resolved };
    if (invalidSegmentRegEx.exec(subpath) !== null) {
      const request = pattern ? match.replace('*', () => subpath) : match + subpath;
      if (deprecatedInvalidSegmentRegEx.exec(subpath) === null) {
        if (!isPathMap) this.log(`warning: "${request}" has an empty path segment (deprecated, DEP0166)`);
      } else {
        throw new ResolveError('ERR_INVALID_MODULE_SPECIFIER', `"${request}" is not a valid match in pattern "${match}": ".", ".." and "node_modules" segments are refused`);
      }
    }
    if (pattern) return { url: new URL(resolved.href.replace(patternRegEx, () => subpath)) };
    return { url: new URL(subpath, resolved) };
  }

  // returns {url}|{external}, null (explicitly excluded), or undefined (no condition matched)
  target(target, subpath, match, pattern, internal, isPathMap, conditions) {
    if (typeof target === 'string') {
      const r = this.targetString(target, subpath, match, pattern, internal, isPathMap);
      this.log(`target "${target}"${this.where()}`);
      return r;
    } else if (Array.isArray(target)) {
      if (target.length === 0) { this.log(`empty array${this.where()}: excluded`); return null; }
      let lastException;
      for (let i = 0; i < target.length; i++) {
        let r;
        this.conds.push(`[${i}]`);
        try {
          r = this.target(target[i], subpath, match, pattern, internal, isPathMap, conditions);
        } catch (e) {
          lastException = e;
          if (e.code === 'ERR_INVALID_PACKAGE_TARGET') { this.log(`array item ${i} is invalid, Node tries the next one`); this.conds.pop(); continue; }
          this.conds.pop();
          throw e;
        }
        this.conds.pop();
        if (r === undefined) { this.log(`array item ${i}: no condition matched, next one`); continue; }
        if (r === null) { lastException = null; this.log(`array item ${i} is null, next one`); continue; }
        return r;
      }
      if (lastException == null) return lastException;
      throw lastException;
    } else if (typeof target === 'object' && target !== null) {
      const keys = Object.getOwnPropertyNames(target);
      for (const key of keys) {
        if (isArrayIndex(key)) throw new ResolveError('ERR_INVALID_PACKAGE_CONFIG', `"exports" cannot contain numeric property keys (found "${key}")`);
      }
      const skipped = [];
      for (const key of keys) {
        if (key === 'default' || conditions.has(key)) {
          if (skipped.length) this.log(`conditions skipped${this.where()}: ${skipped.join(', ')}`);
          skipped.length = 0;
          this.conds.push(key);
          const r = this.target(target[key], subpath, match, pattern, internal, isPathMap, conditions);
          this.conds.pop();
          if (r === undefined) { this.log(`condition "${key}" matched but nothing inside it did, Node goes on`); continue; }
          if (r && !r.conditions) r.conditions = [key].concat(r.conditions || []);
          else if (r) r.conditions = [key].concat(r.conditions);
          return r;
        }
        skipped.push(`"${key}"`);
      }
      if (skipped.length) this.log(`no active condition${this.where()} among ${skipped.join(', ')}`);
      return undefined;
    } else if (target === null) {
      this.log(`target is null${this.where()}: explicitly excluded`);
      return null;
    }
    throw this.invalidTarget(match, target, internal);
  }

  isSugar(exports) {
    if (typeof exports === 'string' || Array.isArray(exports)) return true;
    if (typeof exports !== 'object' || exports === null) return false;
    let isSugar = false, i = 0;
    for (const key of Object.getOwnPropertyNames(exports)) {
      const cur = key === '' || key[0] !== '.';
      if (i++ === 0) isSugar = cur;
      else if (isSugar !== cur) throw new ResolveError('ERR_INVALID_PACKAGE_CONFIG', '"exports" cannot contain some keys starting with "." and some not: use either subpath keys ("./x") or condition keys ("import", "require"…), not both');
    }
    return isSugar;
  }

  notExported(subpath) {
    return new ResolveError('ERR_PACKAGE_PATH_NOT_EXPORTED', subpath === '.' ? 'No "exports" main defined: the package has no entry point for its bare name under these conditions' : `Package subpath "${subpath}" is not defined by "exports"`);
  }

  exportsResolve(subpath, conditions) {
    let exports = this.cfg.exports;
    if (this.isSugar(exports)) { exports = { '.': exports }; }
    if (Object.prototype.hasOwnProperty.call(exports, subpath) && !subpath.includes('*') && !subpath.endsWith('/')) {
      this.log(`"exports" has the exact key "${subpath}"`);
      this.matched = subpath;
      const r = this.target(exports[subpath], '', subpath, false, false, false, conditions);
      if (r == null) throw this.notExported(subpath);
      return r;
    }
    const m = bestPatternMatch(exports, subpath);
    if (m) {
      if (subpath.endsWith('/')) this.log('warning: a pattern matched a request ending in "/" (deprecated, DEP0155)');
      this.log(`"exports" pattern "${m.key}" matches, * = "${m.sub}"`);
      this.matched = m.key; this.star = m.sub;
      const r = this.target(exports[m.key], m.sub, m.key, true, false, subpath.endsWith('/'), conditions);
      if (r == null) throw this.notExported(subpath);
      return r;
    }
    throw this.notExported(subpath);
  }

  importsResolve(name, conditions, mode) {
    if (name === '#' || name.startsWith('#/') || name.endsWith('/')) throw new ResolveError('ERR_INVALID_MODULE_SPECIFIER', `"${name}" is not a valid internal imports specifier name`);
    const imports = this.cfg.imports;
    const notDefined = () => new ResolveError('ERR_PACKAGE_IMPORT_NOT_DEFINED', `Package import specifier "${name}" is not defined in package.json "imports"`);
    if (imports) {
      if (Object.prototype.hasOwnProperty.call(imports, name) && !name.includes('*')) {
        this.log(`"imports" has the exact key "${name}"`);
        this.matched = name;
        const r = this.target(imports[name], '', name, false, true, false, conditions);
        if (r != null) return r;
      } else {
        const m = bestPatternMatch(imports, name);
        if (m) {
          this.log(`"imports" pattern "${m.key}" matches, * = "${m.sub}"`);
          this.matched = m.key; this.star = m.sub;
          const r = this.target(imports[m.key], m.sub, m.key, true, true, false, conditions);
          if (r != null) return r;
        }
      }
    }
    throw notDefined();
  }

  // ESM legacyMainResolve: main, main.js, main.json, main.node, main/index.{js,json,node}, then index.{js,json,node}
  legacyMain() {
    const exts = ['', '.js', '.json', '.node', '/index.js', '/index.json', '/index.node'];
    const tried = [];
    if (this.cfg.main !== undefined) {
      for (const e of exts) {
        const abs = path.posix.resolve(this.fs.base, this.cfg.main + e);
        tried.push(this.fs.display(abs));
        const st = this.fs.stat(abs);
        if (st === 0) { this.log(`"main": "${this.cfg.main}" → ${this.fs.display(abs)}` + (e ? ` (Node added "${e}"; deprecated for ES modules, DEP0151)` : '')); return { url: pathToFileURL(abs), via: 'main' }; }
        if (st === null) { this.log(`"main": "${this.cfg.main}" (existence not checked: give package_dir or files)`); return { url: pathToFileURL(path.posix.resolve(this.fs.base, this.cfg.main)), via: 'main', unchecked: true }; }
      }
    }
    for (const f of ['index.js', 'index.json', 'index.node']) {
      const abs = path.posix.resolve(this.fs.base, f);
      tried.push(this.fs.display(abs));
      const st = this.fs.stat(abs);
      if (st === 0) { this.log(`no usable "main": Node falls back to ${this.fs.display(abs)} (deprecated, DEP0151)`); return { url: pathToFileURL(abs), via: 'index' }; }
      if (st === null) { this.log('no "exports" and no "main": Node tries ./index.js (existence not checked)'); return { url: pathToFileURL(abs), via: 'index', unchecked: true }; }
    }
    throw new ResolveError('ERR_MODULE_NOT_FOUND', `Cannot find the package entry point: tried ${tried.join(', ')}`);
  }

  finalizeEsm(url) {
    if (encodedSepRegEx.exec(url.pathname) !== null) throw new ResolveError('ERR_INVALID_MODULE_SPECIFIER', `"${url.pathname}" must not include encoded "/" or "\\" characters`);
    const p = fileURLToPath(url);
    if (p.endsWith('/')) throw new ResolveError('ERR_UNSUPPORTED_DIR_IMPORT', `${this.fs.display(p)} ends with "/": ES modules cannot import a directory`);
    const st = this.fs.stat(p);
    if (st === null) return { path: p, exists: null };
    if (st === 1) throw new ResolveError('ERR_UNSUPPORTED_DIR_IMPORT', `${this.fs.display(p)} is a directory: ES modules cannot import a directory (no index.js lookup)`);
    if (st !== 0) throw new ResolveError('ERR_MODULE_NOT_FOUND', `${this.fs.display(p)} does not exist`);
    return { path: p, exists: true };
  }

  finalizeCjs(url) {
    if (encodedSepRegEx.exec(url.href) !== null) throw new ResolveError('ERR_INVALID_MODULE_SPECIFIER', `"${url.href}" must not include encoded "/" or "\\" characters`);
    const p = fileURLToPath(url);
    const st = this.fs.stat(p);
    if (st === null) return { path: p, exists: null };
    if (st !== 0) throw new ResolveError('MODULE_NOT_FOUND', st === 1 ? `${this.fs.display(p)} is a directory: with "exports", require() needs an exact file` : `${this.fs.display(p)} does not exist`);
    return { path: p, exists: true };
  }

  tryExt(base, exts) {
    for (const e of exts) { const st = this.fs.stat(base + e); if (st === 0) return base + e; if (st === null) return null; }
    return false;
  }

  // CommonJS without "exports": Module._findPath + tryPackage
  cjsLegacy(subpath) {
    const exts = ['.js', '.json', '.node'];
    const request = subpath === '.' ? '' : subpath.slice(2);
    const trailing = /(^|\/)\.{0,2}$/.test(request) || request.endsWith('/');
    const basePath = path.posix.resolve(this.fs.base, request);
    const rc = this.fs.stat(basePath);
    if (rc === null) { this.log('existence not checked (give package_dir or files): Node tries the file, then .js/.json/.node, then the folder'); return { path: basePath, exists: null }; }
    if (!trailing) {
      if (rc === 0) { this.log(`file ${this.fs.display(basePath)} exists`); return { path: basePath, exists: true }; }
      const f = this.tryExt(basePath, exts);
      if (f) { this.log(`Node added an extension: ${this.fs.display(f)}`); return { path: f, exists: true }; }
    }
    if (rc === 1) {
      const pj = path.posix.join(basePath, 'package.json');
      const sub = basePath === this.fs.base ? this.raw : this.fs.readJson(pj);
      const main = sub && typeof sub.main === 'string' && sub.main ? sub.main : null;
      if (!main) {
        const f = this.tryExt(path.posix.join(basePath, 'index'), exts);
        if (f) { this.log(`folder ${this.fs.display(basePath)}: no "main", Node uses ${this.fs.display(f)}`); return { path: f, exists: true }; }
      } else {
        const filename = path.posix.resolve(basePath, main);
        let actual = (this.fs.stat(filename) === 0 && filename) || this.tryExt(filename, exts) || this.tryExt(path.posix.join(filename, 'index'), exts);
        if (actual) { this.log(`folder ${this.fs.display(basePath)}: "main": "${main}" → ${this.fs.display(actual)}`); return { path: actual, exists: true }; }
        actual = this.tryExt(path.posix.join(basePath, 'index'), exts);
        if (!actual) throw new ResolveError('MODULE_NOT_FOUND', `"main": "${main}" points to nothing (${this.fs.display(filename)}) and there is no index.js`);
        this.log(`"main": "${main}" points to nothing: Node falls back to ${this.fs.display(actual)} (deprecated, DEP0128)`);
        return { path: actual, exists: true };
      }
    }
    throw new ResolveError('MODULE_NOT_FOUND', `Cannot find ${this.fs.display(basePath)} (tried the file, .js, .json, .node and the folder's index)`);
  }

  formatOf(abs) {
    const ext = path.posix.extname(abs);
    if (ext === '.mjs') return 'module';
    if (ext === '.cjs') return 'commonjs';
    if (ext === '.json') return 'json';
    if (ext === '.node') return 'addon';
    if (ext === '.wasm') return 'wasm (only with --experimental-wasm-modules)';
    if (ext === '.ts' || ext === '.mts' || ext === '.cts') return 'typescript (needs type stripping: Node 22.18+ or a loader)';
    // nearest package.json inside the package decides for .js and extensionless files
    let type = this.cfg.type, from = 'package.json';
    if (this.fs.root) {
      let dir = path.dirname(abs);
      while (dir.startsWith(this.fs.root) && dir !== this.fs.root) {
        const j = this.fs.readJson(path.join(dir, 'package.json'));
        if (j) { type = (j.type === 'module' || j.type === 'commonjs') ? j.type : 'none'; from = this.fs.display(path.join(dir, 'package.json')); break; }
        dir = path.dirname(dir);
      }
    }
    if (type === 'module') return `module ("type": "module" in ${from})`;
    if (type === 'commonjs') return `commonjs ("type": "commonjs" in ${from})`;
    return 'commonjs (no "type"; Node 22 switches to ES module if the file uses import/export syntax)';
  }
}

const DEFAULT = {
  import: ['node', 'import', 'module-sync', 'node-addons'],
  require: ['require', 'node', 'node-addons', 'module-sync']
};

function conditionSet(mode, opts) {
  if (Array.isArray(opts.conditions) && opts.conditions.length) return new Set(opts.conditions.map(String));
  const base = DEFAULT[mode].slice();
  for (const c of opts.extra_conditions || []) base.push(String(c));
  if (opts.no_addons) base.splice(base.indexOf('node-addons'), 1);
  return new Set(base);
}

// Split "pkg/sub", "@scope/pkg/sub", ".", "./sub", "#x" into {kind, name, subpath}
function parseSpecifier(spec, pkgName) {
  spec = String(spec).trim();
  if (spec === '' || spec === '.') return { kind: 'exports', subpath: '.' };
  if (spec[0] === '#') return { kind: 'imports', name: spec };
  if (spec.startsWith('./')) return { kind: 'exports', subpath: spec };
  if (spec.startsWith('node:') || BUILTINS.has(spec)) return { kind: 'builtin', name: spec };
  if (spec[0] === '/' || spec.startsWith('../')) throw new ResolveError('ERR_INVALID_MODULE_SPECIFIER', `"${spec}" is a file path, not a package specifier`);
  let sep = spec.indexOf('/'), valid = true;
  if (spec[0] === '@') { if (sep === -1 || sep === spec.length - 1) valid = false; else sep = spec.indexOf('/', sep + 1); }
  const name = sep === -1 ? spec : spec.slice(0, sep);
  if (name.startsWith('.') || name.includes('\\') || name.includes('%')) valid = false;
  if (!valid) throw new ResolveError('ERR_INVALID_MODULE_SPECIFIER', `"${spec}" is not a valid package name`);
  return { kind: 'exports', name, subpath: '.' + (sep === -1 ? '' : spec.slice(sep)) };
}

function resolveOne(pkgJson, spec, mode, opts) {
  opts = opts || {};
  const R = new Resolver(pkgJson, opts);
  const conditions = conditionSet(mode, opts);
  const out = { mode, conditions: [...conditions] };
  try {
    const s = parseSpecifier(spec);
    if (s.kind === 'builtin') { out.ok = true; out.builtin = s.name.startsWith('node:') ? s.name : 'node:' + s.name; out.trace = ['Node built-in module']; return out; }
    if (s.name && R.cfg.name && s.name !== R.cfg.name && !opts.ignore_name) out.note = `this package.json is named "${R.cfg.name}", not "${s.name}": resolved against it anyway`;
    out.subpath = s.subpath || s.name;
    let r;
    if (s.kind === 'imports') {
      if (mode === 'require' && !(R.raw && typeof R.raw === 'object' && (typeof R.raw.imports === 'string' || (typeof R.raw.imports === 'object' && R.raw.imports !== null)))) throw new ResolveError('MODULE_NOT_FOUND', `package.json has no "imports" field, so require("${s.name}") is looked up as a package name and fails`);
      out.via = 'imports';
      r = R.importsResolve(s.name, conditions, mode);
    } else if (R.cfg.exports != null) {
      out.via = 'exports';
      r = R.exportsResolve(s.subpath, conditions);
    } else if (mode === 'import') {
      if (s.subpath === '.') { out.via = 'main'; r = R.legacyMain(); if (r.via === 'index') out.via = 'index.js fallback'; }
      else { out.via = 'path (no "exports")'; R.log('no "exports": the subpath is a plain file path, without extension search (ES modules)'); r = { url: new URL(s.subpath, R.pjsonUrl) }; }
    } else {
      out.via = s.subpath === '.' ? 'main' : 'path (no "exports")';
      const f = R.cjsLegacy(s.subpath);
      out.ok = true; out.file = R.fs.display(f.path); out.exists = f.exists;
      if (R.fs.root) out.path = f.path;
      out.format = R.formatOf(f.path);
      out.trace = R.trace;
      return out;
    }
    if (out.via === 'exports' || out.via === 'imports') { out.matched_key = R.matched; if (R.star !== undefined) out.star = R.star; }
    if (r.conditions) out.condition_path = r.conditions.filter(c => c[0] !== '[');
    if (r.external !== undefined) {
      if (r.external === '') throw new ResolveError(mode === 'require' ? 'MODULE_NOT_FOUND' : 'ERR_MODULE_NOT_FOUND', 'the "imports" target is an empty string');
      out.external = r.external; out.trace = R.trace;
      if (BUILTINS.has(r.external) || r.external.startsWith('node:')) {
        if (mode === 'require') throw new ResolveError('ERR_INVALID_URL_SCHEME', `"imports" maps to the built-in module "${r.external}": import() accepts it, but require() fails in Node 22 (it expects a file URL). Use the file itself, or import()`);
        out.ok = true; out.builtin = r.external.startsWith('node:') ? r.external : 'node:' + r.external; return out; }
      if (!R.fs.root || (opts.depth || 0) > 5) { out.ok = true; out.exists = null; return out; }
      const ps = parseSpecifier(r.external);
      let dir = R.fs.root, found = null;
      for (;;) { const c = path.join(dir, 'node_modules', ps.name); if (fs.existsSync(path.join(c, 'package.json'))) { found = c; break; } const up = path.dirname(dir); if (up === dir) break; dir = up; }
      if (!found) throw new ResolveError(mode === 'require' ? 'MODULE_NOT_FOUND' : 'ERR_MODULE_NOT_FOUND', `Cannot find package "${ps.name}" in any node_modules above ${R.fs.root}`);
      let pj; try { pj = JSON.parse(fs.readFileSync(path.join(found, 'package.json'), 'utf8')); } catch (e) { pj = {}; }
      const sub = resolveOne(pj, r.external, mode, Object.assign({}, opts, { root: found, files: null, depth: (opts.depth || 0) + 1, ignore_name: true }));
      if (!sub.ok) { out.ok = false; out.error = sub.error; out.trace = R.trace.concat(sub.trace.map(t => `[${ps.name}] ` + t)); return out; }
      out.ok = true; out.path = sub.path; out.file = sub.path; out.exists = sub.exists; out.format = sub.format; out.trace = R.trace.concat(sub.trace.map(t => `[${ps.name}] ` + t));
      return out;
    }
    const f = mode === 'import' ? R.finalizeEsm(r.url) : R.finalizeCjs(r.url);
    out.ok = true; out.file = R.fs.display(f.path); out.exists = f.exists;
    if (R.fs.root) out.path = f.path;
    out.format = R.formatOf(f.path);
    if (mode === 'require' && /^module/.test(out.format)) out.warning = 'require() loads an ES module here: fine on Node 22.12+ and 20.19+ (require(esm)), but older Node throws ERR_REQUIRE_ESM, and it fails if the module uses top-level await';
  } catch (e) {
    if (!(e instanceof ResolveError)) throw e;
    out.ok = false;
    if (mode === 'require' && e.code === 'ERR_MODULE_NOT_FOUND') e.code = 'MODULE_NOT_FOUND';
    out.error = { code: e.code, message: e.message };
    if (R.matched !== undefined) out.matched_key = R.matched;
  }
  out.trace = R.trace;
  return out;
}

// Every public entry point of the package, and what import / require give for each, plus mistakes Node will not tell you about.
function listExports(pkgJson, opts) {
  opts = opts || {};
  const cfg = readConfig(pkgJson);
  const res = { name: cfg.name || null, type: cfg.type === 'none' ? 'commonjs (default)' : cfg.type, entries: [], imports: [], problems: [] };
  const P = res.problems;
  const R0 = new Resolver(pkgJson, opts);
  let exportsMap = null;
  if (cfg.exports == null) {
    res.has_exports = false;
    res.summary = 'No "exports": every file of the package can be imported by its path, and the bare name loads "main"' + (cfg.main ? ` ("${cfg.main}")` : ' (none set: index.js)') + '.';
    exportsMap = { '.': null };
  } else {
    res.has_exports = true;
    try { exportsMap = R0.isSugar(cfg.exports) ? { '.': cfg.exports } : cfg.exports; }
    catch (e) { P.push({ severity: 'error', where: 'exports', problem: e.message }); exportsMap = {}; }
  }
  const lintTarget = (t, where, internal) => {
    if (typeof t === 'string') {
      if (!t.startsWith('./') && !(internal && !t.startsWith('/') && !t.startsWith('../') && !URL.canParse(t)))
        P.push({ severity: 'error', where, problem: `target "${t}" must start with "./"`, fix: `"./${t.replace(/^\.?\/*/, '')}"` });
      else if (t.startsWith('./') && deprecatedInvalidSegmentRegEx.exec(t.slice(2))) P.push({ severity: 'error', where, problem: `target "${t}" contains ".", ".." or "node_modules": Node refuses it` });
    } else if (Array.isArray(t)) t.forEach((x, i) => lintTarget(x, `${where}[${i}]`, internal));
    else if (t && typeof t === 'object') {
      const keys = Object.getOwnPropertyNames(t);
      const di = keys.indexOf('default');
      if (di !== -1 && di < keys.length - 1) P.push({ severity: 'error', where, problem: `conditions after "default" are never used: ${keys.slice(di + 1).map(k => `"${k}"`).join(', ')}`, fix: 'put "default" last' });
      const ti = keys.indexOf('types');
      if (ti > 0) P.push({ severity: 'warning', where, problem: `"types" is not first: TypeScript stops at the first matching condition ("${keys[0]}") and may miss the types`, fix: 'put "types" first' });
      for (const k of keys) {
        if (k.startsWith('.')) P.push({ severity: 'error', where, problem: `key "${k}" inside a condition object: subpaths must be at the top of "exports"` });
        if (isArrayIndex(k)) P.push({ severity: 'error', where, problem: `numeric key "${k}": Node throws ERR_INVALID_PACKAGE_CONFIG` });
        lintTarget(t[k], `${where}.${k}`, internal);
      }
      if (keys.includes('import') && keys.includes('require') && typeof t.import === 'string' && t.import === t.require) P.push({ severity: 'info', where, problem: '"import" and "require" point to the same file' });
    }
  };
  const modes = opts.mode === 'import' ? ['import'] : opts.mode === 'require' ? ['require'] : ['import', 'require'];
  const keys = Object.getOwnPropertyNames(exportsMap);
  for (const key of keys) {
    if (res.has_exports) {
      if (key.endsWith('/') && !key.includes('*')) P.push({ severity: 'error', where: `exports["${key}"]`, problem: 'folder mappings ending in "/" were removed in Node 17: nothing matches this key', fix: `use a pattern: "${key}*"` });
      if (key.split('*').length > 2) P.push({ severity: 'error', where: `exports["${key}"]`, problem: 'more than one "*": Node ignores this key' });
      if (key !== '.' && !key.startsWith('./')) P.push({ severity: 'error', where: `exports["${key}"]`, problem: 'subpath keys must start with "./"' });
      lintTarget(exportsMap[key], `exports["${key}"]`, false);
    }
    const e = { subpath: key, specifier: (cfg.name || '<package>') + (key === '.' ? '' : key.slice(1)) };
    if (key.includes('*')) e.pattern = true;
    for (const m of modes) {
      if (key.includes('*') || (key.endsWith('/') && res.has_exports)) {
        const R = new Resolver(pkgJson, opts);
        try {
          const t = R.target(exportsMap[key], '*', key, true, false, false, conditionSet(m, opts));
          e[m] = t == null ? { ok: false, error: 'excluded or no matching condition' } : t.external ? { ok: true, external: t.external } : { ok: true, file: R.fs.display(decodeURIComponent(t.url.pathname)), condition_path: (t.conditions || []).filter(c => c[0] !== '[') };
          if (R.fs.root && t && t.url) {
            const matches = expandPattern(R, key, exportsMap[key], conditionSet(m, opts), m, pkgJson, opts);
            e[m].matching_files = matches.slice(0, 50); e[m].matching_count = matches.length;
          }
        } catch (err) { e[m] = { ok: false, error: err.code + ': ' + err.message }; }
      } else {
        const r = resolveOne(pkgJson, key === '.' ? '.' : key, m, opts);
        e[m] = r.ok ? { ok: true, file: r.file, exists: r.exists, condition_path: r.condition_path, format: r.format } : { ok: false, error: r.error.code + ': ' + r.error.message };
        if (r.ok && r.exists === false) P.push({ severity: 'error', where: `exports["${key}"]`, problem: `${m} resolves to ${r.file}, which does not exist` });
        if (!r.ok && /NOT_FOUND|DIR_IMPORT/.test(r.error.code)) P.push({ severity: 'error', where: res.has_exports ? `exports["${key}"]` : 'main', problem: `${m}("${e.specifier}") fails: ${r.error.message}` });
      }
    }
    if (e.import && e.require && e.import.ok && e.require.ok && e.import.file && e.import.file !== e.require.file) e.dual = 'import and require load different files (dual package: two copies of its state can coexist)';
    if (e.import && e.require && e.import.ok !== e.require.ok) e.only = e.import.ok ? 'import only (require fails)' : 'require only (import fails)';
    res.entries.push(e);
  }
  if (res.has_exports && !Object.prototype.hasOwnProperty.call(exportsMap, './package.json') && !keys.some(k => k.includes('*') && bestPatternMatch({ [k]: 1 }, './package.json')))
    P.push({ severity: 'info', where: 'exports', problem: '"./package.json" is not exported: require("' + (cfg.name || 'pkg') + '/package.json") fails (some tools read it)', fix: 'add "./package.json": "./package.json"' });
  if (res.has_exports && cfg.main && !Object.prototype.hasOwnProperty.call(exportsMap, '.')) P.push({ severity: 'warning', where: 'exports', problem: `"main" is set but "exports" has no "." entry: the bare name "${cfg.name || 'pkg'}" cannot be imported on Node 12.7+ ("main" is ignored once "exports" exists)` });
  if (cfg.imports) {
    for (const k of Object.getOwnPropertyNames(cfg.imports)) {
      if (!k.startsWith('#') || k === '#' || k.startsWith('#/')) P.push({ severity: 'error', where: `imports["${k}"]`, problem: 'imports keys must start with "#" followed by a name' });
      lintTarget(cfg.imports[k], `imports["${k}"]`, true);
      const ent = { key: k };
      if (!k.includes('*')) for (const m of modes) { const r = resolveOne(pkgJson, k, m, opts); ent[m] = r.ok ? (r.external ? { ok: true, external: r.external } : { ok: true, file: r.file, exists: r.exists }) : { ok: false, error: r.error.code + ': ' + r.error.message }; }
      res.imports.push(ent);
    }
  }
  if (res.has_exports) res.summary = `${res.entries.length} public entr${res.entries.length > 1 ? 'ies' : 'y'}` + (res.entries.some(e => e.pattern) ? ' (patterns included)' : '') + `; anything else is blocked (ERR_PACKAGE_PATH_NOT_EXPORTED). ${P.filter(p => p.severity === 'error').length} error(s), ${P.filter(p => p.severity === 'warning').length} warning(s).`;
  return res;
}

// For a pattern key, the real files it exposes (folder mode only).
function expandPattern(R, key, target, conds, mode) {
  const out = [];
  const walk = (dir, rel) => {
    let ents; try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return; }
    for (const d of ents) {
      if (d.name === 'node_modules' || d.name === '.git') continue;
      const r = rel ? rel + '/' + d.name : d.name;
      if (d.isDirectory()) { if (out.length < 5000) walk(path.join(dir, d.name), r); }
      else out.push(r);
    }
  };
  walk(R.fs.root, '');
  const pi = key.indexOf('*'); const pre = key.slice(0, pi), post = key.slice(pi + 1);
  const t0 = new Resolver(R.raw, { root: R.fs.root }).target(target, '\u0000', key, true, false, false, conds);
  if (!t0 || !t0.url) return [];
  const tpl = R.fs.display(decodeURIComponent(t0.url.pathname)).slice(2);
  const parts = tpl.split('\u0000');
  if (parts.length < 2) return [];
  const res = [];
  for (const f of out) {
    if (!f.startsWith(parts[0]) || !f.endsWith(parts[parts.length - 1]) || f.length < parts[0].length + parts[parts.length - 1].length) continue;
    const star = f.slice(parts[0].length, f.length - parts[parts.length - 1].length);
    if (parts.length > 2 && parts.join(star) !== f) continue;
    const spec = pre + star + post;
    const r = resolveOne(R.raw, spec, mode, { root: R.fs.root });
    if (r.ok && r.file === './' + f) res.push(spec);
  }
  return res;
}

module.exports = { resolveOne, listExports, parseSpecifier, readConfig, DEFAULT, ResolveError };
