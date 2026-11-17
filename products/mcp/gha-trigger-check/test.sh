#!/bin/sh
# Real tests: 1) GitHub's documented event rules + recorded answers of nektos/act's pattern code (Go),
# 2) live random comparison with act's Go code when Go can fetch it, 3) MCP protocol end to end.
set -e
cd "$(dirname "$0")"
node test.js --fixtures
if [ -z "$ORACLE" ] && command -v go >/dev/null 2>&1; then
  W=$(mktemp -d)
  if (cp oracle.go.txt "$W/main.go" && cd "$W" && go mod init oracle >/dev/null 2>&1 && go get github.com/nektos/act/pkg/workflowpattern@v0.2.98 >/dev/null 2>&1 && go build -o oracle . >/dev/null 2>&1); then ORACLE="$W/oracle"; fi
fi
if [ -n "$ORACLE" ]; then ORACLE="$ORACLE" node test.js 50000 $(date +%s); else echo "Go oracle not buildable here: recorded answers only"; fi
OUT=$(printf '%s\n' \
 '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"t","version":"1"}}}' \
 '{"jsonrpc":"2.0","id":2,"method":"tools/list"}' \
 '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"will_workflow_run","arguments":{"workflow":"on:\n  push:\n    branches: [main]\n    paths: [\"src/**\", \"!src/**/*.md\"]\n","branch":"main","changed_files":["src/a/README.md"]}}}' \
 '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"which_workflows_run","arguments":{"event":"pull_request","branch":"main","action":"labeled","workflows":{"a.yml":"on: pull_request\n","b.yml":"on:\n  pull_request:\n    types: [labeled]\n"}}}}' \
 '{"jsonrpc":"2.0","id":5,"method":"tools/call","params":{"name":"test_filter_patterns","arguments":{"patterns":["feature/*"],"names":["feature/a/b"],"list":"branches"}}}' \
 | node server.js)
printf "%s\n" "$OUT" | grep -q '"name":"will_workflow_run"' || { echo "tools/list KO"; exit 1; }
printf "%s\n" "$OUT" | grep '"id":3' | grep -q '"runs":false' || { echo "will_workflow_run KO"; echo "$OUT"; exit 1; }
printf "%s\n" "$OUT" | grep '"id":3' | grep -q 'src/\*\*/\*.md' || { echo "will_workflow_run reason KO"; exit 1; }
printf "%s\n" "$OUT" | grep '"id":4' | grep -q '"run":\["b.yml"\]' || { echo "which_workflows_run KO"; echo "$OUT"; exit 1; }
printf "%s\n" "$OUT" | grep '"id":5' | grep -q '"included":false' || { echo "test_filter_patterns KO"; echo "$OUT"; exit 1; }
echo "MCP protocol OK"
