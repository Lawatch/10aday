# gitattributes-check — MCP server

**Which git attributes apply to this file, and which `.gitattributes` line decides?** The same answer as `git check-attr -a`,
without a repository, plus what it changes in practice.

<!-- web -->
> **One-click install** for Claude Desktop, VS Code and Cursor: **https://lawatch.github.io/10aday/mcp/gitattributes-check/**  
> Question, wrong answer or missing case? [Open an issue](https://github.com/Lawatch/10aday/issues/new?title=%5Bgitattributes-check%5D%20) — we read them.
<!-- /web -->

AI assistants often get `.gitattributes` wrong: `vendor/ linguist-vendored` (does nothing for the files inside),
`!*.md text` (negative patterns are ignored), Git LFS rules without `-text`, macros in a sub-directory file,
an invalid attribute name that silently drops the whole line. This server answers with git's own rules.

## Tools
| Tool | What it does |
|---|---|
| `check_attributes` | For each path: every attribute (set, unset, value), the file and line that decides it, the macro it came from, and what it means: line endings (LF/CRLF), binary diffs, merge behaviour, Git LFS, `export-ignore` (left out of release archives), GitHub Linguist (language bar, collapsed generated files). Up to 5,000 paths per call. |
| `explain_gitattributes` | Every line in plain English, plus warnings for the classic mistakes. |

## Example
```json
{ "name": "check_attributes", "arguments": {
  "gitattributes": "* text=auto\n*.png binary\nvendor/ linguist-vendored\n*.psd filter=lfs diff=lfs merge=lfs -text\n",
  "paths": ["logo.png", "vendor/lib.js", "art/cover.psd"] } }
```
Result: `logo.png` gets `binary`, and through the built-in macro `-diff -merge -text` (no line-ending conversion, "Binary files differ").
`vendor/lib.js` is **not** vendored: line 3 only matches the directory itself; use `vendor/**`.
`art/cover.psd` is stored with Git LFS.

Several files: `"files": { ".gitattributes": "...", "docs/.gitattributes": "...", ".git/info/attributes": "..." }`.
Only some attributes: `"attributes": ["text", "eol"]` (unspecified ones are then reported too). End a path with `/` if it is a directory.

## How exact is it?
`engine.js` is a port of git's `attr.c` (line parsing, quoting, macros, precedence between files, per-attribute
last-match-wins) and `wildmatch.c`. `test.js` compares it with the real `git check-attr -a` on random `.gitattributes`
files and trees: about 77,000 paths, 0 differences (git 2.43), and again on every release with the current git (2.56). Where the two versions differ (a `**` glued to text, reserved `builtin_*` names), the server follows the current git.

## Install
- Claude Desktop: open `gitattributes-check-1.0.0.mcpb` from the [GitHub release](https://github.com/Lawatch/10aday/releases/tag/gitattributes-check-v1.0.0).
- Any MCP client (Docker): `{"command": "docker", "args": ["run", "-i", "--rm", "ghcr.io/lawatch/gitattributes-check:1.0.0"]}`
- From source (Node 18+, no dependency): `{"command": "node", "args": ["/path/to/server.js"]}`

Offline, read-only, no file access: you pass the `.gitattributes` content and the paths.

Built by AI agents (project [10aday](https://github.com/Lawatch/10aday)). MIT license.
