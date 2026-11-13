/* Gradle dynamic versions — JavaScript port of Gradle 8.14.3
 * (org.gradle.api.internal.artifacts.ivyservice.ivyresolve.strategy:
 * VersionParser, StaticVersionComparator, DefaultVersionSelectorScheme,
 * VersionRangeSelector, SubVersionSelector, ExactVersionSelector,
 * LatestVersionSelector). Apache License 2.0.
 * Checked against the real Gradle classes: see oracle/ in this folder. */
(function (root) {
  'use strict';
  var SPECIAL = { dev: -1, rc: 1, snapshot: 2, 'final': 3, ga: 4, release: 5, sp: 6 };
  var LONG_MAX = '9223372036854775807';
  function isDigit(c) { return c >= '0' && c <= '9'; }
  function tryLong(s) { // Guava Longs.tryParse for an all-ASCII-digit or non-digit part
    if (s.length === 0) return null;
    for (var i = 0; i < s.length; i++) if (!isDigit(s.charAt(i))) return null;
    var t = s.replace(/^0+(?=.)/, '');
    if (t.length > 19 || (t.length === 19 && t > LONG_MAX)) return null;
    return t; // normalized decimal string
  }
  function cmpNum(a, b) { if (a.length !== b.length) return a.length < b.length ? -1 : 1; return a < b ? -1 : a > b ? 1 : 0; }
  function parse(original) {
    var parts = [], digit = false, startPart = 0, pos = 0, endBase = 0, endBaseStr = 0;
    for (; pos < original.length; pos++) {
      var ch = original.charAt(pos);
      if (ch === '.' || ch === '_' || ch === '-' || ch === '+') {
        parts.push(original.substring(startPart, pos)); startPart = pos + 1; digit = false;
        if (ch !== '.' && endBaseStr === 0) { endBase = parts.length; endBaseStr = pos; }
      } else if (isDigit(ch)) {
        if (!digit && pos > startPart) {
          if (endBaseStr === 0) { endBase = parts.length + 1; endBaseStr = pos; }
          parts.push(original.substring(startPart, pos)); startPart = pos;
        }
        digit = true;
      } else {
        if (digit) {
          if (endBaseStr === 0) { endBase = parts.length + 1; endBaseStr = pos; }
          parts.push(original.substring(startPart, pos)); startPart = pos;
        }
        digit = false;
      }
    }
    if (pos > startPart) parts.push(original.substring(startPart, pos));
    return { source: original, parts: parts, nums: parts.map(tryLong),
      base: endBaseStr > 0 ? original.substring(0, endBaseStr) : original, qualified: endBaseStr > 0 };
  }
  function compare(a, b) {
    var v1 = typeof a === 'string' ? parse(a) : a, v2 = typeof b === 'string' ? parse(b) : b;
    if (v1.source === v2.source) return 0;
    var p1 = v1.parts, p2 = v2.parts, n1 = v1.nums, n2 = v2.nums, i = 0;
    for (; i < p1.length && i < p2.length; i++) {
      if (p1[i] === p2[i]) continue;
      var is1 = n1[i] !== null, is2 = n2[i] !== null;
      if (is1 && !is2) return 1;
      if (is2 && !is1) return -1;
      if (is1 && is2) { var r = cmpNum(n1[i], n2[i]); if (r === 0) continue; return r; }
      var s1 = SPECIAL[p1[i].toLowerCase()], s2 = SPECIAL[p2[i].toLowerCase()];
      if (s1 !== undefined) return s1 - (s2 === undefined ? 0 : s2);
      if (s2 !== undefined) return -s2;
      return p1[i] < p2[i] ? -1 : 1;
    }
    if (i < p1.length) return n1[i] === null ? -1 : 1;
    if (i < p2.length) return n2[i] === null ? 1 : -1;
    return 0;
  }
  // VersionRangeSelector regexes, built exactly like the Java constants
  var ANY = '[^\\s,\\[\\]\\]\\(\\]\\[\\[\\)\\(\\)]';
  var SEP = '\\s*\\,\\s*', OPEN = '[\\[\\]\\(]', CLOSE = '[\\]\\[\\)]';
  var FINITE = OPEN + '\\s*(' + ANY + '+)' + SEP + '(' + ANY + '+)\\s*' + CLOSE;
  var LOWER_INF = '\\(' + SEP + '(' + ANY + '+)\\s*' + CLOSE;
  var UPPER_INF = OPEN + '\\s*(' + ANY + '+)' + SEP + '\\)';
  var SINGLE = '\\[\\s*(' + ANY + '+)\\]';
  function full(p) { return new RegExp('^(?:' + p + ')$'); }
  var R_FINITE = full(FINITE), R_LOWER = full(LOWER_INF), R_UPPER = full(UPPER_INF), R_SINGLE = full(SINGLE);
  var R_ALL = full(FINITE + '|' + LOWER_INF + '|' + UPPER_INF + '|' + SINGLE);
  function parseSelector(s) {
    var m;
    if (R_ALL.test(s)) {
      var r;
      if ((m = R_FINITE.exec(s))) r = { lower: m[1], lowerInc: s.charAt(0) === '[', upper: m[2], upperInc: s.charAt(s.length - 1) === ']' };
      else if ((m = R_LOWER.exec(s))) r = { lower: null, lowerInc: true, upper: m[1], upperInc: s.charAt(s.length - 1) === ']' };
      else if ((m = R_UPPER.exec(s))) r = { lower: m[1], lowerInc: s.charAt(0) === '[', upper: null, upperInc: true };
      else { m = R_SINGLE.exec(s); r = { lower: m[1], lowerInc: true, upper: m[1], upperInc: true }; }
      if (r.lower !== null && r.lower === r.upper && r.lowerInc && r.upperInc) return { kind: 'exact', selector: s, version: r.upper, fromRange: true };
      r.kind = 'range'; r.selector = s;
      r.lowerV = r.lower === null ? null : parse(r.lower); r.upperV = r.upper === null ? null : parse(r.upper);
      return r;
    }
    if (s.charAt(s.length - 1) === '+') return { kind: 'prefix', selector: s, prefix: s.substring(0, s.length - 1) };
    if (s.indexOf('latest.') === 0) return { kind: 'latest', selector: s, status: s.substring(7) };
    return { kind: 'exact', selector: s, version: s };
  }
  function accept(sel, candidate) {
    if (typeof sel === 'string') sel = parseSelector(sel);
    switch (sel.kind) {
      case 'exact': return sel.version === '' || sel.version === candidate;
      case 'prefix': return candidate.indexOf(sel.prefix) === 0;
      case 'latest': return true; // only meaningful with metadata, see acceptStatus
      case 'range':
        var v = parse(candidate), c;
        if (sel.lower !== null) { c = compare(v, sel.lowerV); if (!(c >= (sel.lowerInc ? 0 : 1))) return false; }
        if (sel.upper === null) return true;
        c = compare(v, sel.upperV);
        if (sel.upperInc) return c <= 0;
        return c <= -1 && candidate.indexOf(sel.upper) !== 0;
    }
    return false;
  }
  // Maven repositories: status "integration" for -SNAPSHOT versions, else "release" (status scheme integration < milestone < release)
  var SCHEME = ['integration', 'milestone', 'release'];
  function statusOf(v) { return /-SNAPSHOT$/.test(v) ? 'integration' : 'release'; }
  function acceptStatus(sel, candidate) {
    var si = SCHEME.indexOf(sel.status), ci = SCHEME.indexOf(statusOf(candidate));
    return si >= 0 && si <= ci;
  }
  // Which version Gradle picks from a list of published versions for a single declaration: the highest accepted one.
  function select(selector, versions) {
    var sel = typeof selector === 'string' ? parseSelector(selector) : selector, best = null, ok = [];
    for (var i = 0; i < versions.length; i++) {
      var v = versions[i];
      var yes = sel.kind === 'latest' ? acceptStatus(sel, v) : accept(sel, v);
      if (yes) { ok.push(v); if (best === null || compare(v, best) > 0) best = v; }
    }
    if (sel.kind === 'exact') best = sel.version; // a static version is used as written (if it exists)
    return { selector: sel, accepted: ok, chosen: best };
  }
  var api = { parse: parse, compare: compare, parseSelector: parseSelector, accept: accept, select: select, statusOf: statusOf };
  if (typeof module === 'object' && module.exports) module.exports = api; else root.GVR = api;
})(this);
