"""Oracle: compare rpc.js per-version verdicts with Python `packaging` (pip's implementation).
Usage: node dump.js > /tmp/r.json && python3 oracle.py /tmp/r.json"""
import json, sys
from packaging.specifiers import SpecifierSet
from packaging.version import Version
data = json.load(open(sys.argv[1]))
bad = n = 0
for case in data:
    spec = case['spec']
    try:
        ss = SpecifierSet(spec)
    except Exception:
        ss = None
    if (ss is None) != (not case['valid']):
        print('validity mismatch', case['input']); bad += 1; continue
    if ss is None:
        continue
    for v, got in case['grid'].items():
        n += 1
        exp = Version(v) in ss  # interpreter versions are final releases
        if exp != got:
            bad += 1
            if bad < 20: print('MISMATCH', spec, v, 'packaging', exp, 'rpc', got)
print(f'{n} checks, {bad} mismatches')
sys.exit(1 if bad else 0)
