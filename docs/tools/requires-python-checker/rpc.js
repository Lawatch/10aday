/* requires-python checker engine. Depends on VCC (vcc.js, pip/PEP 440) and P2P (p2p.js, Poetry → PEP 440).
 * Built by AI agents (10aday). Tested against Python `packaging` (see oracle.py). */
(function (root) {
  var VCC = root.VCC || (typeof require !== 'undefined' ? require('../vcc.js') : null);
  var P2P = root.P2P || (typeof require !== 'undefined' ? require('../p2p/p2p.js') : null);
  var MINORS = ['2.7'];
  for (var i = 0; i <= 16; i++) MINORS.push('3.' + i);
  MINORS.push('4.0');
  var MAXPATCH = 40; // patch releases probed per minor: x.y.0 … x.y.40

  function probe(test) { // per-minor coverage
    return MINORS.map(function (m) {
      var ok = [];
      for (var p = 0; p <= MAXPATCH; p++) ok.push(!!test(m + '.' + p));
      var n = ok.filter(Boolean).length, first = ok.indexOf(true), last = ok.lastIndexOf(true);
      var status = n === 0 ? 'none' : n === ok.length ? 'all' : 'partial';
      var label;
      if (status === 'partial') {
        var contiguous = n === last - first + 1;
        if (!contiguous) label = n === ok.length - 1 ? 'all except ' + m + '.' + ok.indexOf(false) : n + ' of ' + m + '.0–' + m + '.' + MAXPATCH + ' (gaps)';
        else if (first === last) label = 'only ' + m + '.' + first;
        else if (first === 0) label = m + '.0 to ' + m + '.' + last;
        else if (last === MAXPATCH) label = m + '.' + first + ' and later';
        else label = m + '.' + first + ' to ' + m + '.' + last;
      }
      return { minor: m, status: status, label: label || (status === 'all' ? 'all patches' : 'excluded'), ok: ok };
    });
  }

  function release(raw) { return raw.replace(/\.\*$/, '').split('.'); }

  function lint(items) {
    var w = [], hasLower = false, hasUpper = false;
    items.forEach(function (it) {
      var m = /^(~=|==|!=|<=|>=|<|>|===)\s*(.*)$/.exec(it); if (!m) return;
      var op = m[1], ver = m[2], rel = release(ver), wild = /\.\*$/.test(ver), short = rel.length <= 2 && /^\d+(\.\d+)?$/.test(ver.replace(/\.\*$/, ''));
      var next = rel.length === 2 ? rel[0] + '.' + (+rel[1] + 1) : null;
      if (op === '>=' || op === '>' || op === '~=' || (op === '==' )) hasLower = true;
      if (op === '<' || op === '<=' || op === '~=' || op === '==' || op === '===') hasUpper = true;
      if (op === '==' && !wild && short && rel.length === 2)
        w.push({ level: 'bad', text: '`' + it + '` matches **only ' + rel.join('.') + '.0**, not ' + rel.join('.') + '.1 or later (PEP 440 pads missing numbers with zeros). For “any ' + rel.join('.') + '.x”, write `==' + rel.join('.') + '.*` or `>=' + rel.join('.') + ',<' + next + '`.' });
      if (op === '<=' && short && rel.length === 2)
        w.push({ level: 'bad', text: '`' + it + '` stops at ' + rel.join('.') + '.0: **' + rel.join('.') + '.1 and later are excluded**. To allow all of ' + rel.join('.') + '.x, write `<' + next + '`.' });
      if (op === '>' && short && rel.length === 2)
        w.push({ level: 'warn', text: '`' + it + '` still allows ' + rel.join('.') + '.1, ' + rel.join('.') + '.2… (only ' + rel.join('.') + '.0 is excluded). If you meant “newer than ' + rel.join('.') + '”, write `>=' + next + '`.' });
      if (op === '~=' && rel.length === 2)
        w.push({ level: 'info', text: '`' + it + '` means `>=' + rel.join('.') + ',<' + (+rel[0] + 1) + '`: every ' + rel[0] + '.x from ' + rel.join('.') + ' on. In practice the same as `>=' + rel.join('.') + '`, with a cap at Python ' + (+rel[0] + 1) + '.' });
      if (op === '~=' && rel.length === 3)
        w.push({ level: 'warn', text: '`' + it + '` means `>=' + rel.join('.') + ',<' + rel[0] + '.' + (+rel[1] + 1) + '`: **only Python ' + rel[0] + '.' + rel[1] + '**. If you meant “' + rel[0] + '.' + rel[1] + ' or newer”, write `>=' + rel.join('.') + '`.' });
    });
    return { warnings: w, hasLower: hasLower, hasUpper: hasUpper };
  }

  function analyze(input) {
    var s = String(input).trim(), res = { input: s, warnings: [] };
    if (s === '') { res.valid = true; res.normalized = '(any)'; res.spec = ''; }
    var parsed = VCC.pip.parse(s);
    if (!parsed.valid) {
      res.valid = false;
      try { var pc = P2P.constraint(s); } catch (e) { pc = null; }
      if (pc && pc.spec) {
        res.suggestion = pc.spec;
        res.warnings.push({ level: 'bad', text: '`' + s + '` is Poetry syntax, not PEP 440: pip, uv and the `requires-python` field reject it. The equivalent is `' + pc.spec + '`' + (/<\d/.test(pc.spec) ? ' (and you can probably drop the upper bound: `' + pc.spec.split(',')[0] + '`)' : '') + '.' });
        parsed = VCC.pip.parse(pc.spec);
      } else {
        res.warnings.push({ level: 'bad', text: 'Not a valid PEP 440 specifier. Each clause needs an operator (`>=`, `<`, `==`, `!=`, `~=`, `>`, `<=`), clauses are separated by commas, and there is no “or”.' });
        return res;
      }
    } else res.valid = true;
    res.normalized = parsed.normalized;
    res.minors = probe(parsed.test);
    res.test = parsed.test;
    var items = (res.suggestion || s).split(',').map(function (x) { return x.trim(); }).filter(Boolean);
    var l = lint(items);
    res.warnings = res.warnings.concat(l.warnings);
    var any = res.minors.some(function (m) { return m.status !== 'none'; });
    if (!any) res.warnings.push({ level: 'bad', text: 'No Python release from 2.7 to 4.0 satisfies this: nothing can install the package.' });
    if (l.hasUpper && any) {
      var blocked = res.minors.filter(function (m) { return /^3\.1[3-5]$/.test(m.minor) && m.status !== 'all'; }).map(function (m) { return m.minor; });
      if (blocked.length && !(items.length === 1 && /^~=\d+\.\d+$/.test(items[0])))
        res.warnings.push({ level: 'warn', text: 'Upper cap: pip will refuse to install this on Python ' + blocked.join(', ') + ' and every later release. A new Python 3 minor ships every October, so a cap must be raised every year, and caps on libraries cannot be overridden by users. Most packaging guides recommend a lower bound only (e.g. `>=3.10`) unless the code is known to break.' });
    }
    if (!l.hasLower && any && res.minors[0].status !== 'none')
      res.warnings.push({ level: 'info', text: 'No lower bound: this claims Python 2.7 works. Add the oldest version you actually test, e.g. `>=3.9`.' });
    return res;
  }

  var RPC = { analyze: analyze, MINORS: MINORS, MAXPATCH: MAXPATCH };
  if (typeof module !== 'undefined' && module.exports) module.exports = RPC; else root.RPC = RPC;
})(typeof window !== 'undefined' ? window : this);
