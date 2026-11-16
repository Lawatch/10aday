# editorconfig-check — MCP server

**Which EditorConfig settings apply to this file, and which `.editorconfig` section and line decide?** The same answer
your editor and Prettier get from the reference EditorConfig core, without opening the project.

AI assistants often get `.editorconfig` wrong: `[*.{js}]` (one choice in braces is literal: it matches nothing),
`indent_size = 4 # four` (end-of-line comments are part of the value, so the setting is invalid), a stray line that
makes editors silently ignore **every line below it**, forgetting that later sections win, or that `root = true` stops the search.
This server answers with the exact rules.

## Tools
| Tool | What it does |
|---|---|
| `check_editorconfig` | For each file: the final settings (`indent_style`, `indent_size`, `tab_width`, `end_of_line`, `charset`, `insert_final_newline`, `trim_trailing_whitespace`, `max_line_length`, custom keys), the file, section and line that decides each one, every section that matched, the derived values, and which `.editorconfig` files were read. Up to 5,000 paths per call. |
| `lint_editorconfig` | The mistakes that silently break a file: unparsable lines (and the lines they hide), end-of-line comments, invalid values, misspelled keys (`indent_sise`), `root` misplaced or missing, keys before any section, `{js}` braces, `..` in globs, spaces in brackets, duplicate keys. |

## Example
```json
{ "name": "check_editorconfig", "arguments": {
  "editorconfig": "root = true\n[*]\nindent_style = space\nindent_size = 2\n[*.{js}]\nindent_size = 4\n[Makefile]\nindent_style = tab\n",
  "paths": ["src/app.js", "Makefile"] } }
```
Result: `src/app.js` gets `indent_size = 2` from `[*]` line 4: `[*.{js}]` does **not** match (write `[*.js]` or `[*.{js,ts}]`).
`Makefile` gets `indent_style = tab` from `[Makefile]` line 8, and still `indent_size = 2` from `[*]`.

Several files: `"files": { ".editorconfig": "...", "legacy/.editorconfig": "..." }`. A file with `root = true` stops the search upward.

## How exact is it?
`engine.js` (no dependency) reproduces the reference JavaScript core, npm `editorconfig` 4 (used by Prettier and many
editor plugins): its parser, including where it stops on a bad line; its globs (a port of the `brace-expansion` rules
and the `minimatch` matching it relies on); its merge order and post-processing. `test.js` compares both on random
`.editorconfig` files and paths: about 225,000 paths, 0 differences, re-run on every release. One known gap: the
reference core mishandles folder names that contain braces (`a{b}/`); this server treats them literally.

## Install
- Claude Desktop: open `editorconfig-check-1.0.0.mcpb` from the [GitHub release](https://github.com/Lawatch/10aday/releases/tag/editorconfig-check-v1.0.0).
- Any MCP client (Docker): `{"command": "docker", "args": ["run", "-i", "--rm", "ghcr.io/lawatch/editorconfig-check:1.0.0"]}`
- From source (Node 18+, no dependency): `{"command": "node", "args": ["/path/to/server.js"]}`

Offline, read-only, no file access: you pass the `.editorconfig` content and the paths.

Built by AI agents (project [10aday](https://github.com/Lawatch/10aday)). MIT license.
