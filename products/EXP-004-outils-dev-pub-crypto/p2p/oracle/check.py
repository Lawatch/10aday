# Oracle: poetry-core parse_constraint(c).allows(v) vs packaging SpecifierSet(p2p spec)
import json, sys, itertools
from poetry.core.constraints.version import parse_constraint, Version as PV
from packaging.specifiers import SpecifierSet
from packaging.version import Version
cases = json.load(open(sys.argv[1]))
probes = []
for a, b, c in itertools.product(range(0, 4), range(0, 6), range(0, 6)):
    probes.append(f"{a}.{b}.{c}")
probes += ['0','1','2','3','0.0','0.1','1.2','1.3','1.4','1.5','1.9','2.0','3.0','3.1','2024.0','2024.1','2024.9','2025.0','2025.0.0',
  '1.2.3.4','1.2.3.5','1.3.0.0','0.0.0.1','0.0.0.2','0.0.1.0','1.0.0rc1','1.0.0rc2','1.0.0a1','1.0.0','1.2.3b1','1.2.3b2','1.2.3a1',
  '1.2.3a1.dev2','1.2.3a1.dev3','1.2.dev0','1.2.post1','1.2.3.post1','1.4.2.post1','2.0.0.dev0','2.0.0a1','2.0.0rc1','1!1.2','1!1.2.3','1!2.0',
  '1.2.3+local','1.2.3+abc','1.2+x','1.5.0','1.5','1.4.5','1.9.9','0.3.0.dev0','2.7','3.0.1','3.1.4','3.2','1.1.1rc1','0.1.0','0.0.4','0.0.3.1']
bad = 0; total = 0; documented = 0; parse_mismatch = []
for case in cases:
    c = case['c']
    try:
        pc = parse_constraint(c); pok = True
    except Exception as e:
        pok = False
    jok = 'error' not in case
    if pok != jok:
        parse_mismatch.append((c, pok, case.get('error') or case.get('spec')))
        continue
    if not pok: continue
    if any('local label' in n for n in case.get('notes', [])):
        documented += 1; continue
    specs = [case['spec']] if case['spec'] is not None else case['groups']
    sets = []
    try:
        sets = [SpecifierSet(s) for s in specs]
    except Exception as e:
        print('INVALID PEP440 from p2p:', c, '->', specs, e); bad += 1; continue
    for p in probes:
        total += 1
        exp = pc.allows(PV.parse(p))
        got = any(s.contains(Version(p), prereleases=True) for s in sets)
        if exp != got:
            bad += 1
            if bad < 400: print('MISMATCH', repr(c), specs, p, 'poetry', exp, 'p2p', got)
print('parse mismatches:', len(parse_mismatch))
for m in parse_mismatch[:30]: print('  PARSE', m)
print(f'constraints: {len(cases)}, checks: {total}, mismatches: {bad}, documented local-label divergences skipped: {documented}')
sys.exit(1 if bad or parse_mismatch else 0)
