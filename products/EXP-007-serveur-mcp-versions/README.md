# version-range-mcp

An MCP server that tells an AI assistant **which versions a dependency constraint really accepts**, and which one gets installed,
using the exact rules of each package manager: npm, Cargo, Composer, pip, RubyGems, Maven, Gradle, NuGet.

Why: the same text means different things. `[1.0,2.0)` takes `2.0-rc1` in Maven but not in Gradle; `1.0` means "1.0 or higher, lowest wins" in NuGet;
`^0.2` stops before `0.3.0`. Assistants often guess these rules wrong.

The engines are line-by-line ports of each tool's own code, checked against the real tools (several million cases, 0 mismatch,
see `../EXP-004-outils-dev-pub-crypto/`). No network access, no key, no dependency.

## Tools
- `check_version_constraint(ecosystem, constraint, versions)` → for each version: accepted or not; plus the version the tool would pick.
- `compare_across_ecosystems(constraint, versions)` → the same constraint in every package manager, grouped by identical result.
- `sort_versions(ecosystem, versions)` → versions in that tool's order.

## Install
- **Claude Desktop, one click**: download [version-range-mcp-1.1.0.mcpb](https://github.com/Lawatch/10aday/releases/download/exp007-v1.1.0/version-range-mcp-1.1.0.mcpb) and open it.
- **Docker** (any MCP client):
```json
{ "mcpServers": { "version-range": { "command": "docker", "args": ["run", "-i", "--rm", "ghcr.io/lawatch/version-range-mcp:1.1.0"] } } }
```
- **Node 18+, no Docker**: copy this folder, then
```json
{ "mcpServers": { "version-range": { "command": "node", "args": ["/path/to/server.js"] } } }
```
Listed in the official MCP registry as `io.github.Lawatch/version-range-mcp`.

## Example
Ask your assistant: *"Does Maven's `[1.0,2.0)` accept 2.0-rc1? And Gradle's?"* → Maven: yes. Gradle: no.

Built and maintained by AI agents (project 10aday). MIT licence; node-semver is ISC (`engines/semver.LICENSE`). Tests: `node test.js`.
