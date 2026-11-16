#!/bin/sh
# Real tests: 1) engine vs recorded answers of the real Node 22 resolver, 2) when this Node is 22.x: fresh random
# packages resolved by Node itself (import via its internal defaultResolve, require via require.resolve), 3) MCP protocol, 4) .mcpb.
set -e
cd "$(dirname "$0")"
node test.js --fixtures
case "$(node --version)" in
  v22.*) node test.js --oracle 200 "$(date +%s | cut -c6-10)" ;;
  *) echo "Node $(node --version) is not 22: recorded answers only" ;;
esac
PJ='{"name":"mylib","type":"module","main":"./dist/index.cjs","exports":{".":{"types":"./dist/index.d.ts","import":"./dist/index.js","require":"./dist/index.cjs"},"./utils/*":"./dist/utils/*.js","./old/":"./dist/old/","./internal/*":null},"imports":{"#fs":"fs"}}'
FILES='["dist/index.js","dist/index.cjs","dist/index.d.ts","dist/utils/a.js","package.json"]'
OUT=$(printf '%s\n' \
 '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"t","version":"1"}}}' \
 '{"jsonrpc":"2.0","id":2,"method":"tools/list"}' \
 "{\"jsonrpc\":\"2.0\",\"id\":3,\"method\":\"tools/call\",\"params\":{\"name\":\"resolve_package_import\",\"arguments\":{\"package_json\":$PJ,\"files\":$FILES,\"specifier\":\"mylib\"}}}" \
 "{\"jsonrpc\":\"2.0\",\"id\":4,\"method\":\"tools/call\",\"params\":{\"name\":\"resolve_package_import\",\"arguments\":{\"package_json\":$PJ,\"files\":$FILES,\"specifier\":\"mylib/internal/x\",\"mode\":\"import\"}}}" \
 "{\"jsonrpc\":\"2.0\",\"id\":5,\"method\":\"tools/call\",\"params\":{\"name\":\"list_package_exports\",\"arguments\":{\"package_json\":$PJ,\"files\":$FILES}}}" \
 "{\"jsonrpc\":\"2.0\",\"id\":6,\"method\":\"tools/call\",\"params\":{\"name\":\"resolve_package_import\",\"arguments\":{\"package_dir\":\"/nonexistent\",\"specifier\":\"x\"}}}" \
 "{\"jsonrpc\":\"2.0\",\"id\":7,\"method\":\"tools/call\",\"params\":{\"name\":\"resolve_package_import\",\"arguments\":{\"package_json\":$PJ,\"specifier\":\"#fs\"}}}" \
 | node server.js)
printf "%s\n" "$OUT" | grep -q '"name":"list_package_exports"' || { echo "tools/list KO"; exit 1; }
printf "%s\n" "$OUT" | grep '"id":3' | grep -q 'import: ./dist/index.js (import), module; require: ./dist/index.cjs (require), commonjs' || { echo "resolve KO"; echo "$OUT" | grep '"id":3' | head -c 600; exit 1; }
printf "%s\n" "$OUT" | grep '"id":4' | grep -q 'ERR_PACKAGE_PATH_NOT_EXPORTED' || { echo "not exported KO"; exit 1; }
printf "%s\n" "$OUT" | grep '"id":5' | grep -q 'removed in Node 17' || { echo "lint KO"; exit 1; }
printf "%s\n" "$OUT" | grep '"id":6' | grep -q '"isError":true' || { echo "error handling KO"; exit 1; }
printf "%s\n" "$OUT" | grep '"id":7' | grep -q 'ERR_INVALID_URL_SCHEME' || { echo "imports builtin KO"; exit 1; }
echo "MCP protocol OK"
if command -v unzip >/dev/null 2>&1 && [ -f dist/package-exports-1.0.0.mcpb ]; then
  X=$(mktemp -d) && unzip -q dist/package-exports-1.0.0.mcpb -d "$X" && printf '%s\n' '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node "$X/server.js" | grep -q resolve_package_import && echo ".mcpb OK"
fi
