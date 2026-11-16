#!/bin/sh
# Real tests: 1) engine vs npm's own code (@npmcli/arborist 8.0.5 loadVirtual = what npm 10 uses for `npm explain`
# and `npm ls --package-lock-only`): recorded answers, then fresh lockfiles made by the real npm when the registry
# is reachable, 2) MCP protocol, 3) the .mcpb file runs.
set -e
cd "$(dirname "$0")"
node test.js --fixtures
if [ -z "$ORACLE" ] && command -v npm >/dev/null 2>&1; then
  ORACLE=$(mktemp -d) && (cd "$ORACLE" && npm init -y >/dev/null && npm install --silent --no-audit --no-fund @npmcli/arborist@8.0.5 >/dev/null 2>&1) || ORACLE=""
fi
if [ -n "$ORACLE" ] && [ -d "$ORACLE/node_modules/@npmcli/arborist" ]; then
  W=$(mktemp -d)
  mk() { mkdir -p "$W/$1" && printf '%s' "$2" > "$W/$1/package.json" && mkdir -p "$W/$1/libs/a" && printf '%s' '{"name":"a","version":"1.0.0","dependencies":{"ms":"^2.0.0"}}' > "$W/$1/libs/a/package.json" && (cd "$W/$1" && timeout 180 npm install --package-lock-only --no-audit --no-fund >/dev/null 2>&1) || true; }
  mk p1 '{"name":"p1","version":"1.0.0","dependencies":{"express":"^4.18.0","rimraf":"^3"},"devDependencies":{"jest":"^29"},"overrides":{"express":{"debug":"4.3.4"},"glob@7":{"minimatch":"3.0.8"}}}'
  mk p2 '{"name":"p2","version":"1.0.0","workspaces":["libs/*"],"dependencies":{"react":"^18","react-dom":"^18","lodash4":"npm:lodash@^4.17.0"},"optionalDependencies":{"fsevents":"^2"},"overrides":{"loose-envify":"1.3.1"}}'
  mk p3 '{"name":"p3","version":"1.0.0","dependencies":{"webpack":"^5","eslint":"^8","semver":"^7.5.0"},"overrides":{"semver":"$semver","webpack":{"terser-webpack-plugin":{"terser":"5.20.0"}}}}'
  ORACLE="$ORACLE" node test.js "$W"/p1 "$W"/p2 "$W"/p3
else echo "npm code not installable here: recorded answers only"; fi
L=$(node -e "const fx=require('./fixtures.json');const c=fx.find(x=>x.name==='o2');process.stdout.write(JSON.stringify(JSON.stringify(c.lock)))")
P=$(node -e "const fx=require('./fixtures.json');const c=fx.find(x=>x.name==='o2');process.stdout.write(JSON.stringify(JSON.stringify(c.pkg)))")
OUT=$(printf '%s\n' \
 '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"t","version":"1"}}}' \
 '{"jsonrpc":"2.0","id":2,"method":"tools/list"}' \
 "{\"jsonrpc\":\"2.0\",\"id\":3,\"method\":\"tools/call\",\"params\":{\"name\":\"why_npm_package\",\"arguments\":{\"lockfile\":$L,\"package_json\":$P,\"package\":\"minimatch\",\"version\":\"<3.1.2\"}}}" \
 "{\"jsonrpc\":\"2.0\",\"id\":4,\"method\":\"tools/call\",\"params\":{\"name\":\"npm_duplicates\",\"arguments\":{\"lockfile\":$L}}}" \
 '{"jsonrpc":"2.0","id":5,"method":"tools/call","params":{"name":"why_npm_package","arguments":{"lockfile_path":"/nonexistent","package":"x"}}}' \
 | node server.js)
printf "%s\n" "$OUT" | grep -q '"name":"why_npm_package"' || { echo "tools/list KO"; exit 1; }
printf "%s\n" "$OUT" | grep '"id":3' | grep -q 'rimraf@3.0.2 › 7 → glob@7.2.3 › 3.0.8 → minimatch@3.0.8' || { echo "why_npm_package KO"; echo "$OUT" | grep '"id":3'; exit 1; }
printf "%s\n" "$OUT" | grep '"id":4' | grep -q '"duplicated_packages"' || { echo "npm_duplicates KO"; exit 1; }
printf "%s\n" "$OUT" | grep '"id":5' | grep -q '"isError":true' || { echo "error handling KO"; exit 1; }
echo "MCP protocol OK"
if command -v unzip >/dev/null 2>&1 && [ -f dist/npm-why-1.0.0.mcpb ]; then
  X=$(mktemp -d) && unzip -q dist/npm-why-1.0.0.mcpb -d "$X" && printf '%s\n' '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node "$X/server.js" | grep -q why_npm_package && echo ".mcpb OK"
fi
