/* nvr.js — NuGet version ranges, ported line by line from NuGet.Versioning
 * (NuGet/NuGet.Client, src/NuGet.Core/NuGet.Versioning, Apache-2.0, commit 7e935f9 of 2026-11-12).
 * Covers: NuGetVersion.TryParse, VersionComparer (VersionRelease), VersionRange.Parse (with floating),
 * FloatRange, VersionRange.Satisfies / IsBetter / FindBestMatch, ToNormalizedString / PrettyPrint.
 * Tested against the real NuGet.Versioning package (nvr/oracle) and real `dotnet restore` (nvr/real_restore). */
(function (root) {
  'use strict';
  var INT_MAX = 2147483647;
  function isDigit(c) { return c >= '0' && c <= '9'; }
  function isWs(c) { return /\s/.test(c) && c !== '﻿'; }
  function isLDD(c) { return /^[0-9A-Za-z-]$/.test(c); }
  function isValidPart(s, allowLeadingZeros) {
    if (s.length === 0) return false;
    if (!allowLeadingZeros && s.length > 1 && s[0] === '0') {
      var allDigits = true;
      for (var i = 1; i < s.length; i++) if (!isDigit(s[i])) { allDigits = false; break; }
      if (allDigits) return false;
    }
    for (var j = 0; j < s.length; j++) if (!isLDD(s[j])) return false;
    return true;
  }
  function isValid(s, allowLeadingZeros) {
    var parts = s.split('.');
    for (var i = 0; i < parts.length; i++) if (!isValidPart(parts[i], allowLeadingZeros)) return false;
    return true;
  }
  function parseSections(value) {
    var r = { versionString: null, releaseLabels: null, buildMetadata: null };
    var versionEndPos = -1, plusPos = -1, end = false;
    for (var i = 0; i < value.length; i++) {
      end = (i === value.length - 1);
      if (versionEndPos < 0) {
        if (end || value[i] === '-' || value[i] === '+') {
          var endPos = i + (end ? 1 : 0);
          r.versionString = value.substring(0, endPos);
          versionEndPos = i;
          if (value[i] === '+') plusPos = i;
        }
      } else if (plusPos < 0) {
        if (end || value[i] === '+') {
          var start = versionEndPos + 1, endPos2 = i + (end ? 1 : 0);
          r.releaseLabels = value.substring(start, endPos2).split('.');
          plusPos = i;
        }
      } else if (end) {
        r.buildMetadata = value.substring(plusPos + 1, i + 1);
      }
    }
    return r;
  }
  function parseSection(str, start) { // returns {ok, end, n}
    if (start === str.length) return { ok: true, end: start, n: 0 };
    var end;
    for (end = start; end < str.length; ++end) {
      var c = str[end];
      if (!isWs(c)) { if (isDigit(c)) break; else return { ok: false }; }
    }
    var done = false, digitFound = false, n = 0;
    for (; end < str.length; ++end) {
      var ch = str[end];
      if (isDigit(ch)) {
        digitFound = true; n = n * 10 + (ch.charCodeAt(0) - 48);
        if (n > INT_MAX) return { ok: false };
      } else if (ch === '.') {
        ++end; if (end === str.length) return { ok: false };
        done = true; break;
      } else if (isWs(ch)) break;
      else return { ok: false };
    }
    if (!digitFound) return { ok: false };
    if (end === str.length) done = true;
    if (!done) {
      for (; end < str.length; ++end) {
        var c2 = str[end];
        if (!isWs(c2)) {
          if (c2 === '.') { ++end; if (end === str.length) return { ok: false }; break; }
          return { ok: false };
        }
      }
    }
    return { ok: true, end: end, n: n };
  }
  function tryGetNormalizedVersion(str) {
    if (str == null || str.trim() === '' || !/\S/.test(str)) return null;
    var nums = [], pos = 0;
    for (var k = 0; k < 4; k++) {
      var s = parseSection(str, pos);
      if (!s.ok) return null;
      nums.push(s.n); pos = s.end;
    }
    if (pos !== str.length) return null;
    return nums;
  }
  function V(major, minor, patch, rev, labels, meta) {
    return { major: major, minor: minor, patch: patch, revision: rev || 0, labels: labels || null, metadata: meta || '' };
  }
  function isPrerelease(v) {
    if (v.labels) for (var i = 0; i < v.labels.length; i++) if (v.labels[i]) return true;
    return false;
  }
  function release(v) { return v.labels ? v.labels.join('.') : ''; }
  function parseVersion(value) {
    if (value == null) return null;
    var t = value.replace(/^\s+|\s+$/g, '');
    var sec = parseSections(t);
    if (!sec.versionString) return null;
    var nums = tryGetNormalizedVersion(sec.versionString);
    if (!nums) return null;
    if (sec.releaseLabels) for (var i = 0; i < sec.releaseLabels.length; i++)
      if (!isValidPart(sec.releaseLabels[i], false)) return null;
    if (sec.buildMetadata != null && !isValid(sec.buildMetadata, true)) return null;
    var v = V(nums[0], nums[1], nums[2], nums[3], sec.releaseLabels, sec.buildMetadata || '');
    v.original = value.replace(/ /g, '');
    return v;
  }
  // .NET int.TryParse on a label made of [0-9A-Za-z-]
  function labelInt(s) {
    if (!/^-?[0-9]+$/.test(s)) return null;
    var n = parseInt(s, 10);
    if (n > INT_MAX || n < -INT_MAX - 1) return null;
    return n;
  }
  function cmpStrIgnoreCase(a, b) {
    var x = a.toUpperCase(), y = b.toUpperCase();
    return x < y ? -1 : x > y ? 1 : 0;
  }
  function compareRelease(a, b) {
    var na = labelInt(a), nb = labelInt(b);
    if (na !== null && nb !== null) return na < nb ? -1 : na > nb ? 1 : 0;
    if (na !== null) return -1;
    if (nb !== null) return 1;
    return cmpStrIgnoreCase(a, b);
  }
  function c3(a, b) { return a < b ? -1 : a > b ? 1 : 0; }
  // VersionComparer.VersionRelease (== Default: metadata ignored)
  function compare(x, y) {
    var r = c3(x.major, y.major) || c3(x.minor, y.minor) || c3(x.patch, y.patch) || c3(x.revision, y.revision);
    if (r) return r;
    var xl = isPrerelease(x) ? x.labels : null, yl = isPrerelease(y) ? y.labels : null;
    if (xl && !yl) return -1;
    if (!xl && yl) return 1;
    if (xl && yl) {
      var n = Math.max(xl.length, yl.length);
      for (var i = 0; i < n; i++) {
        if (i >= xl.length) return -1;
        if (i >= yl.length) return 1;
        r = compareRelease(xl[i], yl[i]);
        if (r) return r;
      }
    }
    return 0;
  }
  function normalized(v) {
    var s = v.major + '.' + v.minor + '.' + v.patch + (v.revision > 0 ? '.' + v.revision : '');
    if (isPrerelease(v)) s += '-' + release(v);
    return s;
  }
  function full(v) { return normalized(v) + (v.metadata ? '+' + v.metadata : ''); }

  // ---- FloatRange
  var FB = { None: 'None', Prerelease: 'Prerelease', Revision: 'Revision', Patch: 'Patch', Minor: 'Minor', Major: 'Major',
    AbsoluteLatest: 'AbsoluteLatest', PrereleaseRevision: 'PrereleaseRevision', PrereleasePatch: 'PrereleasePatch',
    PrereleaseMinor: 'PrereleaseMinor', PrereleaseMajor: 'PrereleaseMajor' };
  function includePrerelease(b) { return /^(AbsoluteLatest|Prerelease|PrereleaseMajor|PrereleaseMinor|PrereleasePatch|PrereleaseRevision)$/.test(b); }
  function makeFloat(behavior, minVersion, releasePrefix) {
    if (releasePrefix == null && minVersion && isPrerelease(minVersion)) releasePrefix = release(minVersion);
    if (behavior === FB.AbsoluteLatest && releasePrefix == null) releasePrefix = '';
    if (includePrerelease(behavior) && releasePrefix == null) throw new Error('releasePrefix null');
    return { behavior: behavior, min: minVersion, prefix: releasePrefix };
  }
  function countParts(s) { var n = 1; for (var i = 0; i < s.length; i++) if (s[i] === '.') n++; return n; }
  function parseFloat_(vs) {
    if (vs == null || !/\S/.test(vs)) return null;
    var first = vs.indexOf('*'), last = vs.lastIndexOf('*'), prefix = null, v;
    if (vs.length === 1 && first === 0) return makeFloat(FB.Major, V(0, 0, 0, 0));
    if (vs === '*-*') return makeFloat(FB.AbsoluteLatest, parseVersion('0.0.0-0'), '');
    if (first !== last && last !== -1 && vs.indexOf('+') === -1) {
      var behavior = FB.None, dash = vs.indexOf('-'), actual = null;
      if (dash !== -1 && last === vs.length - 1 && first === dash - 1) {
        var stable = vs.substring(0, dash - 1) + '0';
        var p = countParts(stable);
        behavior = p === 1 ? FB.PrereleaseMajor : p === 2 ? FB.PrereleaseMinor : p === 3 ? FB.PrereleasePatch : p === 4 ? FB.PrereleaseRevision : FB.None;
        var rel = vs.substring(dash + 1);
        prefix = rel.substring(0, rel.length - 1);
        var relPart = prefix;
        if (prefix.length === 0 || /\.$/.test(prefix)) relPart += '0';
        actual = stable + '-' + relPart;
      }
      v = actual == null ? null : parseVersion(actual);
      return v ? makeFloat(behavior, v, prefix) : null;
    } else if (last === vs.length - 1 && vs.indexOf('+') === -1) {
      var beh = FB.None, act = vs.substring(0, vs.length - 1);
      if (vs.indexOf('-') === -1) {
        act += '0';
        var parts = countParts(act);
        if (parts === 2) beh = FB.Minor; else if (parts === 3) beh = FB.Patch; else if (parts === 4) beh = FB.Revision;
      } else {
        beh = FB.Prerelease;
        if (vs.indexOf('-') === vs.lastIndexOf('-')) {
          prefix = act.substring(vs.lastIndexOf('-') + 1);
          if (prefix.length === 0 || /\.$/.test(act)) act += '0';
          else if (/-$/.test(act)) act += '-';
        }
      }
      v = parseVersion(act);
      return v ? makeFloat(beh, v, prefix) : null;
    }
    v = parseVersion(vs);
    return v ? makeFloat(FB.None, v) : null;
  }
  function startsWithI(s, p) { return s.toUpperCase().indexOf(p.toUpperCase()) === 0; }
  function floatSatisfies(f, v) {
    var b = f.behavior, m = f.min, pre = isPrerelease(v);
    if (b === FB.AbsoluteLatest) return true;
    if (b === FB.Major && !pre) return true;
    var relOk = (pre && startsWithI(release(v), f.prefix)) || !pre;
    if (includePrerelease(b)) {
      if (b === FB.PrereleaseRevision) return m.major === v.major && m.minor === v.minor && m.patch === v.patch && relOk;
      if (b === FB.PrereleasePatch) return m.major === v.major && m.minor === v.minor && relOk;
      if (b === FB.PrereleaseMinor) return m.major === v.major && relOk;
      if (b === FB.PrereleaseMajor) return relOk;
      if (b === FB.Prerelease) return m.major === v.major && m.minor === v.minor && m.patch === v.patch && m.revision === v.revision && relOk;
    } else if (b === FB.Revision) return m.major === v.major && m.minor === v.minor && m.patch === v.patch && !pre;
    else if (b === FB.Patch) return m.major === v.major && m.minor === v.minor && !pre;
    else if (b === FB.Minor) return m.major === v.major && !pre;
    return false;
  }
  function floatString(f) {
    var m = f.min;
    switch (f.behavior) {
      case FB.None: return normalized(m);
      case FB.Prerelease: return m.major + '.' + m.minor + '.' + m.patch + (m.revision > 0 ? '.' + m.revision : '') + '-' + f.prefix + '*';
      case FB.Revision: return m.major + '.' + m.minor + '.' + m.patch + '.*';
      case FB.Patch: return m.major + '.' + m.minor + '.*';
      case FB.Minor: return m.major + '.*';
      case FB.Major: return '*';
      case FB.PrereleaseRevision: return m.major + '.' + m.minor + '.' + m.patch + '.*-' + f.prefix + '*';
      case FB.PrereleasePatch: return m.major + '.' + m.minor + '.*-' + f.prefix + '*';
      case FB.PrereleaseMinor: return m.major + '.*-' + f.prefix + '*';
      case FB.PrereleaseMajor: return '*-' + f.prefix + '*';
      case FB.AbsoluteLatest: return '*-*';
    }
    return '';
  }

  // ---- VersionRange
  function parseRange(value, allowFloating) {
    if (allowFloating === undefined) allowFloating = true;
    if (value == null) return null;
    var t = value.replace(/^\s+|\s+$/g, '');
    if (!t) return null;
    if (allowFloating && t === '*')
      return mkRange(V(0, 0, 0, 0), true, null, true, parseFloat_(t));
    var minS = null, maxS = null, minInc = false, maxInc = false, minV = null, maxV = null, fl = null;
    if (t[0] === '(' || t[0] === '[') {
      minInc = t[0] === '[';
      var lastC = t[t.length - 1];
      if (lastC === ']') maxInc = true; else if (lastC === ')') maxInc = false; else return null;
      // C# Substring(1, len-2) throws when len < 2; a 1-char "[" falls into the ']' check above and fails
      var inner = t.substring(1, t.length - 1);
      var parts = inner.split(',');
      if (parts.length > 2) return null;
      if (parts.every(function (p) { return p === ''; })) return null;
      if (parts.length === 1 && !(minInc && maxInc)) return null;
      minS = parts[0]; maxS = parts.length === 2 ? parts[1] : parts[0];
    } else { minInc = true; minS = t; }
    if (minS != null && /\S/.test(minS)) {
      if (allowFloating && minS.indexOf('*') !== -1) {
        fl = parseFloat_(minS);
        if (fl) minV = fl.min; else return null;
      } else { minV = parseVersion(minS); if (!minV) return null; }
    }
    if (maxS != null && /\S/.test(maxS)) { maxV = parseVersion(maxS); if (!maxV) return null; }
    if (minV && maxV) {
      var r = compare(minV, maxV);
      if (r > 0) return null;
      if (r === 0 && (minInc !== maxInc)) return null;
    }
    return mkRange(minV, minInc, maxV, maxInc, fl);
  }
  function mkRange(minV, minInc, maxV, maxInc, fl) {
    // VersionRangeBase: a missing bound is never inclusive
    return { min: minV, minInc: minV ? minInc : false, max: maxV, maxInc: maxV ? maxInc : false, float: fl || null };
  }
  function isFloating(r) { return !!(r.float && r.float.behavior !== FB.None); }
  function satisfies(r, v) {
    var ok = true;
    if (r.min) ok = ok && (r.minInc ? compare(r.min, v) <= 0 : compare(r.min, v) < 0);
    if (r.max) ok = ok && (r.maxInc ? compare(r.max, v) >= 0 : compare(r.max, v) > 0);
    return ok;
  }
  function hasPrereleaseBounds(r) { return (r.min && isPrerelease(r.min)) || (r.max && isPrerelease(r.max)); }
  // Why a version is not a candidate: null (candidate), 'prerelease', 'outside'
  function exclusion(r, v) {
    var fb = r.float ? r.float.behavior : null;
    if (!hasPrereleaseBounds(r) && isPrerelease(v) && !(fb && includePrerelease(fb))) return 'prerelease';
    if (!satisfies(r, v)) return 'outside';
    return null;
  }
  function isBetter(r, cur, con) {
    if (cur === con) return false;
    if (con == null) return false;
    if (exclusion(r, con)) return false;
    if (cur == null) return true;
    if (isFloating(r)) {
      var ci = floatSatisfies(r.float, cur), ni = floatSatisfies(r.float, con);
      if (ci && !ni) return false;
      if (ni && !ci) return true;
      if (ci && ni) return compare(cur, con) < 0;
      var cl = compare(cur, r.float.min) < 0, nl = compare(con, r.float.min) < 0;
      if (cl && !nl) return true;
      if (!cl && nl) return false;
      if (!cl && !nl) return compare(cur, con) > 0;
      return compare(cur, con) < 0;
    }
    return compare(cur, con) > 0;
  }
  function findBestMatch(r, versions) {
    var best = null;
    for (var i = 0; i < versions.length; i++) if (isBetter(r, best, versions[i])) best = versions[i];
    return best;
  }
  function rangeNormalized(r) {
    var s = (r.min && r.minInc) ? '[' : '(';
    if (r.min) s += isFloating(r) ? floatString(r.float) : normalized(r.min);
    s += ', ';
    if (r.max) s += normalized(r.max);
    return s + ((r.max && r.maxInc) ? ']' : ')');
  }
  function rangeShort(r) { // ToShortString ("A")
    if (r.min && r.minInc && !r.max) return isFloating(r) ? floatString(r.float) : normalized(r.min);
    if (r.min && r.max && r.minInc && r.maxInc && compare(r.min, r.max) === 0) return '[' + normalized(r.min) + ']';
    return rangeNormalized(r);
  }
  function prettyPrint(r, showFloating) { // "P" / "F"
    if (!r.min && !r.max) return '';
    var s = '(';
    if (r.min && r.max && compare(r.max, r.min) === 0 && r.minInc && r.maxInc) s += '= ' + normalized(r.min);
    else {
      if (r.min) s += '>' + (r.minInc ? '= ' : ' ') + ((isFloating(r) && showFloating) ? floatString(r.float) : normalized(r.min));
      if (r.min && r.max) s += ' && ';
      if (r.max) s += '<' + (r.maxInc ? '= ' : ' ') + normalized(r.max);
    }
    return s + ')';
  }
  var api = { parseVersion: parseVersion, compare: compare, normalized: normalized, full: full, isPrerelease: isPrerelease,
    parseRange: parseRange, satisfies: satisfies, exclusion: exclusion, findBestMatch: findBestMatch, isFloating: isFloating,
    floatSatisfies: floatSatisfies, floatString: floatString, rangeNormalized: rangeNormalized, rangeShort: rangeShort,
    prettyPrint: prettyPrint };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.NVR = api;
})(this);
