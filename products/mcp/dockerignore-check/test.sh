#!/bin/sh
# Real tests: 1) engine vs the real Docker code (answers recorded from oracle/main.go; re-run live when Go is available),
# 2) MCP protocol end to end.
set -e
cd "$(dirname "$0")"
node test.js check fixtures/cases.jsonl fixtures/expected.jsonl
if command -v go >/dev/null 2>&1 && [ -z "$SKIP_LIVE_ORACLE" ]; then
  T=$(mktemp -d)
  if (cd oracle && go build -o "$T/oracle" . 2>/dev/null); then
    node test.js gen 2000 "$(date +%s)" > "$T/c.jsonl"
    "$T/oracle" < "$T/c.jsonl" > "$T/e.jsonl"
    node test.js check "$T/c.jsonl" "$T/e.jsonl"
  else echo "live oracle not built (no network?), recorded answers only"; fi
  rm -rf "$T"
fi
OUT=$(printf '%s\n' \
 '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"t","version":"1"}}}' \
 '{"jsonrpc":"2.0","id":2,"method":"tools/list"}' \
 '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"check_dockerignore","arguments":{"dockerignore":"*.log\nnode_modules\n!node_modules/keep\n","paths":["a.log","api/b.log","node_modules/x.js","node_modules/keep","api/.env"]}}}' \
 '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"explain_dockerignore","arguments":{"dockerignore":"*.log\n  # not a comment\n"}}}' \
 | node server.js)
printf "%s\n" "$OUT" | grep -q '"name":"check_dockerignore"' || { echo "tools/list KO"; exit 1; }
printf "%s\n" "$OUT" | grep '"id":3' | grep -q '\\"excluded\\": 2' || { echo "check_dockerignore KO"; echo "$OUT"; exit 1; }
printf "%s\n" "$OUT" | grep '"id":3' | grep -q 'Possible secrets' || { echo "secret warning KO"; exit 1; }
printf "%s\n" "$OUT" | grep '"id":4' | grep -q 'Not a comment' || { echo "explain_dockerignore KO"; exit 1; }
echo "MCP protocol OK"
