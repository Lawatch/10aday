'use strict';
// npm-why engine: rebuilds the dependency tree of a package-lock.json (v2/v3) the way npm 10 does
// (@npmcli/arborist 8 "loadVirtual": nodes from the lockfile, edges from each package's dependency fields,
// node_modules resolution walking up the tree) and answers "why is this package installed?" like `npm explain`.
// Edge validity uses npm's own code (dep-valid.js + semver + npm-package-arg, bundled unmodified in depvalid.js).
const path = require('path');
const { depValid, semver, npa } = require('./depvalid.js');

const ROOT_PATH = '/__project__';

function nameFromLocation(loc) {
  const i = loc.lastIndexOf('node_modules/');
  if (i < 0) return loc.split('/').pop();
  return loc.slice(i + 'node_modules/'.length);
}

function parentLocation(loc) {
  // node at X/node_modules/name (name may be @scope/name) -> X ('' = root)
  const i = loc.lastIndexOf('node_modules/');
  if (i < 0) return null;
  return i === 0 ? '' : loc.slice(0, i - 1);
}

class Tree {
  constructor(lock, packageJson) {
    if (typeof lock === 'string') lock = JSON.parse(lock);
    if (!lock || typeof lock !== 'object') throw new Error('lockfile is not a JSON object');
    const v = lock.lockfileVersion;
    if (!lock.packages || typeof lock.packages !== 'object') {
      throw new Error(v === 1 || lock.dependencies
        ? 'lockfileVersion 1 (npm 6 and older) is not supported: run `npm install --package-lock-only` once with npm 7+ to upgrade the lockfile.'
        : 'not a package-lock.json / npm-shrinkwrap.json: no "packages" section');
    }
    this.lockfileVersion = v;
    this.warnings = [];
    this.nodes = new Map();
    const rootPkg = Object.assign({}, lock.packages[''] || {}, packageJson || {});
    if (!rootPkg.name && lock.name) rootPkg.name = lock.name;
    if (!rootPkg.version && lock.version) rootPkg.version = lock.version;
    const root = this.root = this.makeNode('', rootPkg);
    root.isRoot = true;
    for (const [loc, entry] of Object.entries(lock.packages)) {
      if (loc === '' || !entry || typeof entry !== 'object') continue;
      this.makeNode(loc, entry);
    }
    // links -> targets
    for (const n of this.nodes.values()) {
      if (!n.isLink) continue;
      const t = this.nodes.get(n.entry.resolved) || null;
      n.target = t;
      if (t) t.linksIn.push(n);
    }
    // parents / fsParents
    for (const n of this.nodes.values()) {
      if (n.isRoot) continue;
      const p = parentLocation(n.location);
      if (p !== null && this.nodes.has(p) && !this.nodes.get(p).isLink) n.parent = this.nodes.get(p);
      else if (p !== null) n.parent = null; // orphan under a missing folder
      if (!n.parent) {
        // fsParent: nearest ancestor folder that is a node
        let dir = n.location;
        n.fsParent = null;
        while (dir.includes('/')) {
          dir = dir.slice(0, dir.lastIndexOf('/'));
          const cand = this.nodes.get(dir);
          if (cand && !cand.isLink) { n.fsParent = cand; break; }
        }
        if (!n.fsParent) n.fsParent = root;
      }
    }
    // workspaces: same as @npmcli/map-workspaces "virtual": patterns of the lockfile root entry, matched against
    // lockfile keys outside node_modules
    const ws = new Map();
    const pats = workspacePatterns((lock.packages[''] || {}).workspaces);
    if (pats.pos.length) {
      const keys = Object.keys(lock.packages).filter(k => k && !/(^|\/)node_modules(\/|$)/.test(k) && !pats.neg.some(re => re.test(k)));
      for (const re of pats.pos) for (const k of keys) if (re.test(k)) ws.set((lock.packages[k] && lock.packages[k].name) || k.split('/').pop(), k);
    }
    this.workspaces = ws;
    for (const t of ws.values()) { const tn = this.nodes.get(t); if (tn) tn.isWorkspace = true; }
    this.overrideRoot = null;
    if (rootPkg.overrides && typeof rootPkg.overrides === 'object' && Object.keys(rootPkg.overrides).length) {
      try { this.overrideRoot = new OverrideSet({ overrides: rootPkg.overrides }); }
      catch (err) { this.warnings.push('package.json "overrides" could not be read: ' + err.message); }
    }
    // edges
    for (const n of this.nodes.values()) if (!n.isLink) this.loadEdges(n);
    if (ws.size) for (const [name, t] of ws) this.addEdge(root, name, 'file:' + t, 'workspace', true);
    if (this.overrideRoot) this.simulateOverrides(lock);
    for (const n of this.nodes.values()) for (const e of n.edgesOut.values()) this.resolveEdge(e);
  }

  // Which override set each edge ends up with depends on the order in which npm's loadVirtual adds the nodes
  // (lockfile order): an edge that resolves to a newly added node hands it its set (Node#addEdgeIn), a node with
  // no set takes its parent's rule (getNodeRule), then its own edges are created with that set. Replayed here.
  simulateOverrides(lock) {
    const root = this.root, O = this.overrideRoot;
    root.overrides = O;
    const inserted = new Set([root]);
    const kids = new Map([[root, []]]);
    const resolveNow = (n, name) => {
      for (let cur = n; cur; cur = cur.parent || cur.fsParent) {
        const c = this.nodes.get(cur.location ? cur.location + '/node_modules/' + name : 'node_modules/' + name);
        if (c && inserted.has(c)) return c;
        if (cur.isRoot) break;
      }
      return null;
    };
    const setEdge = e => { e.overrides = e.from.overrides ? e.from.overrides.getEdgeRule(e) : null; };
    for (const e of root.edgesOut.values()) { setEdge(e); e.simTo = null; }
    const reloadNamed = (start, name) => {
      const stack = [start];
      while (stack.length) {
        const cur = stack.shift();
        const e = cur.edgesOut.get(name);
        if (e && e.simCreated) {
          const now = resolveNow(cur, name);
          if (now !== e.simTo) {
            setEdge(e);
            e.simTo = now;
            if (now && e.overrides) now.overrides = e.overrides;
          }
        }
        for (const k of kids.get(cur) || []) stack.push(k);
      }
    };
    for (const e of root.edgesOut.values()) e.simCreated = true;
    for (const loc of Object.keys(lock.packages)) {
      const n = this.nodes.get(loc);
      if (!n || n.isRoot || n.isLink || inserted.has(n)) continue;
      const holder = n.parent || n.fsParent || root;
      inserted.add(n);
      if (!kids.has(holder)) kids.set(holder, []);
      kids.get(holder).push(n);
      kids.set(n, kids.get(n) || []);
      n.overrides = null;
      if (n.parent) reloadNamed(n.parent, n.name);
      if (!n.overrides && n.parent && n.parent.overrides) n.overrides = n.parent.overrides.getNodeRule(n);
      for (const e of n.edgesOut.values()) {
        setEdge(e);
        e.simCreated = true;
        e.simTo = resolveNow(n, e.name);
        if (e.simTo && e.overrides) e.simTo.overrides = e.overrides;
      }
    }
    for (const n of this.nodes.values()) for (const e of n.edgesOut.values()) this.applyOverride(e, true);
  }

  makeNode(loc, entry) {
    const n = {
      location: loc, entry, package: entry, isLink: !!entry.link, isRoot: false,
      name: loc === '' ? (entry.name || '') : nameFromLocation(loc),
      parent: null, fsParent: null, target: null, linksIn: [],
      edgesOut: new Map(), edgesIn: [], errors: [], isWorkspace: false,
      dev: !!entry.dev, optional: !!entry.optional, devOptional: !!(entry.devOptional || entry.dev || entry.optional), peer: !!entry.peer,
      inBundle: !!entry.inBundle, hasShrinkwrap: !!entry.hasShrinkwrap, extraneous: !!entry.extraneous
    };
    n.version = entry.version;
    n.resolved = entry.resolved || null;
    this.nodes.set(loc, n);
    return n;
  }

  get packageNameOf() { return n => (n.package && n.package.name) || n.name; }

  isTop(n) { return n.isRoot || !n.parent; }

  realpath(n) {
    const loc = n.isLink ? n.entry.resolved : n.location;
    return loc ? path.posix.join(ROOT_PATH, loc) : ROOT_PATH;
  }

  loadEdges(n) {
    const p = n.package;
    const pd = p.peerDependencies;
    if (pd && typeof pd === 'object') {
      const pm = p.peerDependenciesMeta || {};
      for (const [name, spec] of Object.entries(pd)) this.addEdge(n, name, spec, pm[name] && pm[name].optional ? 'peerOptional' : 'peer');
    }
    for (const [name, spec] of Object.entries(p.dependencies || {})) this.addEdge(n, name, spec, 'prod');
    for (const [name, spec] of Object.entries(p.optionalDependencies || {})) this.addEdge(n, name, spec, 'optional');
    if (this.isTop(n)) for (const [name, spec] of Object.entries(p.devDependencies || {})) this.addEdge(n, name, spec, 'dev');
  }

  addEdge(from, name, spec, type, force) {
    const cur = from.edgesOut.get(name);
    if (cur && cur.type === 'workspace' && !force) return;
    const ad = from.package && from.package.acceptDependencies;
    const e = { from, name, rawSpec: spec, spec, type, accept: ad && typeof ad === 'object' ? ad[name] : undefined, to: null, error: null, overridden: false, overrides: null };
    from.edgesOut.set(name, e);
  }

  applyOverride(e) {
    e.spec = e.rawSpec;
    const o = e.overrides;
    if (o && o.value && o.value !== '*' && o.name === e.name) {
      let val = o.value;
      if (val.startsWith('$')) {
        const ref = val.slice(1), rp = this.root.package;
        val = (rp.devDependencies && rp.devDependencies[ref]) || (rp.optionalDependencies && rp.optionalDependencies[ref]) ||
          (rp.dependencies && rp.dependencies[ref]) || (rp.peerDependencies && rp.peerDependencies[ref]);
        if (!val) { this.warnings.push(`override ${o.value} for ${e.name} points to nothing in package.json`); val = e.rawSpec; }
      }
      e.spec = val;
    }
    e.overridden = e.spec !== e.rawSpec;
  }

  resolve(n, name) {
    for (let cur = n; cur; cur = cur.parent || cur.fsParent) {
      const loc = cur.location ? cur.location + '/node_modules/' + name : 'node_modules/' + name;
      const c = this.nodes.get(loc);
      if (c) return c;
      if (cur.isRoot) break;
    }
    return null;
  }

  resolveEdge(e) {
    const to = this.resolve(e.from, e.name);
    e.to = to;
    if (to) to.edgesIn.push(e);
    const optional = e.type === 'optional' || e.type === 'peerOptional';
    const peer = e.type === 'peer' || e.type === 'peerOptional';
    if (!to) e.error = optional ? null : 'MISSING';
    else if (peer && e.from === to.parent && !this.isTop(e.from)) e.error = 'PEER LOCAL';
    else if (!this.satisfiedBy(e, to)) e.error = 'INVALID';
    else e.error = null;
  }

  satisfiedBy(e, node) {
    if (node.name !== e.name) return false;
    const spec = (node.hasShrinkwrap || node.inBundle) ? e.rawSpec : e.spec;
    const tgt = node.isLink ? node.target : null;
    const child = {
      name: node.name, isLink: node.isLink, isWorkspace: tgt ? tgt.isWorkspace : node.isWorkspace,
      version: tgt ? tgt.version : node.version,
      package: tgt ? tgt.package : node.package,
      resolved: node.isLink ? (tgt ? tgt.resolved : null) : node.resolved,
      realpath: this.realpath(node)
    };
    const from = e.from;
    const requestor = {
      errors: from.errors, realpath: this.realpath(from), resolved: from.resolved, installLinks: false,
      root: { realpath: ROOT_PATH }, sourceReference: null,
      edgesOut: new Map([[e.name, { name: e.name, overrides: e.overrides && !e.overrides.isRoot ? { name: e.overrides.name, value: e.overrides.value } : null }]])
    };
    try { return depValid(child, spec, e.accept, requestor); } catch (err) { return false; }
  }

  // like Arborist Node#explain: dependents through valid edges (all edges from the root), cycles cut
  explain(n, seen = []) {
    if (n.isRoot) return { location: '' };
    const why = { name: this.isTop(n) ? this.packageNameOf(n) : n.name, version: n.isLink && n.target ? n.target.version : n.version };
    if (seen.includes(n)) return why;
    why.location = n.location;
    why.isWorkspace = n.isLink && n.target ? n.target.isWorkspace : n.isWorkspace;
    seen = seen.concat(n);
    why.dependents = [];
    for (const e of n.edgesIn) {
      if (e.error && !e.from.isRoot) continue;
      why.dependents.push(this.explainEdge(e, seen));
    }
    const links = n.linksIn;
    if (links.length) why.linksIn = links.map(l => this.explain(l, seen));
    return why;
  }

  explainEdge(e, seen) {
    const x = { type: e.type, name: e.name, spec: e.spec };
    if (e.rawSpec !== e.spec) { x.rawSpec = e.rawSpec; x.overridden = true; }
    if (e.from.package && Array.isArray(e.from.package.bundleDependencies) && e.from.package.bundleDependencies.includes(e.name)) x.bundled = true;
    if (e.error) x.error = e.error;
    x.from = this.explain(e.from, seen);
    return x;
  }

  // nodes that are "this package": real nodes whose package name (or install name) matches
  find(name) {
    const out = [];
    for (const n of this.nodes.values()) {
      if (n.isRoot) continue;
      const pkgName = (n.package && n.package.name) || n.name;
      if (n.isLink) continue; // reported through its target (linksIn)
      if (n.name === name || pkgName === name) out.push(n);
    }
    return out;
  }
}


// Port of @npmcli/arborist 8.0.5 lib/override-set.js (the parts loadVirtual uses)
class OverrideSet {
  constructor({ overrides, key, parent }) {
    this.parent = parent;
    this.children = new Map();
    if (typeof overrides === 'string') overrides = { '.': overrides };
    if (overrides['.'] === '') overrides['.'] = '*';
    if (parent) {
      const spec = npa(key);
      if (!spec.name) throw new Error(`Override without name: ${key}`);
      this.name = spec.name;
      spec.name = '';
      this.key = key;
      this.keySpec = spec.toString();
      this.value = overrides['.'] || this.keySpec;
    }
    for (const [k, child] of Object.entries(overrides)) {
      if (k === '.') continue;
      const c = new OverrideSet({ parent: this, key: k, overrides: child });
      this.children.set(c.key, c);
    }
  }
  get isRoot() { return !this.parent; }
  *ancestry() { for (let a = this; a; a = a.parent) yield a; }
  get ruleset() {
    const r = new Map();
    for (const o of this.ancestry()) {
      for (const kid of o.children.values()) if (!r.has(kid.key)) r.set(kid.key, kid);
      if (!o.isRoot && !r.has(o.key)) r.set(o.key, o);
    }
    return r;
  }
  getEdgeRule(edge) {
    for (const rule of this.ruleset.values()) {
      if (rule.name !== edge.name) continue;
      if (rule.keySpec === '*') return rule;
      let spec;
      try { spec = npa(`${edge.name}@${edge.rawSpec}`); } catch (e) { continue; }
      if (spec.type === 'alias') spec = spec.subSpec;
      if (spec.type === 'git') { if (spec.gitRange && semver.intersects(spec.gitRange, rule.keySpec)) return rule; continue; }
      if (spec.type === 'range' || spec.type === 'version') { if (semver.intersects(spec.fetchSpec, rule.keySpec)) return rule; continue; }
      return rule;
    }
    return this;
  }
  getNodeRule(node) {
    for (const rule of this.ruleset.values()) {
      if (rule.name !== node.name) continue;
      if (semver.satisfies(node.version, rule.keySpec) || semver.satisfies(node.version, rule.value)) return rule;
    }
    return this;
  }
}

function workspacePatterns(field) {
  const list = Array.isArray(field) ? field : (field && Array.isArray(field.packages) ? field.packages : []);
  const pos = [], neg = [];
  for (let p of list) {
    if (typeof p !== 'string') continue;
    const isNeg = p.startsWith('!');
    p = p.replace(/^!+/, '').replace(/^\.\//, '').replace(/\/+$/, '');
    (isNeg ? neg : pos).push(globToRegExp(p));
  }
  return { pos, neg };
}

function globToRegExp(pat) {
  let re = '';
  const segs = pat.split('/');
  segs.forEach((seg, i) => {
    if (seg === '**') { re += i === segs.length - 1 ? '(?:[^/]+(?:/[^/]+)*)?' : '(?:[^/]+/)*'; return; }
    re += seg.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]*').replace(/\?/g, '[^/]') + (i < segs.length - 1 ? '/' : '');
  });
  return new RegExp('^' + re + '$');
}

// ---------- answers ----------

function label(n, tree) {
  if (!n || n.isRoot) return 'your project';
  const nm = tree.isTop(n) ? tree.packageNameOf(n) : n.name;
  const v = n.isLink && n.target ? n.target.version : n.version;
  const pn = n.package && n.package.name && n.package.name !== n.name && !tree.isTop(n) ? ` (alias of ${n.package.name})` : '';
  return `${nm}${v ? '@' + v : ''}${pn}`;
}

// all chains root -> ... -> node, following the same edges as `npm explain`, shortest first
function chains(tree, node, limit) {
  const res = [];
  const total = { count: 0 };
  function walk(n, suffix, seen) {
    if (res.length >= limit * 20 || total.count > 20000) return;
    total.count++;
    const ins = n.edgesIn.filter(e => !e.error || e.from.isRoot);
    const viaLinks = n.linksIn.length ? n.linksIn.flatMap(l => l.edgesIn.filter(e => !e.error || e.from.isRoot)) : [];
    const all = ins.concat(viaLinks);
    if (!all.length && !n.isRoot) { res.push({ steps: suffix, complete: false }); return; }
    for (const e of all) {
      const step = { from: e.from, type: e.type, spec: e.spec };
      if (e.from.isRoot) { res.push({ steps: [step].concat(suffix), complete: true }); continue; }
      if (seen.has(e.from)) continue;
      const s2 = new Set(seen); s2.add(e.from);
      walk(e.from, [step].concat(suffix), s2);
    }
  }
  walk(node, [], new Set([node]));
  res.sort((a, b) => (b.complete - a.complete) || a.steps.length - b.steps.length);
  const seenTxt = new Set(), out = [];
  for (const c of res) {
    const parts = ['your project'];
    for (let i = 0; i < c.steps.length; i++) {
      const s = c.steps[i];
      const target = i + 1 < c.steps.length ? c.steps[i + 1].from : node;
      parts.push(`${s.type === 'prod' ? '' : s.type + ' '}${s.spec} → ${label(target, tree)}`);
    }
    if (!c.complete) parts[0] = '(nothing in the tree depends on it)';
    const txt = parts.join(' › ');
    if (seenTxt.has(txt)) continue;
    seenTxt.add(txt); out.push({ text: txt, length: c.steps.length, complete: c.complete,
      top_level: c.steps.length ? (c.steps.length > 1 ? label(c.steps[1].from, tree) : label(node, tree)) : null,
      top_level_type: c.steps.length ? c.steps[0].type : null });
    if (out.length >= limit) break;
  }
  const tops = new Set();
  for (const c of res) if (c.complete && c.steps.length) tops.add(c.steps.length > 1 ? label(c.steps[1].from, tree) : label(node, tree));
  return { chains: out, truncated: res.length > out.length, tops: [...tops] };
}

function flagsOf(n) {
  const t = n.isLink && n.target ? n.target : n;
  const f = [];
  if (t.dev) f.push('dev'); if (t.optional) f.push('optional'); if (t.devOptional && !t.dev && !t.optional) f.push('devOptional');
  if (t.peer) f.push('peer'); if (t.inBundle) f.push('bundled'); if (t.extraneous) f.push('extraneous');
  return f;
}

function kindText(f) {
  if (f.includes('dev')) return 'only needed for development (skipped by npm install --omit=dev)';
  if (f.includes('optional')) return 'optional (install continues if it fails)';
  if (f.includes('devOptional')) return 'needed by dev and optional dependencies only';
  if (f.includes('peer')) return 'installed as a peer dependency';
  return 'installed in production';
}

function why(tree, name, opts = {}) {
  const limit = Math.max(1, Math.min(opts.max_paths || 5, 50));
  let nodes = tree.find(name);
  let range = opts.version || null;
  if (range && !semver.validRange(range, true)) throw new Error('version is not a valid semver version or range: ' + range);
  const all = nodes.slice();
  if (range) nodes = nodes.filter(n => n.version && semver.satisfies(n.version, range, { loose: true, includePrerelease: true }));
  nodes.sort((a, b) => a.location.split('node_modules').length - b.location.split('node_modules').length || a.location.localeCompare(b.location));
  const installed = nodes.map(n => {
    const f = flagsOf(n);
    const ex = chains(tree, n, limit);
    const direct = n.edgesIn.concat(n.linksIn.flatMap(l => l.edgesIn)).filter(e => e.from.isRoot);
    const dependents = n.edgesIn.concat(n.linksIn.flatMap(l => l.edgesIn)).filter(e => !e.error || e.from.isRoot).map(e => ({
      package: label(e.from, tree), location: e.from.location, type: e.type, spec: e.spec,
      ...(e.overridden ? { original_spec: e.rawSpec, overridden: true } : {}), ...(e.error ? { error: e.error } : {})
    }));
    return {
      version: n.version, location: n.location,
      ...(n.package && n.package.name && n.package.name !== n.name ? { real_name: n.package.name } : {}),
      kind: f, kind_text: kindText(f), direct_dependency: direct.length > 0,
      ...(n.linksIn.length ? { linked_from: n.linksIn.map(l => l.location) } : {}),
      ...(n.isWorkspace ? { workspace: true } : {}),
      dependents, dependents_count: dependents.length,
      paths: ex.chains.map(c => c.text), paths_truncated: ex.truncated,
      top_level_dependencies: ex.tops
    };
  });
  const versions = [...new Set(nodes.map(n => n.version))];
  let summary;
  if (!all.length) {
    const close = suggestions(tree, name);
    summary = `${name} is not in this lockfile.` + (close.length ? ` Did you mean: ${close.join(', ')}?` : '');
  } else if (!nodes.length) {
    summary = `${name} is installed (${[...new Set(all.map(n => n.version))].join(', ')}) but no copy matches ${range}.`;
  } else {
    summary = `${name}${range ? ' ' + range : ''}: ${nodes.length} cop${nodes.length > 1 ? 'ies' : 'y'} in node_modules, version${versions.length > 1 ? 's' : ''} ${versions.join(', ')}.` +
      (installed.some(i => i.direct_dependency) ? ' Your package.json asks for it directly.' : ' Only pulled in by other packages: ' + [...new Set(installed.flatMap(i => i.top_level_dependencies))].slice(0, 8).join(', ') + '.');
  }
  return {
    package: name, ...(range ? { version_filter: range } : {}), found: nodes.length > 0, summary,
    installed_versions: versions, copies: installed.length, installed,
    ...(range && all.length !== nodes.length ? { other_versions_not_matching: [...new Set(all.filter(n => !nodes.includes(n)).map(n => n.version))] } : {}),
    ...(tree.warnings.length ? { warnings: tree.warnings } : {})
  };
}

function suggestions(tree, name) {
  const names = new Set();
  for (const n of tree.nodes.values()) if (!n.isRoot && !n.isLink) names.add(n.name);
  const low = name.toLowerCase();
  const scored = [];
  for (const nm of names) {
    const d = lev(low, nm.toLowerCase());
    if (d <= 2 || nm.toLowerCase().includes(low) && low.length >= 3) scored.push([d, nm]);
  }
  return scored.sort((a, b) => a[0] - b[0] || a[1].localeCompare(b[1])).slice(0, 5).map(x => x[1]);
}

function lev(a, b) {
  if (Math.abs(a.length - b.length) > 3) return 9;
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[a.length][b.length];
}

function duplicates(tree, opts = {}) {
  const by = new Map();
  for (const n of tree.nodes.values()) {
    if (n.isRoot || n.isLink) continue;
    const nm = (n.package && n.package.name) || n.name;
    if (!by.has(nm)) by.set(nm, []);
    by.get(nm).push(n);
  }
  const res = [];
  for (const [nm, list] of by) {
    const versions = [...new Set(list.map(n => n.version))];
    if (versions.length < 2) continue;
    const perVersion = versions.sort((a, b) => (semver.valid(a) && semver.valid(b)) ? semver.rcompare(a, b) : String(b).localeCompare(String(a))).map(v => {
      const ns = list.filter(n => n.version === v);
      const req = new Set();
      for (const n of ns) for (const e of n.edgesIn) if (!e.error || e.from.isRoot) req.add(`${label(e.from, tree)} wants ${e.spec}`);
      return { version: v, copies: ns.length, locations: ns.map(n => n.location).slice(0, 10), required_by: [...req].slice(0, 10), required_by_count: req.size };
    });
    res.push({ package: nm, versions: perVersion.length, copies: list.length, by_version: perVersion });
  }
  res.sort((a, b) => b.versions - a.versions || b.copies - a.copies || a.package.localeCompare(b.package));
  const limit = Math.max(1, Math.min(opts.limit || 30, 500));
  let total = 0;
  for (const n of tree.nodes.values()) if (!n.isRoot && !n.isLink) total++;
  return {
    packages_in_lockfile: total, duplicated_packages: res.length,
    extra_copies: res.reduce((s, r) => s + r.copies - 1, 0),
    summary: res.length ? `${res.length} packages are installed in more than one version (${res.reduce((s, r) => s + r.copies - 1, 0)} extra copies). Worst: ${res.slice(0, 5).map(r => `${r.package} (${r.by_version.map(v => v.version).join(', ')})`).join('; ')}.` : 'No package is installed in more than one version.',
    duplicates: res.slice(0, limit), truncated: res.length > limit
  };
}

module.exports = { Tree, why, duplicates, semver, npa };
