#!/bin/sh
# Real tests: 1) recorded answers of the real browserslist + caniuse-lite (pinned, same versions as the bundle),
# 2) live random queries, configs and feature checks against the real packages installed by npm, 3) MCP protocol.
set -e
cd "$(dirname "$0")"
node test.js --fixtures
if [ -z "$ORACLE" ] && command -v npm >/dev/null 2>&1; then
  ORACLE=$(mktemp -d) && (cd "$ORACLE" && npm init -y >/dev/null && npm install --silent --no-audit --no-fund browserslist@4.29.6 caniuse-lite@1.0.30001826 baseline-browser-mapping@2.11.37 >/dev/null 2>&1) || ORACLE=""
fi
if [ -n "$ORACLE" ] && [ -d "$ORACLE/node_modules/browserslist" ]; then ORACLE="$ORACLE" node test.js 1500 17
else echo "browserslist not installable here: recorded answers only"; fi
OUT=$(printf '%s\n' \
 '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"t","version":"1"}}}' \
 '{"jsonrpc":"2.0","id":2,"method":"tools/list"}' \
 '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"resolve_browsers","arguments":{"config":"[production]\n> 0.5%\nlast 2 versions\nnot dead\n\n[development]\nlast 1 chrome version\n","env":"development"}}}' \
 '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"check_support","arguments":{"features":["css-has"],"query":"defaults, ie 11"}}}' \
 '{"jsonrpc":"2.0","id":5,"method":"tools/call","params":{"name":"find_feature","arguments":{"query":"subgrid"}}}' \
 | node server.js)
printf "%s\n" "$OUT" | grep -q '"name":"check_support"' || { echo "tools/list KO"; exit 1; }
printf "%s\n" "$OUT" | grep '"id":3' | grep -q '"count":1,' || { echo "resolve_browsers KO: development section"; printf '%s\n' "$OUT"; exit 1; }
printf "%s\n" "$OUT" | grep '"id":4' | grep -q '"ie":{"name":"IE"' || { echo "check_support KO: ie 11 not reported"; printf '%s\n' "$OUT"; exit 1; }
printf "%s\n" "$OUT" | grep '"id":5' | grep -q 'css-subgrid' || { echo "find_feature KO"; exit 1; }
echo "MCP protocol OK"
