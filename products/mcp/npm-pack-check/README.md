# npm-pack-check — MCP server

**Which files will `npm publish` really ship, and which rule decides each one?** The exact answer npm 10 gives, before
you publish, without touching the registry.

npm's packing rules are full of traps that AI assistants (and humans) get wrong:
- Adding a `.npmignore` makes npm **ignore the `.gitignore`** of that folder completely: your git-ignored `.env`,
  keys and coverage reports get published.
- A `"files"` field disables the root `.npmignore` and `.gitignore`, but not the ones in sub-folders.
- README, LICENSE, `package.json`, `"main"` and `"bin"` are always shipped; `node_modules`, `.npmrc` and lockfiles never.
- A `"files"` entry pointing to a file that is not built yet silently matches nothing, and users get `Cannot find module`.

## Tools
| Tool | What it does |
|---|---|
| `check_npm_pack` | The exact file list of the tarball (same files and order as `npm pack --dry-run`), what is left out (count by folder, or the full list), and warnings: secrets that would be published, `.npmignore` overriding `.gitignore`, useless root ignore files, `"files"` entries that match nothing, `main` / `bin` / `browser` / `types` that will not ship, tests and coverage shipped by mistake. |
| `why_npm_pack` | For each path: shipped or not, and the exact rule: `.npmignore` / `.gitignore` file and line, `"files"` entry, or npm's built-in rule. Says when a whole folder is skipped. |

## Example
```json
{ "name": "check_npm_pack", "arguments": {
  "package_json": { "name": "demo", "version": "1.0.0", "main": "dist/index.js" },
  "paths": ["src/index.ts", "dist/index.js", ".env", "README.md", "coverage/lcov.info"],
  "ignore_files": { ".gitignore": "node_modules\n.env\ncoverage\ndist\n", ".npmignore": "src\n" } } }
```
Result: npm ships `.env`, `coverage/lcov.info`, `dist/index.js`, `package.json`, `README.md`. Warnings: `.env` would be
**published**, and it is only because the `.npmignore` replaces the `.gitignore`.

Pass the file list from `git ls-files --cached --others` (plus untracked build output such as `dist/`) and the content
of every `.npmignore` / `.gitignore`.

## How exact is it?
`engine.js` is a line-by-line port of `npm-packlist` 9.0.0 and `ignore-walk` 7.0.0 (the code npm 10 runs), working on a
list of paths instead of the disk, with the same `package.json` normalisation (`bin`) and the same `workspaces` quirk.
Globs use the exact engine npm uses: `minimatch.js` is an unmodified bundle of minimatch 9.0.9 + brace-expansion 2.0.2
(ISC/MIT). `test.js` builds random projects on disk and compares with npm's own code: about 23,000 projects (240,000
files), 0 differences, plus the real `npm pack --dry-run` on a few hundred, 0 differences. Re-run on every release.
Not modelled: files added from `bundleDependencies` (a warning says so), symlinks (npm never ships them).

## Install
- Claude Desktop: open `npm-pack-check-1.0.0.mcpb` from the [GitHub release](https://github.com/Lawatch/10aday/releases/tag/npm-pack-check-v1.0.0).
- Any MCP client (Docker): `{"command": "docker", "args": ["run", "-i", "--rm", "ghcr.io/lawatch/npm-pack-check:1.0.0"]}`
- From source (Node 18+, no dependency): `{"command": "node", "args": ["/path/to/server.js"]}`

Offline, read-only, no file access, nothing is published.

Built by AI agents (project [10aday](https://github.com/Lawatch/10aday)). MIT license.
