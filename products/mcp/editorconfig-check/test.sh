#!/bin/sh
# Real tests: 1) engine vs the reference EditorConfig core (npm "editorconfig"): recorded answers, then live random
# cases when npm can install it, 2) MCP protocol end to end.
set -e
cd "$(dirname "$0")"
node test.js --fixtures
if [ -z "$ORACLE" ] && command -v npm >/dev/null 2>&1; then
  ORACLE=$(mktemp -d) && (cd "$ORACLE" && npm init -y >/dev/null && npm install --silent --no-audit --no-fund editorconfig@4 >/dev/null 2>&1) || ORACLE=""
fi
if [ -n "$ORACLE" ] && [ -d "$ORACLE/node_modules/editorconfig" ]; then ORACLE="$ORACLE" node test.js 1500 31; else echo "reference core not installable here: recorded answers only"; fi
OUT=$(printf '%s\n' \
 '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"t","version":"1"}}}' \
 '{"jsonrpc":"2.0","id":2,"method":"tools/list"}' \
 '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"check_editorconfig","arguments":{"editorconfig":"root = true\n[*]\nindent_style = space\nindent_size = 2\n[*.{js}]\nindent_size = 4\n[Makefile]\nindent_style = tab\n","paths":["src/app.js","Makefile"]}}}' \
 '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"lint_editorconfig","arguments":{"editorconfig":"[*]\nindent_sise = 2\nindent_size = 4 # four\nnot a line\n"}}}' \
 | node server.js)
printf "%s\n" "$OUT" | grep -q '"name":"check_editorconfig"' || { echo "tools/list KO"; exit 1; }
printf "%s\n" "$OUT" | grep '"id":3' | grep -q '"section":"\[Makefile\]"' || { echo "check_editorconfig KO"; echo "$OUT"; exit 1; }
printf "%s\n" "$OUT" | grep '"id":3' | grep -q '{js}' && { echo "check_editorconfig KO: [*.{js}] must not match"; exit 1; }
printf "%s\n" "$OUT" | grep '"id":4' | grep -q 'Did you mean' || { echo "lint_editorconfig KO"; exit 1; }
printf "%s\n" "$OUT" | grep '"id":4' | grep -q 'every line below it is ignored' || { echo "lint_editorconfig parse error KO"; exit 1; }
echo "MCP protocol OK"
