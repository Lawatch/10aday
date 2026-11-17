#!/bin/sh
# Real tests: 1) recorded answers of the real loaders (util.parseEnv, Vite loadEnv, @next/env, npm dotenv + dotenv-expand),
# 2) live random cases against those loaders when npm can install them, 3) MCP protocol end to end.
set -e
cd "$(dirname "$0")"
node test.js --fixtures
if [ -z "$ORACLE" ] && command -v npm >/dev/null 2>&1; then
  ORACLE=$(mktemp -d) && (cd "$ORACLE" && npm init -y >/dev/null && npm install --silent --no-audit --no-fund dotenv@17.4.2 dotenv-expand@12.0.3 @next/env@16.4.6 vite@8.3.8 >/dev/null 2>&1) || ORACLE=""
fi
NODE_MAJOR=$(node -p "process.versions.node.split('.')[0]")
if [ "$NODE_MAJOR" -lt 22 ]; then echo "Node $NODE_MAJOR: its built-in .env parser is older than the one ported here, live comparison skipped"; ORACLE=""; fi
if [ -n "$ORACLE" ] && [ -d "$ORACLE/node_modules/vite" ]; then ORACLE="$ORACLE" node test.js 400 31; else echo "real loaders not installable here: recorded answers only"; fi
OUT=$(printf '%s\n' \
 '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"t","version":"1"}}}' \
 '{"jsonrpc":"2.0","id":2,"method":"tools/list"}' \
 '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"resolve_env","arguments":{"loader":"nextjs","mode":"production","files":{".env":"API=a\nPASS=ab#cd\n",".env.local":"API=local\n",".env.development":"API=dev\n"}}}}' \
 '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"compare_env_parsers","arguments":{"content":"A= \nB=2\n"}}}' \
 '{"jsonrpc":"2.0","id":5,"method":"tools/call","params":{"name":"parse_env_file","arguments":{"content":"garbage\nK=v\n","parser":"node"}}}' \
 | node server.js)
printf "%s\n" "$OUT" | grep -q '"name":"resolve_env"' || { echo "tools/list KO"; exit 1; }
printf "%s\n" "$OUT" | grep '"id":3' | grep -q '\\"value\\": \\"local\\"' || { echo "resolve_env KO"; echo "$OUT"; exit 1; }
printf "%s\n" "$OUT" | grep '"id":3' | grep -q 'cut at' || { echo "resolve_env # warning KO"; exit 1; }
printf "%s\n" "$OUT" | grep '"id":4' | grep -q '\\"node\\": \\"B=2\\"' || { echo "compare_env_parsers KO"; echo "$OUT"; exit 1; }
printf "%s\n" "$OUT" | grep '"id":5' | grep -q 'silently ignored' || { echo "parse_env_file KO"; exit 1; }
echo "MCP protocol OK"
