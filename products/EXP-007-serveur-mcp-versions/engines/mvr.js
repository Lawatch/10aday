/* Maven version ranges — JavaScript port of Maven Resolver 1.9.24
 * (org.eclipse.aether.util.version: GenericVersion, GenericVersionRange,
 * GenericVersionScheme.parseVersionConstraint), the code Maven 3.9.x uses to
 * order versions and resolve dependency ranges. Apache License 2.0.
 * Checked against the real Java classes: see oracle/ in this folder. */
(function (root) {
  'use strict';
  var K_MAX = 8, K_BIGINT = 5, K_INT = 4, K_STRING = 3, K_QUAL = 2, K_MIN = 0;
  var QUAL = { alpha: -5, beta: -4, milestone: -3, cr: -2, rc: -2, snapshot: -1, ga: 0, 'final': 0, release: 0, '': 0, sp: 1 };
  function item(kind, value) { return { kind: kind, value: value }; }
  function isNum(it) { return (it.kind & K_QUAL) === 0; }
  function isDigit(c) { return c >= '0' && c <= '9'; }
  function cmpBig(a, b) { // decimal strings without leading zeros
    if (a.length !== b.length) return a.length < b.length ? -1 : 1;
    return a < b ? -1 : a > b ? 1 : 0;
  }
  function cmpStrCI(a, b) { // Java String.compareToIgnoreCase (ASCII + simple fold)
    var n = Math.min(a.length, b.length);
    for (var i = 0; i < n; i++) {
      var x = a.charAt(i), y = b.charAt(i);
      if (x !== y) {
        x = x.toUpperCase(); y = y.toUpperCase();
        if (x !== y) {
          x = x.toLowerCase(); y = y.toLowerCase();
          if (x !== y) return x.charCodeAt(0) - y.charCodeAt(0);
        }
      }
    }
    return a.length - b.length;
  }
  function itemCmp(a, b) {
    if (b == null) {
      switch (a.kind) {
        case K_MIN: return -1;
        case K_MAX: case K_BIGINT: case K_STRING: return 1;
        default: return a.value; // INT or QUALIFIER
      }
    }
    var rel = a.kind - b.kind;
    if (rel !== 0) return rel;
    switch (a.kind) {
      case K_MAX: case K_MIN: return 0;
      case K_BIGINT: return cmpBig(a.value, b.value);
      case K_INT: case K_QUAL: return a.value - b.value;
      case K_STRING: return cmpStrCI(a.value, b.value);
    }
    return 0;
  }
  function tokenize(version) {
    var v = version.length > 0 ? version : '0', len = v.length, index = 0, out = [];
    while (index < len) {
      var state = -2, start = index, end = len, termNum = false;
      for (; index < len; index++) {
        var c = v.charAt(index);
        if (c === '.' || c === '-' || c === '_') { end = index; index++; break; }
        if (isDigit(c)) {
          if (state === -1) { end = index; termNum = true; break; }
          if (state === 0) start++;
          state = (state > 0 || c !== '0') ? 1 : 0;
        } else {
          if (state >= 0) { end = index; break; }
          state = -1;
        }
      }
      var token, number;
      if (end - start > 0) { token = v.substring(start, end); number = state >= 0; }
      else { token = '0'; number = true; }
      out.push(toItem(token, number, termNum, index >= len));
    }
    return out;
  }
  function toItem(token, number, termNum, atEnd) {
    if (number) {
      if (token.length < 10) return item(K_INT, parseInt(token, 10));
      return item(K_BIGINT, token.replace(/^0+(?=\d)/, ''));
    }
    var low = token.toLowerCase();
    if (atEnd) {
      if (low === 'min') return item(K_MIN, 'min');
      if (low === 'max') return item(K_MAX, 'max');
    }
    if (termNum && token.length === 1) {
      if (low === 'a') return item(K_QUAL, QUAL.alpha);
      if (low === 'b') return item(K_QUAL, QUAL.beta);
      if (low === 'm') return item(K_QUAL, QUAL.milestone);
    }
    if (Object.prototype.hasOwnProperty.call(QUAL, low)) return item(K_QUAL, QUAL[low]);
    return item(K_STRING, low);
  }
  function trimPadding(items) {
    var number = null, end = items.length - 1;
    for (var i = end; i > 0; i--) {
      var it = items[i];
      if (isNum(it) !== number) { end = i; number = isNum(it); }
      if (end === i && (i === items.length - 1 || isNum(items[i - 1]) === isNum(it)) && itemCmp(it, null) === 0) {
        items.splice(i, 1); end--;
      }
    }
    return items;
  }
  function parse(version) { return { raw: version, items: trimPadding(tokenize(version)) }; }
  function padCmp(items, index, number) {
    var rel = 0;
    for (var i = index; i < items.length; i++) {
      var it = items[i];
      if (number != null && number !== isNum(it)) continue;
      rel = itemCmp(it, null);
      if (rel !== 0) break;
    }
    return rel;
  }
  function compareParsed(A, B) {
    var a = A.items, b = B.items, number = true;
    for (var i = 0; ; i++) {
      if (i >= a.length && i >= b.length) return 0;
      if (i >= a.length) return -padCmp(b, i, null);
      if (i >= b.length) return padCmp(a, i, null);
      var x = a[i], y = b[i];
      if (isNum(x) !== isNum(y)) {
        return number === isNum(x) ? padCmp(a, i, number) : -padCmp(b, i, number);
      }
      var rel = itemCmp(x, y);
      if (rel !== 0) return rel;
      number = isNum(x);
    }
  }
  function sign(n) { return n < 0 ? -1 : n > 0 ? 1 : 0; }
  function compare(a, b) { return sign(compareParsed(parse(a), parse(b))); }
  function describe(v) { // tokens as Maven Resolver prints them
    return parse(v).items.map(function (it) {
      if (it.kind === K_QUAL) {
        for (var k in QUAL) if (QUAL[k] === it.value && k !== '' && k !== 'cr' && k !== 'final' && k !== 'release') return k;
      }
      return String(it.value);
    });
  }
  function err(msg) { var e = new Error(msg); e.mavenInvalid = true; return e; }
  function parseRange(range) {
    var loInc, hiInc, lo, hi;
    if (range.charAt(0) === '[') loInc = true; else if (range.charAt(0) === '(') loInc = false;
    else throw err('a range must start with [ or (');
    var last = range.charAt(range.length - 1);
    if (last === ']') hiInc = true; else if (last === ')') hiInc = false;
    else throw err('a range must end with ] or )');
    var p = range.substring(1, range.length - 1), idx = p.indexOf(',');
    if (idx < 0) {
      if (!loInc || !hiInc) throw err('a single version must be surrounded by [ ]');
      var ver = p.trim();
      if (/\.\*$/.test(ver)) {
        var prefix = ver.substring(0, ver.length - 1);
        lo = { v: prefix + 'min', p: parse(prefix + 'min') };
        hi = { v: prefix + 'max', p: parse(prefix + 'max') };
      } else { lo = { v: ver, p: parse(ver) }; hi = lo; }
    } else {
      var l = p.substring(0, idx).trim(), h = p.substring(idx + 1).trim();
      if (h.indexOf(',') >= 0) throw err('bounds may not contain an extra ","');
      lo = l.length ? { v: l, p: parse(l) } : null;
      hi = h.length ? { v: h, p: parse(h) } : null;
      if (lo && hi && compareParsed(hi.p, lo.p) < 0) throw err('lower bound must not be greater than upper bound');
    }
    return { lo: lo ? { v: lo.v, p: lo.p, inc: loInc } : null, hi: hi ? { v: hi.v, p: hi.p, inc: hiInc } : null };
  }
  function rangeContains(r, vp) {
    if (r.lo) { var c = compareParsed(r.lo.p, vp); if ((c === 0 && !r.lo.inc) || c > 0) return false; }
    if (r.hi) { var d = compareParsed(r.hi.p, vp); if ((d === 0 && !r.hi.inc) || d < 0) return false; }
    return true;
  }
  /* Returns {soft:true, version} for a bare version, or {ranges:[...]}; throws (e.mavenInvalid) when Maven would refuse it. */
  function parseConstraint(c) {
    var process = c, ranges = [];
    while (process.charAt(0) === '[' || process.charAt(0) === '(') {
      var i1 = process.indexOf(')'), i2 = process.indexOf(']'), index = i2;
      if (i2 < 0 || (i1 >= 0 && i1 < i2)) index = i1;
      if (index < 0) throw err('unbounded version range (missing ] or ))');
      ranges.push(parseRange(process.substring(0, index + 1)));
      process = process.substring(index + 1).trim();
      if (process.charAt(0) === ',') process = process.substring(1).trim();
    }
    if (process.length > 0 && ranges.length) throw err('expected [ or ( but got "' + process + '"');
    if (!ranges.length) return { soft: true, version: c, p: parse(c) };
    return { ranges: ranges };
  }
  function contains(constraint, version) {
    var C = typeof constraint === 'string' ? parseConstraint(constraint) : constraint;
    var vp = parse(version);
    if (C.soft) return compareParsed(C.p, vp) === 0;
    for (var i = 0; i < C.ranges.length; i++) if (rangeContains(C.ranges[i], vp)) return true;
    return false;
  }
  var api = { parse: parse, compare: compare, describe: describe, parseConstraint: parseConstraint, contains: contains };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.MVR = api;
})(this);
