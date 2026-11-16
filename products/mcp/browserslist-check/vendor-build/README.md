# How browserslist.bundle.js is made

The bundle is the real browserslist + caniuse-lite + baseline-browser-mapping code and data, unchanged, in one file
(so the MCP server needs no `npm install`). Only two `require()` calls with a computed path are replaced by a lookup in
static tables (regions, features), and the "data is old" console warning is silenced (stdout is the MCP channel).

```sh
mkdir /tmp/b && cp entry.js build.js make_regions.py /tmp/b && cd /tmp/b
npm init -y && npm install browserslist@4.29.6 caniuse-lite@1.0.30001826 baseline-browser-mapping@2.11.37 esbuild
python3 make_regions.py . && node build.js <repo>/products/mcp/browserslist-check/browserslist.bundle.js
```
