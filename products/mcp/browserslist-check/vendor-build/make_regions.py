#!/usr/bin/env python3
"""Writes regions-map.js: a static require() of every caniuse-lite region, so esbuild can bundle them."""
import os, sys
d = os.path.join(sys.argv[1] if len(sys.argv) > 1 else '.', 'node_modules/caniuse-lite/data/regions')
regs = sorted(f[:-3] for f in os.listdir(d) if f.endswith('.js'))
lines = ['globalThis.__BL_REGIONS = {'] + ['  %s: require("caniuse-lite/data/regions/%s.js"),' % (repr(r) if '-' in r else r, r) for r in regs] + ['};']
open('regions-map.js', 'w').write('\n'.join(lines) + '\n')
