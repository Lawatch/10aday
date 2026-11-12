# Oracle for python markers and whole dependencies: poetry-core Factory vs p2p PEP 508
import json, sys, itertools
from poetry.core.constraints.version import parse_constraint, Version as PV
from poetry.core.factory import Factory
from packaging.markers import Marker
from packaging.requirements import Requirement
from packaging.version import Version
d = json.load(open(sys.argv[1])); bad = 0; total = 0
grid = []
for maj, mi, pa in itertools.product([2, 3, 4], range(0, 14), [0, 1, 2, 4, 5]):
    grid.append((f'{maj}.{mi}', f'{maj}.{mi}.{pa}'))
def env(pv, pfv, plat='linux', impl='cpython'):
    return {'python_version': pv, 'python_full_version': pfv, 'sys_platform': plat, 'implementation_name': impl}
for case in d['py']:
    c, m = case['c'], case['m']
    if case['notes']: print('documented divergence:', c, '->', m); continue
    ref = Factory.create_dependency('x', {'version': '*', 'python': c}).to_pep_508()
    rm = Requirement(ref).marker
    mk = Marker(m) if m else None
    for pv, pfv in grid:
        total += 1
        exp = rm.evaluate(env(pv, pfv)) if rm else True
        got = mk.evaluate(env(pv, pfv)) if mk else True
        if exp != got:
            bad += 1
            if bad < 30: print('PY MISMATCH', c, '->', m, '| poetry:', ref, pfv, exp, got)
probes = ['0.18','0.19.0','0.20','1.0','1.2.3','1.2.9','1.3','1.4','1.4.9','1.5','1.9','2.0','2.30','2.31.0','2.99','3.0','4.2','4.9','5.0','306','307','1.26.4','2.0.1']
for dep in d['deps']:
    n, v, lines = dep['n'], dep['v'], dep['lines']
    pdeps = [Factory.create_dependency(n, x) for x in (v if isinstance(v, list) else [v])]
    assert len(pdeps) == len(lines), (n, lines)
    for pd, line in zip(pdeps, lines):
        r = Requirement(line)
        ref = pd.to_pep_508()
        rr = Requirement(ref)  # poetry's own PEP 508 string
        assert r.name == rr.name and set(r.extras) == set(rr.extras), (line, ref)
        assert (r.url or None) == (rr.url or None), ('URL', line, ref)
        for p in probes:
            total += 1
            if r.specifier.contains(Version(p), prereleases=True) != rr.specifier.contains(Version(p), prereleases=True):
                bad += 1; print('SPEC MISMATCH', line, '|', ref, p)
        for (pv, pfv), plat, impl in itertools.product(grid, ['linux', 'win32', 'darwin'], ['cpython', 'pypy']):
            total += 1
            e = env(pv, pfv, plat, impl)
            a = r.marker.evaluate(e) if r.marker else True
            b = rr.marker.evaluate(e) if rr.marker else True
            if a != b:
                bad += 1
                if bad < 60: print('MARKER MISMATCH', line, '|', ref, e)
        print('OK ' if bad == 0 else '?? ', line, '   [poetry: ' + ref + ']')
print(f'checks: {total}, mismatches: {bad}')
sys.exit(1 if bad else 0)
