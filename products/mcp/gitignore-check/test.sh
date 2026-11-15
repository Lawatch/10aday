#!/bin/sh
# Real tests: 1) engine vs the real `git check-ignore` on random cases, 2) MCP protocol end to end.
set -e
cd "$(dirname "$0")"
node test.js 400 7
OUT=$(printf '%s\n' \
 '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"t","version":"1"}}}' \
 '{"jsonrpc":"2.0","id":2,"method":"tools/list"}' \
 '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"check_ignored","arguments":{"gitignore":"logs/\n!logs/keep.txt\n*.log\n!important.log\n","paths":["logs/keep.txt","app/debug.log","important.log","src/main.js"]}}}' \
 '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"explain_gitignore","arguments":{"gitignore":"logs/\n!logs/keep.txt\n"}}}' \
 | node server.js)
printf "%s\n" "$OUT" | grep -q '"name":"check_ignored"' || { echo "tools/list KO"; exit 1; }
printf "%s\n" "$OUT" | grep '"id":3' | grep -q '\\"ignored\\": 2' || { echo "check_ignored KO"; echo "$OUT"; exit 1; }
printf "%s\n" "$OUT" | grep '"id":4' | grep -q 'Has no effect' || { echo "explain_gitignore KO"; exit 1; }
echo "MCP protocol OK"
