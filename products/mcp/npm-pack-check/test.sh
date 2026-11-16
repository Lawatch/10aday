#!/bin/sh
# Real tests: 1) engine vs the real npm code (npm-packlist 9 + Arborist 8, what npm 10 runs): recorded answers, then
# live random projects when npm can install them, plus the real "npm pack --dry-run" if npm 10 is here, 2) MCP protocol.
set -e
cd "$(dirname "$0")"
node test.js --fixtures
if [ -z "$ORACLE" ] && command -v npm >/dev/null 2>&1; then
  ORACLE=$(mktemp -d) && (cd "$ORACLE" && npm init -y >/dev/null && npm install --silent --no-audit --no-fund npm-packlist@9.0.0 @npmcli/arborist@8.0.5 >/dev/null 2>&1) || ORACLE=""
fi
if [ -n "$ORACLE" ] && [ -d "$ORACLE/node_modules/npm-packlist" ]; then
  ORACLE="$ORACLE" node test.js 1500 29
  case "$(npm --version 2>/dev/null)" in 10.*) NPM_PACK=1 ORACLE="$ORACLE" node test.js 40 37 ;; *) echo "npm is not 10.x here: real npm pack check skipped" ;; esac
else echo "npm code not installable here: recorded answers only"; fi
OUT=$(printf '%s\n' \
 '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"t","version":"1"}}}' \
 '{"jsonrpc":"2.0","id":2,"method":"tools/list"}' \
 '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"check_npm_pack","arguments":{"package_json":{"name":"demo","version":"1.0.0","main":"dist/index.js"},"paths":["src/index.ts","dist/index.js",".env","README.md","node_modules/x/index.js"],"ignore_files":{".gitignore":"node_modules\n.env\ndist\n",".npmignore":"src\n"}}}}' \
 '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"why_npm_pack","arguments":{"package_json":{"name":"demo","version":"1.0.0","files":["dist"]},"paths":["dist/a.js","dist/a.js.map"],"ignore_files":{"dist/.npmignore":"*.map\n"},"explain":["dist/a.js.map","README.md"]}}}' \
 | node server.js)
printf "%s\n" "$OUT" | grep -q '"name":"check_npm_pack"' || { echo "tools/list KO"; exit 1; }
printf "%s\n" "$OUT" | grep '"id":3' | grep -q 'gitignore_overridden' || { echo "check_npm_pack KO: .env leak not seen"; echo "$OUT"; exit 1; }
printf "%s\n" "$OUT" | grep '"id":3' | grep -q 'node_modules/x' && { echo "check_npm_pack KO: node_modules shipped"; exit 1; }
printf "%s\n" "$OUT" | grep '"id":4' | grep -q '"source\\\\":\\\\"dist/.npmignore\\\\"' || printf "%s\n" "$OUT" | grep '"id":4' | grep -q 'dist/.npmignore' || { echo "why_npm_pack KO"; echo "$OUT"; exit 1; }
echo "MCP protocol OK"
