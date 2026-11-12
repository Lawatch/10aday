# pip — packaging.version.Version ordering. Usage: python3 oracle_pip.py < inputs.json
import json, sys, packaging
from packaging.version import Version, InvalidVersion
vs = json.load(sys.stdin)['versions']
def p(v):
    try: return Version(v)
    except InvalidVersion: return None
P = [p(v) for v in vs]
cmp = [None if a is None else [None if b is None else (a > b) - (a < b) for b in P] for a in P]
print(json.dumps({'tool': 'packaging ' + packaging.__version__, 'canon': [None if a is None else str(a) for a in P], 'cmp': cmp}))
