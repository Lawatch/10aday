# browserslist-check — MCP server

**Which browsers does my browserslist query really target today, and can I use this CSS/JS feature in all of them?**
The exact answer of the real browserslist code with the caniuse data, offline.

AI assistants answer browser support questions from memory, and memory is wrong here:
- `defaults`, `> 0.5%` or `last 2 versions` select different browsers every month (usage data changes).
- Configs have traps: `[production]` / `[development]` sections, `NODE_ENV`, the `package.json` key that wins.
- "Is `:has()` safe?" depends on *your* targets: Opera Mini, KaiOS, UC Browser or an old Safari in the list change the answer.

## Tools
| Tool | What it does |
|---|---|
| `resolve_browsers` | Exact browser versions for a query, a `.browserslistrc` text or a `package.json` "browserslist" value (with environment sections), the share of world or country usage covered, what each part of the query adds or removes, and warnings (dead browsers, Opera Mini, IE, empty result, old data). |
| `check_support` | For caniuse features (`css-has`, `dialog`, `css-container-queries`, `css-subgrid`, `view-transitions`, `webp`…; names work too): for every target version, supported / partial / prefix / behind a flag / missing, the usage share of the browsers that fail, the first version with full support per browser, and a plain verdict. |
| `find_feature` | Finds caniuse ids from words ("container queries", "subgrid") with world support share. |

## Example
```json
{ "name": "check_support", "arguments": { "features": ["css-has"], "query": "> 0.5%, last 2 versions, not dead" } }
```
Result (caniuse-lite 1.0.30001826): `Not safe without a fallback or polyfill: missing in 5 of 36 target versions
(0.67% of world usage)`: QQ Browser 14.9, UC Browser 15.5, KaiOS 2.5 and 3.0-3.1, Opera Mini. Full support since
Chrome 105, Firefox 121, Safari 15.4.

## How exact is it?
`browserslist.bundle.js` is the unmodified code and data of browserslist 4.29.6, caniuse-lite 1.0.30001826 and
baseline-browser-mapping 2.11.37 in one file (how it is built: `vendor-build/`). `test.js` compares the server with the
real packages installed by npm on random queries (popularity, regions, `cover`, `last N`, `since`, `supports`, `baseline`,
Node, Electron, `and` / `or` / `not`, invalid queries), random `.browserslistrc` and `package.json` configs with
environment sections, and random feature checks: more than 10,000 cases, 0 differences. Feature statuses are also
checked against browserslist's own `supports` / `fully supports` queries.

Limits: caniuse data only (some features shown on caniuse.com come from MDN and are not in it); caniuse tracks only the
latest version of most mobile browsers; shareable configs (`extends browserslist-config-x`) and `my stats` are not read.

## Install
- Claude Desktop: open `browserslist-check-1.0.0.mcpb` from the [GitHub release](https://github.com/Lawatch/10aday/releases/tag/browserslist-check-v1.0.0).
- Any MCP client (Docker): `{"command": "docker", "args": ["run", "-i", "--rm", "ghcr.io/lawatch/browserslist-check:1.0.0"]}`
- From source (Node 18+, no install): `{"command": "node", "args": ["/path/to/server.js"]}`

Offline, read-only, no file access.

## Licenses
Server code: MIT. Bundled: browserslist (MIT, Andrey Sitnik), caniuse-lite data (CC BY 4.0, Ben Briggs and the
[caniuse.com](https://caniuse.com) contributors, Alexis Deveria), baseline-browser-mapping (Apache-2.0, web-platform-dx),
electron-to-chromium (ISC), node-releases (MIT). License texts in `vendor-build/`.

Built by AI agents (project [10aday](https://github.com/Lawatch/10aday)).
