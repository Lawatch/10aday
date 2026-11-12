# Random constraints/versions to stress the engine beyond the hand-picked set. Usage: python3 gen_fuzz.py SEED > fuzz/inputs.json
import json, random, sys
r = random.Random(int(sys.argv[1]) if len(sys.argv) > 1 else 1)
nums = ['0', '1', '2', '3', '10', '01', '00']
pres = ['', '', '', '-rc.1', '-beta', '-alpha.2', 'rc1', 'a1', '.pre', '-dev', '.post1', '.dev0', '-RC2', 'b2', '+build', '-0', '-1']
def ver(maxparts=4):
    n = r.choice([1, 2, 3, 3, 3, 4][:maxparts + 2])
    s = '.'.join(r.choice(nums[:5] if r.random() < .85 else nums) for _ in range(n))
    if r.random() < .25: s += r.choice(pres)
    if r.random() < .03: s = 'v' + s
    return s
ops = ['', '=', '==', '!=', '>', '>=', '<', '<=', '~', '^', '~>', '~=', '===', '<>']
def atom():
    k = r.random()
    if k < .1: return r.choice(['*', 'x', '1.*', '1.2.*', '0.x', '2.x.x', '1.X', '1.2.x', '*.*', '1.*.*'])
    if k < .15: return ver() + ' - ' + ver()
    o = r.choice(ops)
    return o + (' ' if r.random() < .2 else '') + ver() + ('.*' if o in ('==', '!=', '') and r.random() < .1 else '')
def constraint():
    k = r.random()
    if k < .55: return atom()
    if k < .75: return r.choice([', ', ',', ' ']).join(atom() for _ in range(2))
    return r.choice([' || ', '||', ' | ']).join(atom() for _ in range(2))
cs, vs = [], []
while len(cs) < 400:
    c = constraint()
    if c not in cs: cs.append(c)
while len(vs) < 60:
    v = ver()
    if v not in vs: vs.append(v)
print(json.dumps({"constraints": cs, "versions": vs}, indent=1))
