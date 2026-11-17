# package-exports — which file does Node load for this import, and why?

An MCP server for AI assistants (Claude, Cursor, VS Code…). It answers **"which file does `import 'pkg/sub'` or `require('pkg/sub')` load?"** exactly like Node 22, from `package.json` `"exports"`, `"imports"` and `"main"`, and explains every step.

<!-- web -->
> **One-click install** for Claude Desktop, VS Code and Cursor: **https://lawatch.github.io/10aday/mcp/package-exports/**  
> Question, wrong answer or missing case? [Open an issue](https://github.com/Lawatch/10aday/issues/new?title=%5Bpackage-exports%5D%20) — we read them.
<!-- /web -->

Assistants often guess these rules wrong: condition order, `"default"` placement, `*` pattern priority, `null` targets, trailing slashes, and import vs require giving different files. This server does not guess: its resolver is a line-by-line port of Node's own (`lib/internal/modules/esm/resolve.js` and the CommonJS loader).

## Tools
| Tool | What it answers |
|---|---|
| `resolve_package_import` | The file loaded for one specifier (`react-dom/client`, `@scope/pkg/utils`, `#internal`), for **import and require**, with its format (ES module / CommonJS), the exports key and condition chain that decided (`"./client" › import › default`), a trace, and Node's exact error code when it fails (`ERR_PACKAGE_PATH_NOT_EXPORTED`, `ERR_UNSUPPORTED_DIR_IMPORT`, `ERR_PACKAGE_IMPORT_NOT_DEFINED`, `MODULE_NOT_FOUND`…). Extra conditions like `--conditions=development` or `browser` are supported. |
| `list_package_exports` | Every public entry point of a package and what import / require load, the files each `*` pattern really exposes, and the mistakes in the exports map: conditions after `"default"` (never used), `"types"` not first, targets without `./`, folder keys ending in `/` (removed in Node 17), missing files, `"main"` ignored, dual packages, `./package.json` not exported. |

Give a package folder or a project folder (`package_dir`, the package is then found in `node_modules`), or the `package.json` content plus an optional file list.

## Example
```json
{ "name": "resolve_package_import", "arguments": { "package_dir": ".", "specifier": "uuid" } }
```
→ `import: ./dist-node/index.js (node › default), module; require: ./dist-node/index.js (node › default), module` plus a warning: require() loads an ES module, fine on Node 22.12+ but `ERR_REQUIRE_ESM` on older Node.

A quirk it knows: `"imports": { "#fs": "fs" }` works with `import "#fs"` but `require("#fs")` fails in Node 22 (`ERR_INVALID_URL_SCHEME`).

## Checked against the real Node
- About 400,000 resolutions of random packages (strange exports maps, invalid targets, patterns, arrays, nested conditions, imports, main fallbacks), resolved by Node 22 itself: **0 differences**.
- Every exported entry of 472 real npm packages (React, Vue, Next.js, TypeScript, Babel, Vite, date-fns…), 26,016 resolutions: **0 differences**.
- `test.sh` replays recorded answers and, on Node 22, re-runs fresh random packages against Node.

## Install
- **Claude Desktop**: download `package-exports-1.0.0.mcpb` from the [releases](https://github.com/Lawatch/10aday/releases) and open it.
- **Docker**: `docker run -i --rm -v "$PWD:$PWD" -w "$PWD" ghcr.io/lawatch/package-exports`
- **Node** (no dependency): `node server.js`

Registry name: `io.github.Lawatch/package-exports`. Offline, read-only. MIT.

Built and maintained by AI agents (project 10aday).
