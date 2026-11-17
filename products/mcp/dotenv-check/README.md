# dotenv-check — MCP server

**Why is my environment variable empty, wrong or `undefined`?**
The exact value each `.env` variable gets, and the file and line that decide it, with the four loaders developers use:
npm **dotenv** (+ dotenv-expand), **node --env-file**, **Vite** and **Next.js**. Offline.

AI assistants answer `.env` questions from memory, and the loaders disagree with each other:
- `PASSWORD=abc#123` gives `abc`: an unquoted `#` starts a comment, even with no space before it.
- `API_URL= ` (a trailing space) followed by a new line: Node and Vite 8 take the **next line** as the value, and that variable disappears.
- Which file wins? dotenv and Next.js: the **first** file that defines it. Node and Vite: the **last**. The shell environment wins over all files.
- `$VAR` is expanded by dotenv-expand, Vite and Next.js, **even inside single quotes**, but never by Node or plain dotenv.
- Vite only exposes `VITE_*` to client code, Next.js only `NEXT_PUBLIC_*`, and `.env.local` is skipped by Next.js when `NODE_ENV=test`.
- `A=$A$A` makes Vite and dotenv-expand loop until the process runs out of memory.

## Tools
| Tool | What it does |
|---|---|
| `resolve_env` | Give the `.env` files and the loader (`dotenv`, `node`, `vite`, `nextjs`) with the mode. For each variable: final value, the `file:line` that decides, the definitions that lose and why, the text before `$VAR` expansion, whether it reaches browser code. Plus every trap found and the files the loader never reads in this mode. |
| `parse_env_file` | One file, parsed with the real dotenv or Node parser: each value with its line, lines silently ignored, values cut at `#`, unclosed quotes, multi-line values, duplicate keys. |
| `compare_env_parsers` | The variables that read differently with dotenv and with Node's parser (node --env-file, Vite 8). Run it before switching. |

## Example
```json
{ "name": "resolve_env", "arguments": { "loader": "vite", "mode": "production", "files": {
  ".env": "VITE_API_URL=http://localhost:3000\nDB_PASSWORD=abc#123\n",
  ".env.production": "VITE_API_URL= \nVITE_TITLE=My app\n" } } }
```
Result: `VITE_API_URL` = `"VITE_TITLE=My app"` (from `.env.production:1`, the `.env:1` value loses), `VITE_TITLE` does not
exist, `DB_PASSWORD` is cut to `abc` and is not in `import.meta.env` anyway (no `VITE_` prefix).

## How exact is it?
The real code runs inside: npm `dotenv` 17.4.2 and `dotenv-expand` 12.0.3 (unchanged), the copy of dotenv-expand bundled
in Vite 8.3.8 (unchanged), `@next/env` 16.4.6 (unchanged, run with the files in memory), and a line-by-line port of
Node's C++ parser (`src/node_dotenv.cc`, identical in Node 22 to 25). The only addition: a guard that stops a value
growing without end, where the real loader would crash. `test.js` compares the server with `util.parseEnv`,
`node --env-file`, Vite's `loadEnv`, Next's `loadEnvConfig` and dotenv + dotenv-expand on thousands of random files
(quotes, `#`, `$VAR`, `${VAR:-default}`, multi-line values, CRLF, `export`, several files, mode, shell variables): 0 differences.

Limits: `.env.vault` / dotenvx encryption and Docker Compose `.env` rules are not covered. Vite's `envDir` and
`define` are not read: give the files Vite would see.

## Install
- Claude Desktop: open `dotenv-check-1.0.0.mcpb` from the [GitHub release](https://github.com/Lawatch/10aday/releases/tag/dotenv-check-v1.0.0).
- Any MCP client (Docker): `{"command": "docker", "args": ["run", "-i", "--rm", "ghcr.io/lawatch/dotenv-check:1.0.0"]}`
- From source (Node 18+, no install): `{"command": "node", "args": ["/path/to/server.js"]}`

Offline, read-only, no file access: you pass the file contents, nothing is sent anywhere.

## Licenses
Server code: MIT. Bundled unchanged: dotenv and dotenv-expand (BSD-2-Clause, Scott Motte and contributors),
@next/env (MIT, Vercel). License texts in `vendor/`.

Built by AI agents (project [10aday](https://github.com/Lawatch/10aday)).
