# dockerignore-check — MCP server

**Which files does `docker build` really send, and which `.dockerignore` line decides?** Docker's exact rules, without Docker.

`.dockerignore` is not `.gitignore`, and AI assistants often mix them up:
- `*.log` only matches at the **root** of the context. `api/debug.log` is still sent. Use `**/*.log`.
- `node_modules` does not exclude `packages/web/node_modules`. Use `**/node_modules`.
- A trailing `/` is ignored (`build/` also matches a file named `build`), a leading `/` is removed.
- `#` is a comment only in column 1. `  # secrets` is a pattern.
- The last matching line wins, and `!` can re-include a file inside an excluded directory (unlike git).

## Tools
| Tool | What it does |
|---|---|
| `check_dockerignore` | For each path: sent or excluded, the line that decides, and why. Also the full list of what Docker sends, and a warning when secrets (`.env`, `.git/`, keys, `.npmrc`) end up in the context. Up to 5,000 paths per call. |
| `explain_dockerignore` | Every line in plain English, as Docker reads it, plus warnings for the classic mistakes (root-only patterns, indented `#`, `!` with nothing to re-include, invalid patterns). |

## Example
```json
{ "name": "check_dockerignore", "arguments": {
  "dockerignore": "*.log\nnode_modules\n.env\n!node_modules/keep\n",
  "paths": ["app.log", "api/debug.log", "node_modules/x/y.js", "packages/web/node_modules/z.js", "api/.env", "node_modules/keep"] } }
```
Result: `app.log` excluded (line 1), `api/debug.log` **sent** (`*.log` is root-only), `node_modules/x/y.js` excluded (line 2),
`packages/web/node_modules/z.js` **sent**, `api/.env` **sent** + secret warning, `node_modules/keep` sent (line 4).

Tip: pass the output of `git ls-files` or `find . -type f` as `paths`.

## How exact is it?
`engine.js` is a line-by-line port of the code Docker BuildKit uses to send the build context:
`moby/patternmatcher` (parsing with `ignorefile.ReadAll`, pattern compilation, matching with parent results) and the
filtered walk of `tonistiigi/fsutil`. `oracle/main.go` runs that real Go code on real temporary directories.
`test.js` compares both on random `.dockerignore` files and trees: 42,000 cases, 0 differences.
`test.sh` replays 1,000 recorded cases and, when Go is installed, 2,000 new live ones.

## Install
- Claude Desktop: open `dockerignore-check-1.0.0.mcpb` from the [GitHub release](https://github.com/Lawatch/10aday/releases/tag/dockerignore-check-v1.0.0).
- Any MCP client (Docker): `{"command": "docker", "args": ["run", "-i", "--rm", "ghcr.io/lawatch/dockerignore-check:1.0.0"]}`
- From source (Node 18+, no dependency): `{"command": "node", "args": ["/path/to/server.js"]}`

Offline, read-only, no file access: you pass the `.dockerignore` content and the paths.

Built by AI agents (project [10aday](https://github.com/Lawatch/10aday)). MIT license.
