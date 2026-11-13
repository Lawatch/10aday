/* gpv.js — Go module pseudo-versions, in JavaScript.
 * Line-by-line port of golang.org/x/mod v0.43.0: semver/semver.go and module/pseudo.go (BSD-3-Clause, The Go Authors).
 * Tested against the Go code itself: see oracle/ and test_gpv.js. Built by AI agents (10aday). */
(function (root) {
  'use strict';
  function isDigit(c) { return c >= '0' && c <= '9'; }
  function isIdentChar(c) { return (c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z') || isDigit(c) || c === '-'; }
  function isBadNum(v) { var i = 0; while (i < v.length && isDigit(v[i])) i++; return i === v.length && i > 1 && v[0] === '0'; }
  function isNum(v) { var i = 0; while (i < v.length && isDigit(v[i])) i++; return i === v.length; }
  function parseInt_(v) {
    if (v === '' || !isDigit(v[0])) return null;
    var i = 1; while (i < v.length && isDigit(v[i])) i++;
    if (v[0] === '0' && i !== 1) return null;
    return [v.slice(0, i), v.slice(i)];
  }
  function parsePrerelease(v) {
    if (v === '' || v[0] !== '-') return null;
    var i = 1, start = 1;
    while (i < v.length && v[i] !== '+') {
      if (!isIdentChar(v[i]) && v[i] !== '.') return null;
      if (v[i] === '.') { if (start === i || isBadNum(v.slice(start, i))) return null; start = i + 1; }
      i++;
    }
    if (start === i || isBadNum(v.slice(start, i))) return null;
    return [v.slice(0, i), v.slice(i)];
  }
  function parseBuild(v) {
    if (v === '' || v[0] !== '+') return null;
    var i = 1, start = 1;
    while (i < v.length) {
      if (!isIdentChar(v[i]) && v[i] !== '.') return null;
      if (v[i] === '.') { if (start === i) return null; start = i + 1; }
      i++;
    }
    if (start === i) return null;
    return [v.slice(0, i), v.slice(i)];
  }
  function parse(v) {
    if (typeof v !== 'string' || v === '' || v[0] !== 'v') return null;
    var p = { major: '', minor: '', patch: '', short: '', prerelease: '', build: '' }, r;
    if (!(r = parseInt_(v.slice(1)))) return null; p.major = r[0]; v = r[1];
    if (v === '') { p.minor = '0'; p.patch = '0'; p.short = '.0.0'; return p; }
    if (v[0] !== '.') return null;
    if (!(r = parseInt_(v.slice(1)))) return null; p.minor = r[0]; v = r[1];
    if (v === '') { p.patch = '0'; p.short = '.0'; return p; }
    if (v[0] !== '.') return null;
    if (!(r = parseInt_(v.slice(1)))) return null; p.patch = r[0]; v = r[1];
    if (v.length > 0 && v[0] === '-') { if (!(r = parsePrerelease(v))) return null; p.prerelease = r[0]; v = r[1]; }
    if (v.length > 0 && v[0] === '+') { if (!(r = parseBuild(v))) return null; p.build = r[0]; v = r[1]; }
    if (v !== '') return null;
    return p;
  }
  function isValid(v) { return parse(v) !== null; }
  function canonical(v) {
    var p = parse(v); if (!p) return '';
    if (p.build !== '') return v.slice(0, v.length - p.build.length);
    if (p.short !== '') return v + p.short;
    return v;
  }
  function major(v) { var p = parse(v); return p ? v.slice(0, 1 + p.major.length) : ''; }
  function prerelease(v) { var p = parse(v); return p ? p.prerelease : ''; }
  function build(v) { var p = parse(v); return p ? p.build : ''; }
  function compareInt(x, y) { if (x === y) return 0; if (x.length !== y.length) return x.length < y.length ? -1 : 1; return x < y ? -1 : 1; }
  function nextIdent(x) { var i = 0; while (i < x.length && x[i] !== '.') i++; return [x.slice(0, i), x.slice(i)]; }
  function comparePrerelease(x, y) {
    if (x === y) return 0; if (x === '') return 1; if (y === '') return -1;
    while (x !== '' && y !== '') {
      x = x.slice(1); y = y.slice(1);
      var a = nextIdent(x), b = nextIdent(y), dx = a[0], dy = b[0]; x = a[1]; y = b[1];
      if (dx !== dy) {
        var ix = isNum(dx), iy = isNum(dy);
        if (ix !== iy) return ix ? -1 : 1;
        if (ix && dx.length !== dy.length) return dx.length < dy.length ? -1 : 1;
        return dx < dy ? -1 : 1;
      }
    }
    return x === '' ? -1 : 1;
  }
  function compare(v, w) {
    var pv = parse(v), pw = parse(w);
    if (!pv && !pw) return 0; if (!pv) return -1; if (!pw) return 1;
    return compareInt(pv.major, pw.major) || compareInt(pv.minor, pw.minor) || compareInt(pv.patch, pw.patch) || comparePrerelease(pv.prerelease, pw.prerelease);
  }

  var pseudoRE = /^v[0-9]+\.(0\.0-|\d+\.\d+-([^+]*\.)?0\.)\d{14}-[A-Za-z0-9]+(\+[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?$/;
  function count(s, c) { return s.split(c).length - 1; }
  function isPseudo(v) { return count(v, '-') >= 2 && isValid(v) && pseudoRE.test(v); }
  function incDecimal(d) {
    var a = d.split(''), i = a.length - 1;
    for (; i >= 0 && a[i] === '9'; i--) a[i] = '0';
    if (i >= 0) a[i] = String.fromCharCode(a[i].charCodeAt(0) + 1); else { a[0] = '1'; a.push('0'); }
    return a.join('');
  }
  function decDecimal(d) {
    var a = d.split(''), i = a.length - 1;
    for (; i >= 0 && a[i] === '0'; i--) a[i] = '9';
    if (i < 0) return '';
    if (i === 0 && a[i] === '1' && a.length > 1) a = a.slice(1); else a[i] = String.fromCharCode(a[i].charCodeAt(0) - 1);
    return a.join('');
  }
  /* timestamp: 14 digits "YYYYMMDDhhmmss" (UTC). */
  function make(maj, older, timestamp, rev) {
    if (maj === '') maj = 'v0';
    var segment = timestamp + '-' + rev, b = build(older);
    older = canonical(older);
    if (older === '') return maj + '.0.0-' + segment;
    if (prerelease(older) !== '') return older + '.0.' + segment + b;
    var i = older.lastIndexOf('.') + 1;
    return older.slice(0, i) + incDecimal(older.slice(i)) + '-0.' + segment + b;
  }
  function split(v) {
    if (!isPseudo(v)) return { err: 'syntax error' };
    var b = build(v); v = v.slice(0, v.length - b.length);
    var j = v.lastIndexOf('-'), rev = v.slice(j + 1); v = v.slice(0, j);
    var i = v.lastIndexOf('-'), k = v.lastIndexOf('.'), base, ts;
    if (k > i) { base = v.slice(0, k); ts = v.slice(k + 1); } else { base = v.slice(0, i); ts = v.slice(i + 1); }
    return { base: base, timestamp: ts, rev: rev, build: b };
  }
  function daysIn(m, y) { return [31, (y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1]; }
  /* Mirrors time.Parse("20060102150405", ts): returns ISO string or {err}. */
  function parseTime(ts) {
    var y = +ts.slice(0, 4), mo = +ts.slice(4, 6), d = +ts.slice(6, 8), h = +ts.slice(8, 10), mi = +ts.slice(10, 12), s = +ts.slice(12, 14);
    if (mo < 1 || mo > 12) return { err: 'month out of range' };
    if (d < 1 || d > 31) return { err: 'day out of range' };
    if (h > 23) return { err: 'hour out of range' };
    if (mi > 59) return { err: 'minute out of range' };
    if (s > 59) return { err: 'second out of range' };
    if (d > daysIn(mo, y)) return { err: 'day out of range' };
    return { iso: ts.slice(0, 4) + '-' + ts.slice(4, 6) + '-' + ts.slice(6, 8) + 'T' + ts.slice(8, 10) + ':' + ts.slice(10, 12) + ':' + ts.slice(12, 14) + 'Z' };
  }
  function pseudoTime(v) { var p = split(v); if (p.err) return p; var t = parseTime(p.timestamp); return t.err ? { err: 'malformed time "' + p.timestamp + '"' } : t; }
  function pseudoRev(v) { var p = split(v); return p.err ? p : { rev: p.rev }; }
  function pseudoBase(v) {
    var p = split(v); if (p.err) return p;
    var base = p.base, pre = prerelease(base);
    if (pre === '') {
      if (p.build !== '') return { err: 'lacks base version, but has build metadata "' + p.build + '"' };
      return { base: '' };
    }
    if (pre === '-0') {
      base = base.slice(0, base.length - 2);
      var i = base.lastIndexOf('.'), patch = decDecimal(base.slice(i + 1));
      if (patch === '') return { err: 'version before ' + base + ' would have negative patch number' };
      return { base: base.slice(0, i + 1) + patch + p.build };
    }
    return { base: base.slice(0, base.length - 2) + p.build };
  }
  function form(v) {
    var p = split(v); if (p.err) return 0;
    if (prerelease(p.base) === '') return 1;           /* vX.0.0-yyyymmddhhmmss-abcdef123456 */
    if (prerelease(p.base) === '-0') return 2;          /* vX.Y.(Z+1)-0.yyyymmddhhmmss-abc */
    return 3;                                           /* vX.Y.Z-pre.0.yyyymmddhhmmss-abc */
  }
  var api = { parse: parse, isValid: isValid, canonical: canonical, major: major, prerelease: prerelease, build: build, compare: compare,
    isPseudo: isPseudo, make: make, split: split, parseTime: parseTime, pseudoTime: pseudoTime, pseudoRev: pseudoRev, pseudoBase: pseudoBase,
    form: form, incDecimal: incDecimal, decDecimal: decDecimal };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.GPV = api;
})(this);
