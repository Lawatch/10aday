/* Poetry → PEP 621 converter (10aday, EXP-004). Built by AI agents.
 * Translates Poetry version constraints (^, ~, ~=, *, ||, …) and
 * [tool.poetry.*dependencies] tables into PEP 440 / PEP 508 strings for
 * [project] (PEP 621) and [dependency-groups] (PEP 735).
 * Tested against poetry-core + packaging (see oracle/). */
(function (root) {
  'use strict';

  // ---------- PEP 440 version parsing / normalisation ----------
  var VRE = /^\s*v?(?:(\d+)!)?(\d+(?:\.\d+)*)(?:[-_.]?(alpha|a|beta|b|preview|pre|c|rc)[-_.]?(\d+)?)?(?:-(\d+)|[-_.]?(post|rev|r)[-_.]?(\d+)?)?(?:[-_.]?(dev)[-_.]?(\d+)?)?(?:\+([a-z0-9]+(?:[-_.][a-z0-9]+)*))?\s*$/i;
  var PRE = { alpha: 'a', a: 'a', beta: 'b', b: 'b', c: 'rc', pre: 'rc', preview: 'rc', rc: 'rc' };
  function parseVersion(s) {
    var m = VRE.exec(s);
    if (!m) return null;
    var v = {
      epoch: m[1] ? parseInt(m[1], 10) : 0,
      release: m[2].split('.').map(function (x) { return x.replace(/^0+(?=\d)/, ''); }),
      pre: m[3] ? [PRE[m[3].toLowerCase()], m[4] ? String(+m[4]) : '0'] : null,
      post: m[5] !== undefined ? String(+m[5]) : (m[6] ? (m[7] ? String(+m[7]) : '0') : null),
      dev: m[8] ? (m[9] ? String(+m[9]) : '0') : null,
      local: m[10] ? m[10].toLowerCase().replace(/[-_]/g, '.') : null
    };
    return v;
  }
  function vstr(v) {
    var s = (v.epoch ? v.epoch + '!' : '') + v.release.join('.');
    if (v.pre) s += v.pre[0] + v.pre[1];
    if (v.post !== null) s += '.post' + v.post;
    if (v.dev !== null) s += '.dev' + v.dev;
    if (v.local) s += '+' + v.local;
    return s;
  }
  function inc(x) { // decimal string + 1
    var d = x.split(''), i = d.length - 1;
    while (i >= 0) { if (d[i] === '9') { d[i] = '0'; i--; } else { d[i] = String(+d[i] + 1); break; } }
    if (i < 0) d.unshift('1');
    return d.join('');
  }
  function stable(v) { return { epoch: v.epoch, release: v.release.slice(), pre: null, post: v.pre ? null : v.post, dev: null, local: null }; }
  function bump(v, idx) { // bump release segment idx (0=major), zero the rest, keep precision (min idx+1)
    var r = v.release.slice();
    while (r.length <= idx) r.push('0');
    r[idx] = inc(r[idx]);
    for (var i = idx + 1; i < r.length; i++) r[i] = '0';
    return { epoch: v.epoch, release: r, pre: null, post: null, dev: null, local: null };
  }

  var LOCALNOTE = 'PEP 440 forbids a local label (`+…`) in an ordered comparison; it was dropped.';
  function nolocal(v) { var w = Object.assign({}, v); w.local = null; return w; }
  function err(msg) { var e = new Error(msg); e.p2p = true; throw e; }

  // ---------- one Poetry atom → array of PEP 440 clauses ----------
  // Returns { clauses: [...], note?: string }
  function atom(c) {
    var raw = c;
    if (/^v?[xX*](\.[xX*])*$/i.test(c)) return { clauses: [] };
    var m, v;
    if ((m = /^~(?!=)\s*(.+)$/.exec(c))) {
      v = parseVersion(m[1]); if (!v) err('Could not parse version constraint: ' + raw);
      var hi = bump(stable(v), v.release.length === 1 ? 0 : 1);
      return { clauses: ['>=' + vstr(nolocal(v)), '<' + vstr(hi)], kind: 'tilde', note: v.local ? LOCALNOTE : undefined };
    }
    if ((m = /^~=\s*(.+)$/.exec(c))) {
      v = parseVersion(m[1]); if (!v) err('Could not parse version constraint: ' + raw);
      if (v.release.length >= 2) return { clauses: ['~=' + vstr(nolocal(v))], kind: 'compat', note: v.local ? LOCALNOTE : undefined };
      return { clauses: ['>=' + vstr(nolocal(v)), '<' + vstr(bump(stable(v), 0))], kind: 'compat1',
        note: '`~=' + m[1] + '` has a single segment: Poetry accepts it, but PEP 440 rejects `~=` with one segment (pip errors out), so it was expanded.' };
    }
    if ((m = /^\^\s*(.+)$/.exec(c))) {
      v = parseVersion(m[1]); if (!v) err('Could not parse version constraint: ' + raw);
      var r = v.release, idx;
      if (+r[0] > 0 || r.length === 1) idx = 0;
      else if (+r[1] > 0 || r.length === 2) idx = 1;
      else idx = 2;
      return { clauses: ['>=' + vstr(nolocal(v)), '<' + vstr(bump(stable(v), idx))], kind: 'caret', note: v.local ? LOCALNOTE : undefined };
    }
    if ((m = /^(!=|==)?\s*v?(\d+(?:\.\d+)?(?:\.\d+)?)(?:\.\*)+$/.exec(c))) {
      return { clauses: [(m[1] || '==') + vstr(parseVersion(m[2])) + '.*'] };
    }
    if ((m = /^(<>|!=|>=?|<=?|==?)?\s*(.+?)(\.\*)?$/.exec(c))) {
      var op = m[1] || '==', vs = m[2];
      var note0 = null;
      if (op === '<>') { op = '=='; note0 = '`' + raw + '`: Poetry parses `<>` as an exact match (not "not equal"), so it was translated to `==`. If you meant "not equal", use `!=`.'; }
      if (op === '=') op = '==';
      if (vs === 'dev') vs = '0.0-dev';
      v = parseVersion(vs); if (!v) err('Could not parse version constraint: ' + raw);
      if (m[3]) {
        if (op !== '==' && op !== '!=') return { clauses: [op + vstr(v)] , note: 'A trailing `.*` after `' + op + '` is ignored by Poetry.' };
        return { clauses: [op + vstr(v) + '.*'] };
      }
      if (v.local && op !== '==' && op !== '!=') {
        v.local = null;
        return { clauses: [op + vstr(v)], note: 'PEP 440 forbids a local label (`+…`) after `' + op + '`; it was dropped from `' + raw + '`.' };
      }
      return note0 ? { clauses: [op + vstr(v)], note: note0 } : { clauses: [op + vstr(v)] };
    }
    err('Could not parse version constraint: ' + raw);
  }

  // Split like poetry-core: OR on | or ||, AND on comma or space.
  function splitConstraint(s) {
    s = String(s).trim();
    if (s === '*') return [['*']];
    return s.split(/\s*\|\|?\s*/).map(function (g) {
      g = g.replace(/,+\s*$/, '').trim();
      g = g.replace(/(\^|~=|~|<>|!=|>=|<=|==|=|>|<)\s+/g, '$1'); // "> = 1" style glued
      return g.split(/\s*,\s*|\s+/).filter(function (x) { return x !== ''; });
    });
  }

  // Poetry constraint string → { groups: [[clauses]], spec: string|null, notes: [] }
  function constraint(s) {
    var notes = [];
    var groups = splitConstraint(s).map(function (and) {
      var out = [];
      and.forEach(function (a) {
        var r = atom(a);
        if (r.note) notes.push(r.note);
        out = out.concat(r.clauses);
      });
      return out;
    });
    var spec = null;
    if (groups.length === 1) spec = groups[0].join(',');
    else if (groups.some(function (g) { return g.length === 0; })) spec = '';
    else notes.push('PEP 440 has no "or" operator. `' + String(s).trim() + '` cannot be written as one specifier; pick one range (for example the widest) or split the dependency with environment markers.');
    return { groups: groups, spec: spec, notes: notes };
  }

  // ---------- Python constraint → environment marker ----------
  function pyClause(c) { // mirrors poetry-core's marker output for `python = ...`
    var m = /^(~=|==|!=|>=|<=|>|<)(.+)$/.exec(c);
    var op = m[1], vs = m[2];
    if (op === '~=') {
      var cv = parseVersion(vs);
      return pyClause('>=' + vs) + ' and ' + pyClause('<' + vstr(bump(stable(cv), cv.release.length - 2)));
    }
    if (/\.\*$/.test(vs)) {
      var base = vs.slice(0, -2), n = base.split('.').length;
      if (n === 1) return op === '==' ? 'python_version >= "' + base + '" and python_version < "' + inc(base) + '"'
                                      : '(python_version < "' + base + '" or python_version >= "' + inc(base) + '")';
      if (n === 2) return 'python_version ' + op + ' "' + base + '"';
      return 'python_full_version ' + op + ' "' + vs + '"';
    }
    var v = parseVersion(vs);
    var simple = !v.pre && v.post === null && v.dev === null && !v.local;
    if (simple && v.release.length === 1 && op === '==') return '__MAJOR__' + vs;
    if (simple && v.release.length <= 2) {
      if (op === '>=' || op === '<' || op === '==') return 'python_version ' + op + ' "' + vs + '"';
      var r = v.release.slice(); while (r.length < 3) r.push('0');
      return 'python_full_version ' + op + ' "' + r.join('.') + '"';
    }
    return 'python_full_version ' + op + ' "' + vs + '"';
  }
  var pyNotes = [];
  function pyMarker(s) {
    var c = constraint(s);
    var ors = c.groups.map(function (g) {
      if (!g.length) return '';
      return g.map(function (cl) {
        var x = pyClause(cl);
        if (x.indexOf('__MAJOR__') === 0) { // poetry writes python_version == "3", which matches no interpreter
          var mj = x.slice(9);
          pyNotes.push('`python = "' + String(s).trim() + '"`: Poetry itself would write `python_version == "' + mj + '"`, which matches no interpreter (python_version is always X.Y); it was read as "any ' + mj + '.x".');
          return 'python_version >= "' + mj + '" and python_version < "' + inc(mj) + '"';
        }
        return x;
      }).join(' and ');
    });
    if (ors.some(function (o) { return o === ''; })) return '';
    if (ors.length === 1) return ors[0];
    return ors.map(function (o) { return /\band\b/.test(o) ? '(' + o + ')' : o; }).join(' or ');
  }
  function andMarkers(list) {
    list = list.filter(Boolean);
    if (list.length <= 1) return list[0] || '';
    return list.map(function (x) { return /\bor\b/.test(x) ? '(' + x + ')' : x; }).join(' and ');
  }

  // ---------- one dependency entry → PEP 508 lines ----------
  function normName(n) { return n; }
  function depLines(name, value, ctx) {
    var notes = [], lines = [];
    var entries = Array.isArray(value) ? value : [value];
    entries.forEach(function (e) {
      if (typeof e === 'string') e = { version: e };
      if (typeof e !== 'object' || e === null) { notes.push(name + ': unsupported value'); return; }
      var extras = e.extras && e.extras.length ? '[' + e.extras.join(',') + ']' : '';
      var marks = [];
      if (e.python) { marks.push(pyMarker(e.python)); notes = notes.concat(pyNotes.splice(0).map(function (x) { return name + ': ' + x; })); }
      if (e.platform) marks.push('sys_platform == "' + e.platform + '"');
      if (e.markers) marks.push(e.markers);
      var marker = andMarkers(marks);
      var req = name + extras;
      if (e.git) {
        var ref = e.rev || e.tag || e.branch;
        var url = String(e.git);
        if (!/^git\+/.test(url)) url = 'git+' + (/^git@/.test(url) ? 'ssh://' + url.replace(':', '/') : url);
        req += ' @ ' + url + (ref ? '@' + ref : '') + (e.subdirectory ? '#subdirectory=' + e.subdirectory : '');
        if (e.branch) notes.push(name + ': branch `' + e.branch + '` is a moving target; pin a commit with `rev` if you can.');
      } else if (e.url) {
        req += ' @ ' + e.url;
      } else if (e.path) {
        notes.push(name + ': path dependency (`' + e.path + '`). PEP 508 only accepts absolute `file://` URLs, so keep it in [tool.poetry.dependencies] (Poetry 2 enriches [project] from it) or use your tool\'s own mechanism (uv: [tool.uv.sources]).');
        return;
      } else if (e.version !== undefined) {
        var c = constraint(e.version);
        notes = notes.concat(c.notes.map(function (n) { return name + ': ' + n; }));
        if (c.spec === null) req += c.groups.map(function (g) { return g.join(','); }).join(' || ') + '  # ← not valid PEP 508, fix by hand';
        else req += c.spec;
      }
      if (e.source) notes.push(name + ': `source = "' + e.source + '"` (custom index) cannot be expressed in PEP 508; keep [[tool.poetry.source]] / [tool.poetry.dependencies] for it.');
      if (e.develop) notes.push(name + ': `develop = true` (editable) has no PEP 621 equivalent.');
      if (e['allow-prereleases'] || e['allow_prereleases']) notes.push(name + ': `allow-prereleases` has no PEP 621 equivalent (pip: `--pre`; uv: `prerelease = "allow"`).');
      lines.push({ req: req + (marker ? ' ; ' + marker : ''), optional: !!e.optional });
    });
    return { lines: lines, notes: notes };
  }

  // ---------- minimal TOML reader (enough for pyproject.toml) ----------
  function parseToml(src) {
    var i = 0, n = src.length, rootT = {}, cur = rootT, line = 1;
    function fail(msg) { err('TOML line ' + line + ': ' + msg); }
    function ws() { while (i < n && (src[i] === ' ' || src[i] === '\t')) i++; }
    function wsnl() {
      for (;;) {
        ws();
        if (src[i] === '#') { while (i < n && src[i] !== '\n') i++; }
        if (src[i] === '\n' || src[i] === '\r') { if (src[i] === '\n') line++; i++; continue; }
        break;
      }
    }
    function key() {
      ws();
      var parts = [];
      for (;;) {
        ws();
        if (src[i] === '"' || src[i] === "'") parts.push(str());
        else {
          var m = /^[A-Za-z0-9_-]+/.exec(src.slice(i, i + 200));
          if (!m) fail('expected a key');
          parts.push(m[0]); i += m[0].length;
        }
        ws();
        if (src[i] === '.') { i++; continue; }
        return parts;
      }
    }
    function str() {
      var q = src[i], out = '';
      var triple = src.substr(i, 3) === q + q + q;
      if (triple) {
        i += 3; if (src[i] === '\n') { i++; line++; }
        var end = src.indexOf(q + q + q, i); if (end < 0) fail('unterminated string');
        out = src.slice(i, end); line += (out.match(/\n/g) || []).length; i = end + 3; return out;
      }
      i++;
      while (i < n && src[i] !== q) {
        if (src[i] === '\n') fail('newline in string');
        if (q === '"' && src[i] === '\\') {
          var c = src[i + 1]; i += 2;
          var map = { n: '\n', t: '\t', '"': '"', '\\': '\\', r: '\r', b: '\b', f: '\f' };
          if (map[c] !== undefined) out += map[c];
          else if (c === 'u' || c === 'U') { var len = c === 'u' ? 4 : 8; out += String.fromCodePoint(parseInt(src.substr(i, len), 16)); i += len; }
          else fail('bad escape');
        } else out += src[i++];
      }
      if (src[i] !== q) fail('unterminated string');
      i++; return out;
    }
    function value() {
      ws();
      var c = src[i];
      if (c === '"' || c === "'") return str();
      if (c === '[') {
        i++; var arr = [];
        for (;;) { wsnl(); if (src[i] === ']') { i++; return arr; } arr.push(value()); wsnl(); if (src[i] === ',') { i++; continue; } wsnl(); if (src[i] === ']') { i++; return arr; } fail('expected , or ]'); }
      }
      if (c === '{') {
        i++; var t = {};
        ws(); if (src[i] === '}') { i++; return t; }
        for (;;) { wsnl(); var k = key(); ws(); if (src[i] !== '=') fail('expected ='); i++; setPath(t, k, value()); wsnl(); if (src[i] === ',') { i++; continue; } if (src[i] === '}') { i++; return t; } fail('expected , or }'); }
      }
      var m = /^(true|false|[+-]?[0-9][0-9_.eE+:TZ-]*)/.exec(src.slice(i, i + 64));
      if (!m) fail('unexpected value');
      i += m[0].length;
      if (m[0] === 'true') return true; if (m[0] === 'false') return false;
      return m[0];
    }
    function setPath(t, parts, v) {
      for (var k = 0; k < parts.length - 1; k++) { if (typeof t[parts[k]] !== 'object' || t[parts[k]] === null) t[parts[k]] = {}; t = t[parts[k]]; }
      t[parts[parts.length - 1]] = v;
    }
    function table(parts, isArr) {
      var t = rootT;
      for (var k = 0; k < parts.length; k++) {
        var last = k === parts.length - 1;
        if (last && isArr) { if (!Array.isArray(t[parts[k]])) t[parts[k]] = []; var o = {}; t[parts[k]].push(o); return o; }
        if (t[parts[k]] === undefined) t[parts[k]] = {};
        t = t[parts[k]];
        if (Array.isArray(t)) t = t[t.length - 1];
      }
      return t;
    }
    for (;;) {
      wsnl();
      if (i >= n) break;
      if (src[i] === '[') {
        var isArr = src[i + 1] === '['; i += isArr ? 2 : 1;
        var p = key(); ws();
        if (src[i] !== ']' || (isArr && src[i + 1] !== ']')) fail('expected ]');
        i += isArr ? 2 : 1;
        cur = table(p, isArr);
        continue;
      }
      var k = key(); ws();
      if (src[i] !== '=') fail('expected =');
      i++;
      setPath(cur, k, value());
      ws(); if (src[i] === '#') while (i < n && src[i] !== '\n') i++;
      if (i < n && src[i] !== '\n' && src[i] !== '\r') fail('unexpected text after value');
    }
    return rootT;
  }

  function q(s) { return JSON.stringify(s); }

  // ---------- whole pyproject.toml → converted TOML text ----------
  function convert(src) {
    var doc = parseToml(src);
    var po = doc.tool && doc.tool.poetry;
    // Also accept a bare dependency table (no headers): name = "^1.2" lines.
    if (!po) {
      if (Object.keys(doc).length && !doc.tool && !doc.project) po = { dependencies: doc };
      else err('No [tool.poetry.dependencies] table found.');
    }
    var notes = [], out = [];
    var deps = po.dependencies || {};
    var proj = [], optional = {}, requiresPython = null;
    Object.keys(deps).forEach(function (name) {
      if (name.toLowerCase() === 'python') {
        var c = constraint(typeof deps[name] === 'string' ? deps[name] : deps[name].version);
        notes = notes.concat(c.notes.map(function (x) { return 'python: ' + x; }));
        requiresPython = c.spec === null ? c.groups.map(function (g) { return g.join(','); }).join(' || ') : c.spec;
        return;
      }
      var r = depLines(name, deps[name], {});
      notes = notes.concat(r.notes);
      r.lines.forEach(function (l) {
        if (l.optional) {
          var ex = po.extras || {}, placed = false;
          Object.keys(ex).forEach(function (x) {
            if ((ex[x] || []).some(function (d) { return d.toLowerCase() === name.toLowerCase(); })) { (optional[x] = optional[x] || []).push(l.req); placed = true; }
          });
          if (!placed) notes.push(name + ': `optional = true` but not listed in [tool.poetry.extras]; it is left out.');
        } else proj.push(l.req);
      });
    });
    var groups = {};
    function addGroup(g, table) {
      Object.keys(table || {}).forEach(function (name) {
        var r = depLines(name, table[name], {});
        notes = notes.concat(r.notes);
        r.lines.forEach(function (l) { (groups[g] = groups[g] || []).push(l.req); });
      });
    }
    if (po['dev-dependencies']) addGroup('dev', po['dev-dependencies']);
    Object.keys(po.group || {}).forEach(function (g) { addGroup(g, po.group[g].dependencies); if (po.group[g].optional) notes.push('group `' + g + '`: `optional = true` has no PEP 735 equivalent.'); });

    out.push('[project]');
    if (po.name) out.push('name = ' + q(po.name));
    if (po.version) out.push('version = ' + q(po.version));
    if (requiresPython !== null && requiresPython !== '') out.push('requires-python = ' + q(requiresPython));
    out.push('dependencies = [');
    function line(d) { return d.indexOf('  # ←') > 0 ? '    # FIX BY HAND (no "or" in PEP 440): ' + d.split('  # ←')[0] : '    ' + q(d) + ','; }
    proj.forEach(function (d) { out.push(line(d)); });
    out.push(']');
    if (Object.keys(optional).length) {
      out.push('', '[project.optional-dependencies]');
      Object.keys(optional).forEach(function (x) { out.push((/^[A-Za-z0-9_-]+$/.test(x) ? x : q(x)) + ' = ['); optional[x].forEach(function (d) { out.push(line(d)); }); out.push(']'); });
    }
    if (Object.keys(groups).length) {
      out.push('', '# PEP 735 dependency groups (read by uv, pip >= 25.1 `--group`, …).');
      out.push('[dependency-groups]');
      Object.keys(groups).forEach(function (g) {
        out.push((/^[A-Za-z0-9_-]+$/.test(g) ? g : q(g)) + ' = [');
        groups[g].forEach(function (d) { out.push(line(d)); });
        out.push(']');
      });
    }
    return { toml: out.join('\n') + '\n', notes: notes, dependencies: proj, optional: optional, groups: groups, requiresPython: requiresPython };
  }

  var P2P = { constraint: constraint, pyMarker: pyMarker, takePyNotes: function () { return pyNotes.splice(0); }, depLines: depLines, parseToml: parseToml, convert: convert, parseVersion: parseVersion, vstr: vstr };
  if (typeof module !== 'undefined' && module.exports) module.exports = P2P; else root.P2P = P2P;
})(typeof globalThis !== 'undefined' ? globalThis : this);
