# pip / PEP 440 — packaging.specifiers.SpecifierSet (what pip uses), default prerelease handling
# Range membership with prereleases=True: pip itself then skips pre-releases unless --pre, a pre-release in the specifier, or no final release matches.
import json, packaging
from packaging.specifiers import SpecifierSet, InvalidSpecifier
from packaging.version import Version, InvalidVersion
inp = json.load(open('inputs.json'))
out = {"tool": "packaging " + packaging.__version__, "results": {}}
def ver(v):
    try: return Version(v)
    except InvalidVersion: return None
for c in inp["constraints"]:
    try: s = SpecifierSet(c)
    except InvalidSpecifier: out["results"][c] = {"valid": False}; continue
    m = {}
    for v in inp["versions"]:
        pv = ver(v)
        m[v] = None if pv is None else bool(s.contains(pv, prereleases=True))
    out["results"][c] = {"valid": True, "range": str(s), "matches": m}
out["normalized_versions"] = {v: (str(ver(v)) if ver(v) else None) for v in inp["versions"]}
print(json.dumps(out, indent=1))
