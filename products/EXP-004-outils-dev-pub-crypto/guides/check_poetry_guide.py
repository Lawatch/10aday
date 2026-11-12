# Cross-check of docs/tools/poetry-version-constraints/: each row (Poetry constraint, PEP 440 text) is compared with poetry-core.
# Usage: pip install poetry-core packaging; python3 guides/check_poetry_guide.py docs/tools/poetry-version-constraints/index.html
# Expected: the only diffs are the two rows of the "wrong translation" table (^1.2.3 -> ~=1.2.3, ^0.2 -> ~=0.2).
import itertools, re, sys, html
from poetry.core.constraints.version import parse_constraint, Version as PV
from packaging.specifiers import SpecifierSet
from packaging.version import Version
src = open(sys.argv[1]).read()
rows = re.findall(r'<tr><td><code>([^<]+)</code>(?:<br><small>[^<]*</small>)?</td><td(?: class="hl")?>(.*?)</td><td>', src)
probes = [f"{a}.{b}.{c}" for a,b,c in itertools.product(range(4),range(5),range(5))] + ['1.2.3rc1','2.0.0rc1','1.3.0a1','1.2.3.post1','0.2.3.post1','1.2.4.dev0']
n=bad=0
for c, pep in rows:
    c = html.unescape(c); peps = [html.unescape(x) for x in re.findall(r'<code>([^<]*)</code>', pep)]
    if pep.startswith('<code>""</code>'): peps=['']
    pc = parse_constraint(c); sets=[SpecifierSet(x) for x in peps]
    for p in probes:
        n+=1; a = pc.allows(PV.parse(p)); b = any(s.contains(Version(p), prereleases=True) for s in sets)
        if a!=b: bad+=1; print('DIFF', c, peps, p, 'poetry', a, 'pep440', b)
print(len(rows),'rows', n,'checks', bad,'diffs')
