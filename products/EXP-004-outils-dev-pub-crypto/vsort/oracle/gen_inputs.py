# Versions to order: a fixed list of known traps + random strings (seed = argv[1], 0 = fixed list only).
import json, random, sys
FIXED = """1.0.0 1.0 1 1.0.0.0 v1.0.0 1.0.0-alpha 1.0.0-alpha.1 1.0.0-alpha.2 1.0.0-alpha.10 1.0.0-alpha.beta 1.0.0-beta
1.0.0-beta.2 1.0.0-beta.11 1.0.0-rc.1 1.0.0-rc1 1.0.0rc1 1.0.0-RC1 1.0.0-rc.2 1.0.0+build.1 1.0.0+20130313144700 1.0.0-beta+exp.sha.5114f85
1.0.0a1 1.0.0b2 1.0.0c1 1.0.0.dev1 1.0.0.post1 1.0.0-1 1.0.0.post1.dev2 1.0.0a1.dev1 1!0.5 1.0.0+local.7 1.0.0+abc 1.0.post1
1.0.0-pre 1.0.0.pre 1.0.0.pre1 1.0.0-dev 1.0.0-patch1 1.0.0-pl1 1.0.0-p1 1.0.0-stable 1.0.0-snapshot 1.0.0-SNAPSHOT 1.0.0.a 1.0.0.b
1.9 1.10 1.9.0 1.10.0 1.2.3 1.2.10 1.2.03 01.2.3 1.02.3 2.0 2.0.0 2.0.0-0 2.0.0-0.3.7 2.0.0-x.7.z.92 2.0.0-x-y-z.-- 0.1 0.0.1 0.0.0 0
10.0.0 1.0.0.1 1.0.0.0.1 1.2.3.4.5 2024.01.15 20240115 1.0-beta 1.0beta 1.0-beta.1 1.0.0-alpha1 1.0.0-alpha-1 1.0.0-beta1
dev-master dev-main dev-feature 1.0.x-dev 2.x-dev 1.0.0-dev 1.0.0-alpha.0 1.0.0-0 1.0.0-00 1.0.0-a 1.0.0-A 1.0.0-Z 1.0.0-b.1
1.0.0.rc1 1.0.0.RC1 1.0.0-final 1.0.0-ga 1.0.0.post0 1.0.0.dev0 1.0.0a0 1.0.0-r1 1.0.0rev1 1.0.0-preview 1.0.0c 1.0.0-c
=1.2.3 v1.2.3-beta.1 V1.2.3 1.2.3- 1.2.3+ 1..2 1.2.3.beta1 1.2.3.beta.1 1.2.3-beta.1 1.2.3beta 99999999999999999999.0.0 18446744073709551616.0.0
3.10 3.9 3.10.0 3.12.0 3.12.1 3.13.0rc1 3.13.0-rc.1 4.0 0.10.0 0.9.0 0.0.10 0.0.9 1.0.0-alpha.1.1 1.0.0-alpha.1.a""".split()
seed = int(sys.argv[1]) if len(sys.argv) > 1 else 0
vs = list(dict.fromkeys(FIXED))
if seed:
    r = random.Random(seed); vs = []
    num = lambda: r.choice(['0', '1', '2', '9', '10', '01', '11', str(r.randint(0, 30))])
    tags = ['alpha', 'beta', 'rc', 'RC', 'a', 'b', 'c', 'pre', 'dev', 'post', 'patch', 'pl', 'p', 'x', 'Z', 'final', 'snapshot']
    seps = ['', '.', '-', '_']
    while len(vs) < 160:
        s = '.'.join(num() for _ in range(r.choice([1, 2, 3, 3, 3, 4])))
        for _ in range(r.choice([0, 0, 1, 1, 2])):
            s += r.choice(seps) + r.choice(tags) + r.choice(['', '', num(), '.' + num()])
        if r.random() < .15: s += '+' + r.choice(['build', '1', 'abc.5', 'local'])
        if r.random() < .05: s = 'v' + s
        vs.append(s)
    vs = list(dict.fromkeys(vs))
json.dump({'versions': vs}, sys.stdout, indent=0)
