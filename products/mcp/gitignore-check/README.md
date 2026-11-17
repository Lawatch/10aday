# gitignore-check — MCP server

**Is this path ignored by git, and by which `.gitignore` line?** The same answer as `git check-ignore -v`, without a repository.

<!-- web -->
> **One-click install** for Claude Desktop, VS Code and Cursor: **https://lawatch.github.io/10aday/mcp/gitignore-check/**  
> Question, wrong answer or missing case? [Open an issue](https://github.com/Lawatch/10aday/issues/new?title=%5Bgitignore-check%5D%20) — we read them.
<!-- /web -->

AI assistants often guess `.gitignore` rules wrong: `logs/` + `!logs/keep.txt` (does not work), `/build` vs `build/`,
`**` in the middle of a pattern, trailing spaces, nested `.gitignore` files. This server answers with git's own rules.

## Tools
| Tool | What it does |
|---|---|
| `check_ignored` | For each path: ignored or not, the file and line that decides, and why (e.g. "parent directory `logs/` is ignored, so `!logs/keep.txt` cannot work"). Up to 5,000 paths per call. |
| `explain_gitignore` | Every line in plain English, plus warnings for the classic mistakes (useless `!` rule, trailing spaces, `#` not at line start, `**` glued to text, unclosed `[`). |

## Example
```json
{ "name": "check_ignored", "arguments": {
  "gitignore": "logs/\n!logs/keep.txt\n*.log\n!important.log\n",
  "paths": ["logs/keep.txt", "app/debug.log", "important.log", "src/main.js"] } }
```
Result: `logs/keep.txt` **ignored** (line 1 `logs/`: git never looks inside an ignored directory; fix: use `logs/*`),
`app/debug.log` ignored (line 3), `important.log` kept (line 4), `src/main.js` kept (no rule).

Several files: `"files": { ".gitignore": "...", "src/.gitignore": "..." }`. End a path with `/` if it is a directory.

## How exact is it?
`engine.js` is a line-by-line port of git's `wildmatch.c` and the ignore logic of `dir.c` (parsing, precedence between
nested files, excluded parent directories). `test.js` compares it with the real `git check-ignore` on random
`.gitignore` files and trees: about 80,000 paths, 0 differences (git 2.43).

## Install
- Claude Desktop: open `gitignore-check-1.0.1.mcpb` from the [GitHub release](https://github.com/Lawatch/10aday/releases/tag/gitignore-check-v1.0.1).
- Any MCP client (Docker): `{"command": "docker", "args": ["run", "-i", "--rm", "ghcr.io/lawatch/gitignore-check:1.0.1"]}`
- From source (Node 18+, no dependency): `{"command": "node", "args": ["/path/to/server.js"]}`

Offline, read-only, no file access: you pass the `.gitignore` content and the paths.

Built by AI agents (project [10aday](https://github.com/Lawatch/10aday)). MIT license.
