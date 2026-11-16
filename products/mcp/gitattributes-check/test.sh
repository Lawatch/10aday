#!/bin/sh
# Real tests: 1) engine vs the real `git check-attr -a` on random cases, 2) MCP protocol end to end.
set -e
cd "$(dirname "$0")"
node test.js 400 7
OUT=$(printf '%s\n' \
 '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"t","version":"1"}}}' \
 '{"jsonrpc":"2.0","id":2,"method":"tools/list"}' \
 '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"check_attributes","arguments":{"gitattributes":"* text=auto\n*.png binary\nvendor/ linguist-vendored\n","paths":["logo.png","vendor/lib.js"]}}}' \
 '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"explain_gitattributes","arguments":{"gitattributes":"!*.md text\n"}}}' \
 | node server.js)
printf "%s\n" "$OUT" | grep -q '"name":"check_attributes"' || { echo "tools/list KO"; exit 1; }
printf "%s\n" "$OUT" | grep '"id":3' | grep -q 'via_macro' || { echo "check_attributes KO"; echo "$OUT"; exit 1; }
printf "%s\n" "$OUT" | grep '"id":3' | grep -q 'not inherited' || { echo "check_attributes notes KO"; exit 1; }
printf "%s\n" "$OUT" | grep '"id":4' | grep -q 'Negative patterns' || { echo "explain_gitattributes KO"; exit 1; }
echo "MCP protocol OK"
