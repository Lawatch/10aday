# gha-trigger-check — MCP server

**Why didn't my GitHub Actions workflow run? Will this push or pull request trigger it?**
Give the workflow and the push or pull request (branch or tag, changed files, activity type, commit message):
the server says yes or no, explains each step, and names the workflow line and pattern that decide. Offline.

AI assistants answer these questions from memory, and the rules have traps:
- `branches: ["feature/*"]` does **not** match `feature/login/v2`: `*` stops at `/`. Use `feature/**`.
- With `branches` and `!` exceptions, the **last** matching pattern wins: order matters.
- On `pull_request`, branch filters are compared with the **base** branch (the target), not the PR branch.
- `on.push` with only `branches` never runs for a **tag** push (and only `tags` never runs for a branch push).
- `paths` filters are **not evaluated** for tag pushes; `paths-ignore` skips the run only if **every** changed file is ignored.
- Default `pull_request` types are `opened`, `synchronize`, `reopened`: `labeled` or `closed` need `types:`.
- `[skip ci]`, `[ci skip]`, `[no ci]`, `[skip actions]`, `[actions skip]` or a `skip-checks: true` trailer skip push and pull_request runs.
- More than 3 tags pushed at once: no push event at all. A pull request with a merge conflict: no `pull_request` run.
- `branches` together with `branches-ignore` (or `paths` with `paths-ignore`) makes GitHub reject the whole file.

## Tools
| Tool | What it does |
|---|---|
| `will_workflow_run` | One workflow (YAML text or path) and one push / pull request. Returns `runs` (true, false, or null with the missing input), the reasoning step by step, the deciding line and pattern, per-file decisions for path filters, and warnings (300-file diff limit, `!`-only lists, useless filters). |
| `which_workflows_run` | Every workflow of the repository (given as contents, or read from `.github/workflows/`) for one push or pull request: which run, which do not, and why. |
| `test_filter_patterns` | Test branch, tag or path patterns against names: selected or not, which pattern decides, the exact regular expression, and GitHub's error for an invalid pattern. |

## Example
```json
{ "name": "will_workflow_run", "arguments": {
  "workflow": "on:\n  push:\n    branches: [main, 'releases/**', '!releases/**-alpha']\n    paths: ['src/**', '!src/**/*.md']\n",
  "branch": "main", "changed_files": ["src/api/README.md", "docs/setup.md"] } }
```
Result: `runs: false`. Branch `main` matches line 3, but no changed file is selected by `paths`:
`src/api/README.md` is excluded again by `!src/**/*.md`.

## How exact is it?
The pattern engine is a line-by-line port of `pkg/workflowpattern` from [nektos/act](https://github.com/nektos/act)
(the tool that runs GitHub Actions locally), itself written from GitHub's documented filter syntax and cheat sheet.
`test.js` builds act's Go code and compares both on random patterns and names (`*`, `**`, `?`, `+`, ranges, `!`,
escapes, invalid patterns): 300,000 cases, 0 differences. 4,000 recorded answers stay in `fixtures.json`.
The event rules (branch vs tag filters, base branch, types, `[skip ci]`, 3 tags, merge conflicts) follow GitHub's
"Workflow syntax" and "Events that trigger workflows" docs, with 32 test cases. Checked on 68 real workflows
(Vite, React, Next.js, Node.js, Rust, CPython, Deno...).

Limits: GitHub's own matcher is not public. A `!` pattern inside a `*-ignore` list is undocumented: the server applies
"last match wins" and warns. Only push, pull_request and pull_request_target filters are evaluated; other events are
only checked for presence. Job-level `if:` conditions are not evaluated.

## Install
- Claude Desktop: open `gha-trigger-check-1.0.0.mcpb` from the [GitHub release](https://github.com/Lawatch/10aday/releases/tag/gha-trigger-check-v1.0.0).
- Any MCP client (Docker, read access to the project for `which_workflows_run`):
  `{"command": "docker", "args": ["run", "-i", "--rm", "-v", "${workspaceFolder}:${workspaceFolder}:ro", "-w", "${workspaceFolder}", "ghcr.io/lawatch/gha-trigger-check:1.0.0"]}`
- From source (Node 18+, no install): `{"command": "node", "args": ["/path/to/server.js"]}`

Offline, read-only, nothing is sent anywhere.

## Licenses
Server code: MIT. Bundled unchanged: `yaml` 2.9.1 (ISC, Eemeli Aro), license in `vendor/`.
Pattern engine ported from nektos/act (MIT).

Built by AI agents (project [10aday](https://github.com/Lawatch/10aday)).
