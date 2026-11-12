/* Version Constraint Checker — engine (browser + Node).
 * Re-implements, in plain JS, how five package managers read a version constraint:
 *   npm      → node-semver (bundled separately as nodeSemver, ISC licence)
 *   cargo    → Rust crate `semver` 1.x (VersionReq), used by Cargo
 *   composer → composer/semver 3.x (VersionParser + PHP version_compare)
 *   pip      → PEP 440 (packaging), range membership with pre-releases allowed
 *   rubygems → Gem::Requirement / Gem::Version (Bundler, gem)
 * Tested against the reference implementations: products/EXP-004-outils-dev-pub-crypto/oracle/.
 * Built by AI agents (10aday). MIT licence.
 */
(function (root) {
  'use strict';

  // ---------- shared: semver-style pre-release comparison ----------
  function cmpIdent(a, b) {
    var an = /^[0-9]+$/.test(a), bn = /^[0-9]+$/.test(b);
    if (an && bn) return cmpNumStr(a, b);
    if (an) return -1;
    if (bn) return 1;
    return a < b ? -1 : a > b ? 1 : 0;
  }
  function cmpNumStr(a, b) { // arbitrary-length non-negative integers as strings
    a = a.replace(/^0+(?=.)/, ''); b = b.replace(/^0+(?=.)/, '');
    if (a.length !== b.length) return a.length < b.length ? -1 : 1;
    return a < b ? -1 : a > b ? 1 : 0;
  }
  function cmpPre(a, b) { // arrays; empty = release, greater than any pre-release
    if (!a.length && !b.length) return 0;
    if (!a.length) return 1;
    if (!b.length) return -1;
    for (var i = 0; i < Math.min(a.length, b.length); i++) {
      var c = cmpIdent(a[i], b[i]); if (c) return c;
    }
    return a.length === b.length ? 0 : a.length < b.length ? -1 : 1;
  }

  // =================================================================
  // npm (node-semver)
  // =================================================================
  var npm = {
    name: 'npm',
    parse: function (c) {
      var S = root.nodeSemver;
      var r; try { r = new S.Range(c); } catch (e) { return { valid: false }; }
      return {
        valid: true,
        normalized: r.range === '' ? '*' : r.range,
        test: function (v) { return S.valid(v) ? S.satisfies(v, r) : null; }
      };
    }
  };

  // =================================================================
  // Cargo (crate semver 1.x)
  // =================================================================
  var U64MAX = '18446744073709551615';
  function cargoNum(s) { // numeric identifier: no leading zero, fits u64
    if (!/^(0|[1-9][0-9]*)$/.test(s)) return null;
    if (s.length > 20 || (s.length === 20 && s > U64MAX)) return null;
    return parseInt(s, 10) <= Number.MAX_SAFE_INTEGER ? Number(s) : s;
  }
  function cargoPre(s) { // dot-separated identifiers
    var ids = s.split('.');
    for (var i = 0; i < ids.length; i++) {
      if (!/^[0-9A-Za-z-]+$/.test(ids[i])) return null;
      if (/^[0-9]+$/.test(ids[i]) && ids[i].length > 1 && ids[i][0] === '0') return null;
    }
    return ids;
  }
  function cargoBuild(s) {
    var ids = s.split('.');
    for (var i = 0; i < ids.length; i++) if (!/^[0-9A-Za-z-]+$/.test(ids[i])) return false;
    return true;
  }
  function cargoVersion(v) {
    var m = /^([0-9]+)\.([0-9]+)\.([0-9]+)(?:-([^+]*))?(?:\+(.*))?$/.exec(v);
    if (!m) return null;
    var maj = cargoNum(m[1]), min = cargoNum(m[2]), pat = cargoNum(m[3]);
    if (maj === null || min === null || pat === null) return null;
    var pre = [];
    if (m[4] !== undefined) { pre = cargoPre(m[4]); if (!pre) return null; }
    if (m[5] !== undefined && !cargoBuild(m[5])) return null;
    return { major: maj, minor: min, patch: pat, pre: pre };
  }
  function ncmp(a, b) { return cmpNumStr(String(a), String(b)); }
  function cargoComparator(text) {
    var m = /^(=|>=|>|<=|<|~|\^)?\s*(.*)$/.exec(text);
    var op = m[1] || null, rest = m[2];
    var parts = /^([0-9]+)(?:\.([0-9]+|[*xX]))?(?:\.([0-9]+|[*xX]))?(?:-([^+]*))?(?:\+(.*))?$/.exec(rest);
    if (!parts) return null;
    var major = cargoNum(parts[1]); if (major === null) return null;
    var minor = null, patch = null, wild = false;
    if (parts[2] !== undefined) {
      if (/^[*xX]$/.test(parts[2])) wild = parts[2];
      else { minor = cargoNum(parts[2]); if (minor === null) return null; }
    }
    if (parts[3] !== undefined) {
      if (/^[*xX]$/.test(parts[3])) { if (wild && wild !== parts[3]) return null; if (!wild && parts[2] !== undefined) wild = parts[3]; else if (!wild) return null; }
      else { if (wild) return null; patch = cargoNum(parts[3]); if (patch === null) return null; }
    }
    var pre = [];
    if (parts[4] !== undefined) {
      if (wild || patch === null) return null;
      pre = cargoPre(parts[4]); if (!pre) return null;
    }
    if (parts[5] !== undefined) {
      if (wild || patch === null) return null;
      if (!cargoBuild(parts[5])) return null;
    }
    if (!op) op = wild ? '*' : '^';
    return { op: op, major: major, minor: minor, patch: patch, pre: pre };
  }
  function cargoExact(c, v) {
    if (ncmp(v.major, c.major)) return false;
    if (c.minor !== null && ncmp(v.minor, c.minor)) return false;
    if (c.patch !== null && ncmp(v.patch, c.patch)) return false;
    return cmpPre(v.pre, c.pre) === 0;
  }
  function cargoGreater(c, v) {
    var d = ncmp(v.major, c.major); if (d) return d > 0;
    if (c.minor === null) return false;
    d = ncmp(v.minor, c.minor); if (d) return d > 0;
    if (c.patch === null) return false;
    d = ncmp(v.patch, c.patch); if (d) return d > 0;
    return cmpPre(v.pre, c.pre) > 0;
  }
  function cargoLess(c, v) {
    var d = ncmp(v.major, c.major); if (d) return d < 0;
    if (c.minor === null) return false;
    d = ncmp(v.minor, c.minor); if (d) return d < 0;
    if (c.patch === null) return false;
    d = ncmp(v.patch, c.patch); if (d) return d < 0;
    return cmpPre(v.pre, c.pre) < 0;
  }
  function cargoTilde(c, v) {
    if (ncmp(v.major, c.major)) return false;
    if (c.minor !== null && ncmp(v.minor, c.minor)) return false;
    if (c.patch !== null) { var d = ncmp(v.patch, c.patch); if (d) return d > 0; }
    return cmpPre(v.pre, c.pre) >= 0;
  }
  function cargoCaret(c, v) {
    if (ncmp(v.major, c.major)) return false;
    if (c.minor === null) return true;
    if (c.patch === null) return String(c.major) !== '0' ? ncmp(v.minor, c.minor) >= 0 : ncmp(v.minor, c.minor) === 0;
    var d;
    if (String(c.major) !== '0') {
      d = ncmp(v.minor, c.minor); if (d) return d > 0;
      d = ncmp(v.patch, c.patch); if (d) return d > 0;
    } else if (String(c.minor) !== '0') {
      if (ncmp(v.minor, c.minor)) return false;
      d = ncmp(v.patch, c.patch); if (d) return d > 0;
    } else if (ncmp(v.minor, c.minor) || ncmp(v.patch, c.patch)) return false;
    return cmpPre(v.pre, c.pre) >= 0;
  }
  function cargoWildcard(c, v) {
    if (ncmp(v.major, c.major)) return false;
    if (c.minor !== null && ncmp(v.minor, c.minor)) return false;
    return true;
  }
  function cargoMatchOne(c, v) {
    switch (c.op) {
      case '=': return cargoExact(c, v);
      case '>': return cargoGreater(c, v);
      case '>=': return cargoExact(c, v) || cargoGreater(c, v);
      case '<': return cargoLess(c, v);
      case '<=': return cargoExact(c, v) || cargoLess(c, v);
      case '~': return cargoTilde(c, v);
      case '^': return cargoCaret(c, v);
      default: return cargoWildcard(c, v);
    }
  }
  function cargoFmt(c) {
    var s = (c.op === '*' ? '' : c.op) + c.major;
    if (c.minor !== null) s += '.' + c.minor; else if (c.op === '*') return s + '.*';
    if (c.patch !== null) s += '.' + c.patch; else if (c.op === '*') return s + '.*';
    if (c.pre.length) s += '-' + c.pre.join('.');
    return s;
  }
  var cargo = {
    name: 'cargo',
    parse: function (c) {
      var t = c.replace(/^ +| +$/g, '');
      var comps;
      if (/^[*xX]$/.test(t)) comps = [];
      else {
        if (t === '') return { valid: false };
        var items = t.split(',');
        comps = [];
        for (var i = 0; i < items.length; i++) {
          var it = items[i].replace(/^ +| +$/g, '');
          if (it === '' && i === items.length - 1 && i > 0) continue; // trailing comma
          var k = cargoComparator(it);
          if (!k) return { valid: false };
          comps.push(k);
        }
        if (comps.length > 32) return { valid: false };
      }
      return {
        valid: true,
        normalized: comps.length ? comps.map(cargoFmt).join(', ') : '*',
        test: function (vs) {
          var v = cargoVersion(vs); if (!v) return null;
          for (var i = 0; i < comps.length; i++) if (!cargoMatchOne(comps[i], v)) return false;
          if (!v.pre.length) return true;
          for (i = 0; i < comps.length; i++) {
            var k = comps[i];
            if (!ncmp(k.major, v.major) && k.minor !== null && !ncmp(k.minor, v.minor) && k.patch !== null && !ncmp(k.patch, v.patch) && k.pre.length) return true;
          }
          return false;
        }
      };
    }
  };

  // =================================================================
  // Composer (composer/semver 3.x)
  // =================================================================
  var MOD = '[._-]?(?:(stable|beta|b|RC|alpha|a|patch|pl|p)((?:[.-]?\\d+)*)?)?([.-]?dev)?';
  var STAB = 'stable|RC|beta|alpha|dev';
  function g(m, i) { return m && m[i] !== undefined ? m[i] : ''; }
  function phpEmpty(x) { return x === undefined || x === null || x === '' || x === '0'; }
  function phpTrim(s) { return s.replace(/^[ \t\n\r\0\x0B]+|[ \t\n\r\0\x0B]+$/g, ''); }
  function expandStability(s) {
    s = s.toLowerCase();
    return { a: 'alpha', b: 'beta', p: 'patch', pl: 'patch', rc: 'RC' }[s] || s;
  }
  function normalizeBranch(name) {
    name = phpTrim(name);
    var m = /^v?(\d+)(\.(?:\d+|[xX*]))?(\.(?:\d+|[xX*]))?(\.(?:\d+|[xX*]))?$/i.exec(name);
    if (m) {
      var v = '';
      for (var i = 1; i < 5; i++) v += m[i] !== undefined ? m[i].replace(/[*X]/g, 'x') : '.x';
      return v.replace(/x/g, '9999999') + '-dev';
    }
    return 'dev-' + name;
  }
  function composerNormalize(version) {
    version = phpTrim(String(version));
    var m;
    if ((m = /^([^,\s]+) +as +([^,\s]+)$/.exec(version))) version = m[1];
    if ((m = new RegExp('@(?:' + STAB + ')$', 'i').exec(version))) version = version.slice(0, version.length - m[0].length);
    if (version === 'master' || version === 'trunk' || version === 'default') version = 'dev-' + version;
    if (version.toLowerCase().indexOf('dev-') === 0) return 'dev-' + version.slice(4);
    if ((m = /^([^,\s+]+)\+[^\s]+$/.exec(version))) version = m[1];
    var idx = null;
    if ((m = new RegExp('^v?(\\d{1,5})(\\.\\d+)?(\\.\\d+)?(\\.\\d+)?' + MOD + '$', 'i').exec(version)) && !/^v?\d{6}/.test(version)) {
      version = m[1] + (phpEmpty(m[2]) ? '.0' : m[2]) + (phpEmpty(m[3]) ? '.0' : m[3]) + (phpEmpty(m[4]) ? '.0' : m[4]);
      idx = 5;
    } else if ((m = new RegExp('^v?(\\d{4}(?:[.:-]?\\d{2}){1,6}(?:[.:-]?\\d{1,3}){0,2})' + MOD + '$', 'i').exec(version))) {
      version = m[1].replace(/\D/g, '.');
      idx = 2;
    }
    if (idx !== null) {
      if (!phpEmpty(m[idx])) {
        if (m[idx] === 'stable') return version;
        version += '-' + expandStability(m[idx]) + (g(m, idx + 1) !== '' ? g(m, idx + 1).replace(/^[.-]+/, '') : '');
      }
      if (!phpEmpty(m[idx + 2])) version += '-dev';
      return version;
    }
    if ((m = /^(.*?)[.-]?dev$/i.exec(version))) {
      var n = normalizeBranch(m[1]);
      if (n.indexOf('dev-') === -1) return n;
    }
    throw new Error('Invalid version string "' + version + '"');
  }
  // PHP version_compare
  function phpCanon(v) {
    if (!v.length) return v;
    var out = v[0], lp = v[0];
    var isd = function (c) { return c >= '0' && c <= '9'; };
    var isnd = function (c) { return !isd(c) && c !== '.'; };
    for (var i = 1; i < v.length; i++) {
      var c = v[i];
      if (c === '-' || c === '_' || c === '+') { if (out[out.length - 1] !== '.') out += '.'; }
      else if ((isnd(lp) && isd(c)) || (isd(lp) && isnd(c))) { if (out[out.length - 1] !== '.') out += '.'; out += c; }
      else if (!/[0-9A-Za-z]/.test(c)) { if (out[out.length - 1] !== '.') out += '.'; }
      else out += c;
      lp = c;
    }
    return out;
  }
  var SPECIAL = [['dev', 0], ['alpha', 1], ['a', 1], ['beta', 2], ['b', 2], ['RC', 3], ['rc', 3], ['#', 4], ['pl', 5], ['p', 5]];
  function special(f1, f2) {
    var o1 = -6, o2 = -6, i;
    for (i = 0; i < SPECIAL.length; i++) if (f1.indexOf(SPECIAL[i][0]) === 0) { o1 = SPECIAL[i][1]; break; }
    for (i = 0; i < SPECIAL.length; i++) if (f2.indexOf(SPECIAL[i][0]) === 0) { o2 = SPECIAL[i][1]; break; }
    return o1 < o2 ? -1 : o1 > o2 ? 1 : 0;
  }
  function isDigit(c) { return c !== undefined && c >= '0' && c <= '9'; }
  function phpStrtol(s) { var m = /^[0-9]*/.exec(s)[0]; return m === '' ? '0' : m; }
  function phpVersionCompare(a, b) {
    if (!a.length || !b.length) return !a.length && !b.length ? 0 : (a.length ? 1 : -1);
    var v1 = a[0] === '#' ? a : phpCanon(a), v2 = b[0] === '#' ? b : phpCanon(b);
    var p1 = 0, p2 = 0, n1 = 1, n2 = 1, cmp = 0, s1, s2;
    while (p1 < v1.length && p2 < v2.length && n1 !== -1 && n2 !== -1) {
      n1 = v1.indexOf('.', p1); n2 = v2.indexOf('.', p2);
      s1 = v1.slice(p1, n1 === -1 ? undefined : n1); s2 = v2.slice(p2, n2 === -1 ? undefined : n2);
      if (isDigit(s1[0]) && isDigit(s2[0])) {
        var x = phpStrtol(s1), y = phpStrtol(s2);
        x = x.replace(/^0+(?=.)/, ''); y = y.replace(/^0+(?=.)/, '');
        if (x.length > 19) x = '9223372036854775807'; if (y.length > 19) y = '9223372036854775807';
        cmp = cmpNumStr(x, y);
      } else if (!isDigit(s1[0]) && !isDigit(s2[0])) cmp = special(s1, s2);
      else cmp = isDigit(s1[0]) ? special('#N#', s2) : special(s1, '#N#');
      if (cmp) break;
      if (n1 !== -1) p1 = n1 + 1;
      if (n2 !== -1) p2 = n2 + 1;
    }
    if (cmp === 0) {
      if (n1 !== -1 && p1 <= v1.length) cmp = isDigit(v1[p1]) ? 1 : phpVersionCompare(v1.slice(p1), '#N#');
      else if (n2 !== -1 && p2 <= v2.length) cmp = isDigit(v2[p2]) ? -1 : phpVersionCompare('#N#', v2.slice(p2));
    }
    return cmp;
  }
  function phpVC(a, b, op) {
    var c = phpVersionCompare(a, b);
    switch (op) {
      case '==': return c === 0; case '!=': return c !== 0;
      case '<': return c < 0; case '<=': return c <= 0;
      case '>': return c > 0; case '>=': return c >= 0;
    }
  }
  var OPMAP = { '=': '==', '==': '==', '<': '<', '<=': '<=', '>': '>', '>=': '>=', '<>': '!=', '!=': '!=' };
  function K(op, version) { return { op: OPMAP[op], version: version }; }
  function manipulate(m, position, increment) {
    m = m.slice();
    for (var i = 4; i > 0; --i) {
      if (i > position) m[i] = '0';
      else if (i === position && increment) {
        m[i] = String((parseInt(m[i] || '0', 10) || 0) + increment);
      }
    }
    return g(m, 1) + '.' + g(m, 2) + '.' + g(m, 3) + '.' + g(m, 4);
  }
  function composerParseOne(c) {
    var m, stabilityModifier = null;
    if ((m = /^([^,\s]+) +as +([^,\s]+)$/.exec(c))) c = m[1];
    if ((m = new RegExp('^([^,\\s]*?)@(' + STAB + ')$', 'i').exec(c))) {
      c = m[1] !== '' ? m[1] : '*';
      if (m[2] !== 'stable') stabilityModifier = m[2];
    }
    if ((m = /^(dev-[^,\s@]+?|[^,\s@]+?\.x-dev)#.+$/i.exec(c))) c = m[1];
    if ((m = /^(v)?[xX*](\.[xX*])*$/i.exec(c))) {
      if (!phpEmpty(m[1]) || !phpEmpty(m[2])) return [K('>=', '0.0.0.0-dev')];
      return [{ op: 'all' }];
    }
    var VR = 'v?(\\d+)(?:\\.(\\d+))?(?:\\.(\\d+))?(?:\\.(\\d+))?(?:' + MOD + '|\\.([xX*][.-]?dev))(?:\\+[^\\s]+)?';
    var position, suffix, low, high;
    if ((m = new RegExp('^~>?' + VR + '$', 'i').exec(c))) {
      if (c.indexOf('~>') === 0) throw new Error('Invalid operator "~>"');
      position = g(m, 4) !== '' ? 4 : g(m, 3) !== '' ? 3 : g(m, 2) !== '' ? 2 : 1;
      if (!phpEmpty(m[8])) position++;
      suffix = (phpEmpty(m[5]) && phpEmpty(m[7]) && phpEmpty(m[8])) ? '-dev' : '';
      low = composerNormalize((c + suffix).slice(1));
      high = manipulate(m, Math.max(1, position - 1), 1) + '-dev';
      return [K('>=', low), K('<', high)];
    }
    if ((m = new RegExp('^\\^' + VR + '()$', 'i').exec(c))) {
      if (g(m, 1) !== '0' || g(m, 2) === '') position = 1;
      else if (g(m, 2) !== '0' || g(m, 3) === '') position = 2;
      else position = 3;
      suffix = (phpEmpty(m[5]) && phpEmpty(m[7]) && phpEmpty(m[8])) ? '-dev' : '';
      low = composerNormalize((c + suffix).slice(1));
      high = manipulate(m, position, 1) + '-dev';
      return [K('>=', low), K('<', high)];
    }
    if ((m = /^v?(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:\.[xX*])+$/.exec(c))) {
      position = g(m, 3) !== '' ? 3 : g(m, 2) !== '' ? 2 : 1;
      low = manipulate(m, position) + '-dev';
      high = manipulate(m, position, 1) + '-dev';
      if (low === '0.0.0.0-dev') return [K('<', high)];
      return [K('>=', low), K('<', high)];
    }
    if ((m = new RegExp('^(' + VR + ') +- +(' + VR + ')()$', 'i').exec(c))) {
      var lowSuffix = (phpEmpty(m[6]) && phpEmpty(m[8]) && phpEmpty(m[9])) ? '-dev' : '';
      var lower = K('>=', composerNormalize(m[1]) + lowSuffix), upper;
      var e = function (x) { return x === '0' ? false : phpEmpty(x); };
      if ((!e(m[12]) && !e(m[13])) || !phpEmpty(m[15]) || !phpEmpty(m[17]) || !phpEmpty(m[18])) {
        upper = K('<=', composerNormalize(m[10]));
      } else {
        composerNormalize(m[10]);
        upper = K('<', manipulate(['', g(m, 11), g(m, 12), g(m, 13), g(m, 14)], e(m[12]) ? 1 : 2, 1) + '-dev');
      }
      return [lower, upper];
    }
    m = /^(<>|!=|>=?|<=?|==?)?\s*([\s\S]*)$/.exec(c);
    var version;
    try { version = composerNormalize(m[2]); }
    catch (err) {
      if (m[2].slice(-4) === '-dev' && /^[0-9a-zA-Z\-.\/]+$/.test(m[2])) version = composerNormalize('dev-' + m[2].slice(0, -4));
      else throw err;
    }
    var op = m[1] || '=';
    if (op !== '==' && op !== '=' && stabilityModifier && parseStability(version) === 'stable') version += '-' + stabilityModifier;
    else if (op === '<' || op === '>=') {
      if (!new RegExp('-' + MOD + '$', 'i').test(m[2]) && m[2].indexOf('dev-') !== 0) version += '-dev';
    }
    return [K(op, version)];
  }
  function parseStability(version) {
    version = version.replace(/#.+$/, '');
    if (version.indexOf('dev-') === 0 || version.slice(-4) === '-dev') return 'dev';
    var m = new RegExp(MOD + '(?:\\+.*)?$', 'i').exec(version.toLowerCase());
    if (m && !phpEmpty(m[3])) return 'dev';
    if (m && !phpEmpty(m[1])) {
      if (m[1] === 'beta' || m[1] === 'b') return 'beta';
      if (m[1] === 'alpha' || m[1] === 'a') return 'alpha';
      if (m[1] === 'rc') return 'RC';
    }
    return 'stable';
  }
  function composerMatch(k, v) { // k: constraint, v: normalized version (provider "==")
    if (k.op === 'all') return true;
    var aB = v.indexOf('dev-') === 0, bB = k.version.indexOf('dev-') === 0;
    if (k.op === '!=') return (aB || bB) ? v !== k.version : phpVC(v, k.version, '!=');
    if (k.op === '==') { if (aB && bB) return v === k.version; if (aB || bB) return false; return phpVC(k.version, v, '=='); }
    if (aB && bB) return false;
    if (aB || bB) return false;
    return phpVC(v, k.version, k.op);
  }
  function composerFmtK(k) { return k.op === 'all' ? '*' : k.op + ' ' + k.version; }
  var composer = {
    name: 'composer',
    normalizeVersion: composerNormalize,
    parse: function (c) {
      var groups;
      try {
        var ors = phpTrim(c).split(/\s*\|\|?\s*/);
        groups = ors.map(function (o) {
          var ands = o.split(/(?<!^|as|[=>< ,]) *(?<!-)[, ](?!-) *(?!,|as|$)/);
          var objs = [];
          ands.forEach(function (a) { objs = objs.concat(composerParseOne(a)); });
          return objs;
        });
      } catch (e) { return { valid: false }; }
      return {
        valid: true,
        normalized: groups.map(function (gr) { return gr.map(composerFmtK).join(' '); }).join(' || '),
        test: function (vs) {
          var v; try { v = composerNormalize(vs); } catch (e) { return null; }
          return groups.some(function (gr) { return gr.every(function (k) { return composerMatch(k, v); }); });
        }
      };
    }
  };

  // =================================================================
  // pip (PEP 440)
  // =================================================================
  var PEP_VERSION = /^\s*v?(?:([0-9]+)!)?([0-9]+(?:\.[0-9]+)*)(?:[._-]?(alpha|a|beta|b|preview|pre|c|rc)[._-]?([0-9]+)?)?((?:-([0-9]+))|(?:[._-]?(post|rev|r)[._-]?([0-9]+)?))?(?:[._-]?(dev)[._-]?([0-9]+)?)?(?:\+([a-z0-9]+(?:[._-][a-z0-9]+)*))?\s*$/i;
  function pepParse(s) {
    var m = PEP_VERSION.exec(s);
    if (!m) return null;
    var preL = m[3] ? m[3].toLowerCase() : null;
    if (preL) preL = { alpha: 'a', a: 'a', beta: 'b', b: 'b', c: 'rc', pre: 'rc', preview: 'rc', rc: 'rc' }[preL];
    var post = null;
    if (m[5] !== undefined) post = m[6] !== undefined ? m[6] : (m[8] !== undefined ? m[8] : '0');
    return {
      epoch: m[1] !== undefined ? m[1].replace(/^0+(?=.)/, '') : '0',
      release: m[2].split('.').map(function (x) { return x.replace(/^0+(?=.)/, ''); }),
      pre: preL ? [preL, (m[4] !== undefined ? m[4] : '0').replace(/^0+(?=.)/, '')] : null,
      post: post === null ? null : post.replace(/^0+(?=.)/, ''),
      dev: m[9] ? (m[10] !== undefined ? m[10] : '0').replace(/^0+(?=.)/, '') : null,
      local: m[11] !== undefined ? m[11].toLowerCase().split(/[._-]/).map(function (p) { return /^[0-9]+$/.test(p) ? p.replace(/^0+(?=.)/, '') : p; }) : null
    };
  }
  function pepStr(v, noLocal) {
    var s = (v.epoch !== '0' ? v.epoch + '!' : '') + v.release.join('.');
    if (v.pre) s += v.pre[0] + v.pre[1];
    if (v.post !== null) s += '.post' + v.post;
    if (v.dev !== null) s += '.dev' + v.dev;
    if (v.local && !noLocal) s += '+' + v.local.join('.');
    return s;
  }
  function pepCmp(a, b, ignoreLocal) {
    var c = cmpNumStr(a.epoch, b.epoch); if (c) return c;
    var ra = a.release.slice(), rb = b.release.slice();
    while (ra.length > 1 && ra[ra.length - 1] === '0') ra.pop();
    while (rb.length > 1 && rb[rb.length - 1] === '0') rb.pop();
    for (var i = 0; i < Math.max(ra.length, rb.length); i++) {
      c = cmpNumStr(ra[i] || '0', rb[i] || '0'); if (c) return c;
    }
    // pre: dev-only (no pre, no post) sorts before any pre
    var preKey = function (v) {
      if (!v.pre && v.post === null && v.dev !== null) return [-1];
      if (!v.pre) return [1];
      return [0, v.pre[0], v.pre[1]];
    };
    var pa = preKey(a), pb = preKey(b);
    if (pa[0] !== pb[0]) return pa[0] < pb[0] ? -1 : 1;
    if (pa[0] === 0) {
      if (pa[1] !== pb[1]) return pa[1] < pb[1] ? -1 : 1;
      c = cmpNumStr(pa[2], pb[2]); if (c) return c;
    }
    if (a.post === null && b.post !== null) return -1;
    if (a.post !== null && b.post === null) return 1;
    if (a.post !== null) { c = cmpNumStr(a.post, b.post); if (c) return c; }
    if (a.dev === null && b.dev !== null) return 1;
    if (a.dev !== null && b.dev === null) return -1;
    if (a.dev !== null) { c = cmpNumStr(a.dev, b.dev); if (c) return c; }
    if (ignoreLocal) return 0;
    if (!a.local && !b.local) return 0;
    if (!a.local) return -1;
    if (!b.local) return 1;
    for (i = 0; i < Math.min(a.local.length, b.local.length); i++) {
      var x = a.local[i], y = b.local[i], xn = /^[0-9]+$/.test(x), yn = /^[0-9]+$/.test(y);
      if (xn && yn) c = cmpNumStr(x, y);
      else if (xn) c = 1; else if (yn) c = -1;
      else c = x < y ? -1 : x > y ? 1 : 0;
      if (c) return c;
    }
    return a.local.length === b.local.length ? 0 : a.local.length < b.local.length ? -1 : 1;
  }
  function pepBase(v) { return { epoch: v.epoch, release: v.release, pre: null, post: null, dev: null, local: null }; }
  function pepPublic(v) { return { epoch: v.epoch, release: v.release, pre: v.pre, post: v.post, dev: v.dev, local: null }; }
  function isPre(v) { return !!v.pre || v.dev !== null; }
  function versionSplit(s) { // packaging _version_split on a canonical string
    var i = s.lastIndexOf('!');
    var res = [i >= 0 ? s.slice(0, i) : '0'];
    s.slice(i + 1).split('.').forEach(function (item) {
      var m = /^([0-9]+)((?:a|b|c|rc)[0-9]+)$/.exec(item);
      if (m) res.push(m[1], m[2]); else res.push(item);
    });
    return res;
  }
  function padVersion(left, right) {
    var ln = 0, rn = 0;
    while (ln < left.length && /^[0-9]+$/.test(left[ln])) ln++;
    while (rn < right.length && /^[0-9]+$/.test(right[rn])) rn++;
    var l = left.slice(0, ln), r = right.slice(0, rn);
    while (l.length < r.length) l.push('0');
    while (r.length < l.length) r.push('0');
    return [l.concat(left.slice(ln)), r.concat(right.slice(rn))];
  }
  var SPEC_RE = {
    '===': /^===\s*[^\s;)]*$/,
    eq: /^(==|!=)\s*v?(?:[0-9]+!)?[0-9]+(?:\.[0-9]+)*(?:\.\*|(?:[-_.]?(alpha|beta|preview|pre|a|b|c|rc)[-_.]?[0-9]*)?(?:(?:-[0-9]+)|(?:[-_.]?(post|rev|r)[-_.]?[0-9]*))?(?:[-_.]?dev[-_.]?[0-9]*)?(?:\+[a-z0-9]+(?:[-_.][a-z0-9]+)*)?)?$/i,
    compat: /^~=\s*v?(?:[0-9]+!)?[0-9]+(?:\.[0-9]+)+(?:[-_.]?(alpha|beta|preview|pre|a|b|c|rc)[-_.]?[0-9]*)?(?:(?:-[0-9]+)|(?:[-_.]?(post|rev|r)[-_.]?[0-9]*))?(?:[-_.]?dev[-_.]?[0-9]*)?$/i,
    cmp: /^(<=|>=|<|>)\s*v?(?:[0-9]+!)?[0-9]+(?:\.[0-9]+)*(?:[-_.]?(alpha|beta|preview|pre|a|b|c|rc)[-_.]?[0-9]*)?(?:(?:-[0-9]+)|(?:[-_.]?(post|rev|r)[-_.]?[0-9]*))?(?:[-_.]?dev[-_.]?[0-9]*)?$/i
  };
  function pepSpec(s) {
    s = s.replace(/^\s+|\s+$/g, '');
    if (!(SPEC_RE['==='].test(s) || SPEC_RE.eq.test(s) || SPEC_RE.compat.test(s) || SPEC_RE.cmp.test(s))) return null;
    var op, ver;
    if (s.indexOf('===') === 0) { op = '==='; ver = s.slice(3).trim(); }
    else if (/^(~=|==|!=|<=|>=)/.test(s)) { op = s.slice(0, 2); ver = s.slice(2).trim(); }
    else { op = s[0]; ver = s.slice(1).trim(); }
    var spec = { op: op, raw: ver };
    if (op !== '===') {
      var wild = /\.\*$/.test(ver);
      spec.wild = wild;
      spec.v = pepParse(wild ? ver.slice(0, -2) : ver);
      if (!spec.v) return null;
    }
    return spec;
  }
  function pepEqual(spec, v) {
    if (spec.wild) {
      var sp = versionSplit(pepStr(spec.v, true)), pr = versionSplit(pepStr(pepPublic(v), true));
      var padded = padVersion(pr, sp)[0].slice(0, sp.length);
      return padded.length === sp.length && padded.every(function (x, i) { return x === sp[i]; });
    }
    if (spec.v.local) return pepCmp(v, spec.v) === 0;
    return pepCmp(pepPublic(v), spec.v) === 0;
  }
  function pepContains(spec, v) {
    var s = spec.v;
    switch (spec.op) {
      case '===': return pepStr(v).toLowerCase() === spec.raw.toLowerCase();
      case '==': return pepEqual(spec, v);
      case '!=': return !pepEqual(spec, v);
      case '<=': return pepCmp(pepPublic(v), s) <= 0;
      case '>=': return pepCmp(pepPublic(v), s) >= 0;
      case '<': // packaging 26: <V excludes V's pre/dev releases unless V is itself a pre-release
        if (isPre(s)) return pepCmp(v, s) < 0;
        return pepCmp(v, { epoch: s.epoch, release: s.release, pre: s.pre, post: s.post, dev: '0', local: null }) < 0;
      case '>': // packaging 26: >V excludes V's post-releases and local versions (not when V is a dev release)
        if (!(pepCmp(v, s) > 0)) return false;
        if (s.dev !== null) return true;
        if (s.post !== null) return !(v.local && pepCmp(pepPublic(v), s) === 0);
        var fam = pepCmp(pepBase(v), pepBase(s)) === 0 && JSON.stringify(v.pre) === JSON.stringify(s.pre);
        return !(fam && (v.post !== null || v.local));
      case '~=':
        var parts = versionSplit(pepStr(s, true));
        var keep = [];
        for (var i = 0; i < parts.length; i++) {
          if (/^(dev|a|b|rc|post)/.test(parts[i])) break;
          keep.push(parts[i]);
        }
        keep.pop();
        var prefix = keep[0] + '!' + keep.slice(1).join('.');
        var pv = pepParse(prefix);
        return pepCmp(pepPublic(v), s) >= 0 && pepEqual({ wild: true, v: pv }, v);
    }
  }
  var pip = {
    name: 'pip',
    normalizeVersion: function (v) { var p = pepParse(v); return p ? pepStr(p) : null; },
    parse: function (c) {
      var items = c.split(',').map(function (s) { return s.trim(); }).filter(function (s) { return s; });
      var specs = [];
      for (var i = 0; i < items.length; i++) { var sp = pepSpec(items[i]); if (!sp) return { valid: false }; specs.push(sp); }
      return {
        valid: true,
        normalized: specs.length ? specs.map(function (sp) { return sp.op + sp.raw; }).join(', ') : '(any)',
        prereleaseInSpec: specs.some(function (sp) { return sp.v && isPre(sp.v) && !sp.wild && sp.op !== '!='; }),
        test: function (vs) {
          var v = pepParse(vs); if (!v) return null;
          return specs.every(function (sp) { return pepContains(sp, v); });
        }
      };
    }
  };

  // =================================================================
  // RubyGems
  // =================================================================
  var GEM_VP = '[0-9]+(?:\\.[0-9a-zA-Z]+)*(?:-[0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*)?';
  var GEM_ANCHORED = new RegExp('^\\s*(' + GEM_VP + ')?\\s*$');
  var GEM_REQ = new RegExp('^\\s*(=|!=|>|<|>=|<=|~>)?\\s*(' + GEM_VP + ')\\s*$');
  function gemVersion(s) {
    var str = String(s).trim().replace(/-/g, '.pre.');
    if (str === '') str = '0';
    var segs = (str.match(/[0-9]+|[a-z]+/gi) || []).map(function (x) { return /^\d+$/.test(x) ? x.replace(/^0+(?=.)/, '') : x; });
    return { str: str, segs: segs };
  }
  function isNum(x) { return /^\d+$/.test(x); }
  function gemCanon(v) {
    var si = v.segs.findIndex(function (x) { return !isNum(x); });
    var nums = si === -1 ? v.segs.slice() : v.segs.slice(0, si), strs = si === -1 ? [] : v.segs.slice(si);
    var strip = function (a) { while (a.length && a[a.length - 1] === '0') a.pop(); return a; };
    return strip(nums).concat(strip(strs));
  }
  function gemCmp(a, b) {
    if (a.str === b.str) return 0;
    var l = gemCanon(a), r = gemCanon(b);
    if (l.join('.') === r.join('.') && l.length === r.length) return 0;
    var lim = Math.max(l.length, r.length);
    for (var i = 0; i < lim; i++) {
      var x = l[i] === undefined ? '0' : l[i], y = r[i] === undefined ? '0' : r[i];
      if (x === y) continue;
      var xn = isNum(x), yn = isNum(y);
      if (!xn && yn) return -1;
      if (xn && !yn) return 1;
      if (xn) return cmpNumStr(x, y);
      return x < y ? -1 : 1;
    }
    return 0;
  }
  function gemIsPre(v) { return /[a-zA-Z]/.test(v.str); }
  function gemRelease(v) {
    if (!gemIsPre(v)) return v;
    var s = v.segs.slice();
    while (s.some(function (x) { return !isNum(x); })) s.pop();
    return gemVersion(s.join('.'));
  }
  function gemBump(v) {
    var s = v.segs.slice();
    while (s.some(function (x) { return !isNum(x); })) s.pop();
    if (s.length > 1) s.pop();
    s[s.length - 1] = String(BigInt(s[s.length - 1]) + 1n);
    return gemVersion(s.join('.'));
  }
  var GEM_OPS = {
    '=': function (v, r) { return gemCmp(v, r) === 0; },
    '!=': function (v, r) { return gemCmp(v, r) !== 0; },
    '>': function (v, r) { return gemCmp(v, r) > 0; },
    '<': function (v, r) { return gemCmp(v, r) < 0; },
    '>=': function (v, r) { return gemCmp(v, r) >= 0; },
    '<=': function (v, r) { return gemCmp(v, r) <= 0; },
    '~>': function (v, r) { return gemCmp(v, r) >= 0 && gemCmp(gemRelease(v), gemBump(r)) < 0; }
  };
  var rubygems = {
    name: 'rubygems',
    normalizeVersion: function (v) { return GEM_ANCHORED.test(v) ? gemVersion(v).str : null; },
    parse: function (c) {
      var parts = c.split(',');
      while (parts.length && parts[parts.length - 1] === '') parts.pop();
      parts = parts.map(function (p) { return p.trim(); });
      var reqs = [];
      for (var i = 0; i < parts.length; i++) {
        var m = GEM_REQ.exec(parts[i]);
        if (!m) return { valid: false };
        reqs.push({ op: m[1] || '=', v: gemVersion(m[2]) });
      }
      if (!reqs.length) reqs.push({ op: '>=', v: gemVersion('0') });
      return {
        valid: true,
        normalized: reqs.map(function (r) { return r.op + ' ' + r.v.str; }).join(', '),
        test: function (vs) {
          if (!GEM_ANCHORED.test(vs)) return null;
          var v = gemVersion(vs);
          return reqs.every(function (r) { return GEM_OPS[r.op](v, r.v); });
        }
      };
    }
  };

  var VCC = { npm: npm, cargo: cargo, composer: composer, pip: pip, rubygems: rubygems, ecosystems: ['npm', 'cargo', 'composer', 'pip', 'rubygems'] };
  if (typeof module !== 'undefined' && module.exports) module.exports = VCC; else root.VCC = VCC;
})(typeof globalThis !== 'undefined' ? globalThis : this);
