# npm-why — MCP server: why is this package installed?

<!-- mcp-name: io.github.Lawatch/npm-why -->

Answers **"why is X in my node_modules, which version, and who pulls it in?"** straight from `package-lock.json`,
exactly like `npm explain X`, but without node_modules and without running npm.
Built for AI assistants (Claude, Cursor, VS Code…): a lockfile is thousands of lines, the same package often has
several copies in nested `node_modules`, and which copy a package gets depends on npm's resolution rules,
overrides and workspaces. Assistants guess; this server computes it.

## Tools

| Tool | What it answers |
|---|---|
| `why_npm_package` | Every installed copy of a package (version, folder), direct or not, dev-only / optional / peer, who requires it with which range, and the full chains from your `package.json`. Give `version: "<4.17.21"` after a security alert to keep only the vulnerable copies and see which top-level dependency to upgrade. |
| `npm_duplicates` | Packages installed in more than one version (e.g. 4 versions of `chalk`), where, and which package asks for each version. Useful for bundle size, "two copies of React" bugs, `npm dedupe`. |

Input: `lockfile_path` (the `package-lock.json` / `npm-shrinkwrap.json`, or the project folder; the `package.json`
next to it is read for `overrides`) or `lockfile` (the file content). Lockfile versions 2 and 3 (npm 7 and later).

## Example

```json
{ "name": "why_npm_package", "arguments": { "lockfile_path": ".", "package": "nth-check", "version": "<2.0.1" } }
```

```text
nth-check <2.0.1: 2 copies in node_modules, version 1.0.2. Only pulled in by other packages: cra-docs, svg-term-cli@2.1.1, react-scripts@5.0.1.
  node_modules/svgo/node_modules/nth-check (installed in production)
  your project › dev ^2.1.1 → svg-term-cli@2.1.1 › ^1.0.3 → svgo@1.3.2 › ^2.0.0 → css-select@2.1.0 › ^1.0.2 → nth-check@1.0.2
```

## Exact, not approximate

The engine rebuilds the tree the way npm 10 does (`@npmcli/arborist` 8 `loadVirtual`): lockfile order, nested
`node_modules` resolution, workspaces, `npm:` aliases, `file:` dependencies, bundled and peer dependencies,
`acceptDependencies`, and `overrides` (including nested ones and `$references`). Version checks use npm's own code
(`dep-valid.js`, `semver`, `npm-package-arg`, bundled unmodified in `depvalid.js`).

Tested against npm's own code on **120 lockfiles and 52,481 packages** (real projects such as npm/cli, TypeScript,
Playwright, create-react-app, socket.io, plus 80 random projects and override cases): **0 differences** in versions,
dependents, specs, overrides and dev/optional flags. `test.sh` replays recorded answers and, when the npm registry is
reachable, compares fresh lockfiles made by the real npm.

One deliberate difference: when a workspace entry of the lockfile has no `"name"`, npm's lockfile-only reader loses
the workspace name; we take it from the `node_modules` link, which is what a real install shows.

## Install

- **Claude Desktop**: download `npm-why-1.0.0.mcpb` from the [releases](https://github.com/Lawatch/10aday/releases) and open it.
- **Any MCP client (Node 18+)**: `node server.js` (no dependency) from this folder.
- **Docker**: `docker run -i --rm -v "$PWD:/work:ro" -w /work ghcr.io/lawatch/npm-why:1.0.0` (mount the project to use `lockfile_path`).
- Registry name: `io.github.Lawatch/npm-why`.

Offline, read-only. MIT license. Built and maintained by AI agents (project 10aday).
