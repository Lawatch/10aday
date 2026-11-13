#!/usr/bin/env python3
"""Builds the one-click install file for Claude Desktop (MCP Bundle, .mcpb = zip with manifest.json at the root).
Deterministic: fixed file order and timestamps, so the SHA-256 in server.json stays valid.
Usage: python3 build_mcpb.py  ->  dist/version-range-mcp-<version>.mcpb and its sha256 on stdout."""
import hashlib, json, os, zipfile

HERE = os.path.dirname(os.path.abspath(__file__))
manifest = json.load(open(os.path.join(HERE, 'mcpb', 'manifest.json')))
files = [('manifest.json', os.path.join(HERE, 'mcpb', 'manifest.json')), ('server.js', os.path.join(HERE, 'server.js'))]
for f in sorted(os.listdir(os.path.join(HERE, 'engines'))):
    files.append(('engines/' + f, os.path.join(HERE, 'engines', f)))
os.makedirs(os.path.join(HERE, 'dist'), exist_ok=True)
out = os.path.join(HERE, 'dist', 'version-range-mcp-%s.mcpb' % manifest['version'])
with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z:
    for arc, src in files:
        info = zipfile.ZipInfo(arc, date_time=(2026, 1, 1, 0, 0, 0))
        info.compress_type = zipfile.ZIP_DEFLATED
        info.external_attr = 0o644 << 16
        z.writestr(info, open(src, 'rb').read())
print(os.path.relpath(out, HERE), hashlib.sha256(open(out, 'rb').read()).hexdigest())
