#!/usr/bin/env python3
"""Builds the public English catalogue of our MCP tools: docs/mcp/ (one index + one page per tool).

Reads each tool's server.json (name, version, packages) and README.md (rendered).
Every install link carries a GoatCounter click event, so we can count real humans
who chose to install, separately from registry robots.
Run: python3 products/mcp/build_pages.py   (needs `pip install markdown`)
"""
import base64, html, json, pathlib, re, urllib.parse
import markdown

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / "docs" / "mcp"
BASE = "https://lawatch.github.io/10aday/mcp/"
GC = '<script data-goatcounter="https://10aday.goatcounter.com/count" async src="//gc.zgo.at/count.js"></script>'

# (folder, slug, needs project files, short pitch for the index)
TOOLS = [
    ("products/mcp/gha-trigger-check", "gha-trigger-check", True,
     "Why didn't my GitHub Actions workflow run? Will this push or PR trigger it? Branch, tag and path filters with the exact glob rules (<code>*</code> stops at <code>/</code>, last <code>!</code> wins), base branch for PRs, default types, <code>[skip ci]</code>, and the workflow line that decides."),
    ("products/mcp/dotenv-check", "dotenv-check", False,
     "Why is my env variable empty or wrong? The exact value of each <code>.env</code> variable and the file and line that decide it, with dotenv, node --env-file, Vite and Next.js. Flags the traps: <code>#</code> in passwords, trailing spaces, <code>$VAR</code>, secrets exposed to the browser."),
    ("products/mcp/browserslist-check", "browserslist-check", False,
     "Exactly which browsers a browserslist query or config targets today, and whether a CSS/JS feature (<code>:has()</code>, container queries…) works in all of them. Real browserslist code and caniuse data."),
    ("products/mcp/package-exports", "package-exports", True,
     "Which file Node loads for <code>import \"pkg/sub\"</code> or <code>require</code>, which <code>exports</code> key decides, and the exact Node error when it fails."),
    ("products/mcp/npm-why", "npm-why", True,
     "Why a package is in <code>node_modules</code>, which versions, who pulls it in. Same answer as <code>npm explain</code>, read from package-lock.json."),
    ("products/mcp/npm-pack-check", "npm-pack-check", True,
     "Exactly which files <code>npm publish</code> ships, which rule decides each one, and leaks (.env, keys) to fix first."),
    ("products/mcp/gitignore-check", "gitignore-check", True,
     "Is this path ignored by git, and by which .gitignore line? Same answer as <code>git check-ignore</code>."),
    ("products/mcp/dockerignore-check", "dockerignore-check", True,
     "Which files <code>docker build</code> really sends, and which .dockerignore line decides. Exact BuildKit rules."),
    ("products/mcp/gitattributes-check", "gitattributes-check", True,
     "Which git attributes apply to a file (line endings, binary, LFS, linguist) and which line decides. Same as <code>git check-attr</code>."),
    ("products/mcp/editorconfig-check", "editorconfig-check", True,
     "Which .editorconfig settings apply to a file (indent, line endings, charset) and which section decides."),
    ("products/EXP-007-serveur-mcp-versions", "version-range-mcp", False,
     "Which version a dependency constraint installs, in npm, Cargo, pip, Maven, Gradle, NuGet, Composer and RubyGems."),
]

CSS = """body{font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:900px;margin:2rem auto;padding:0 1rem;line-height:1.6;color:#1d1d1f}
h1{font-size:1.6rem;margin:.2rem 0 .6rem}h2{font-size:1.2rem;margin-top:2rem}h3{font-size:1.05rem;margin:.2rem 0}
code,pre{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:.9em}
pre{background:#f6f8fa;padding:.7rem;overflow-x:auto;border-radius:6px}
table{border-collapse:collapse;width:100%;margin:.6rem 0;font-size:.92rem}th,td{border:1px solid #ddd;padding:.35rem .5rem;text-align:left;vertical-align:top}th{background:#f6f6f6}
.muted{color:#666}.card{border:1px solid #ddd;border-radius:8px;padding:.8rem 1rem;margin:.8rem 0}
.btns{display:flex;flex-wrap:wrap;gap:.5rem;margin:.6rem 0}.btn{display:inline-block;padding:.35rem .7rem;border-radius:6px;border:1px solid #b8cdf5;background:#eef4ff;text-decoration:none;color:#1a4fb4;font-size:.9rem}
footer{margin-top:3rem;font-size:.85rem;color:#666;border-top:1px solid #ddd;padding-top:1rem}"""


def load(folder, slug, files, pitch):
    d = ROOT / folder
    sj = json.loads((d / "server.json").read_text())
    oci = next(p["identifier"] for p in sj["packages"] if p["registryType"] == "oci")
    mcpb = next((p["identifier"] for p in sj["packages"] if p["registryType"] == "mcpb"), None)
    args = ["run", "-i", "--rm"]
    if files:
        args += ["-v", "${workspaceFolder}:${workspaceFolder}:ro", "-w", "${workspaceFolder}"]
    args.append(oci)
    cfg = {"command": "docker", "args": args}
    vscode = "vscode:mcp/install?" + urllib.parse.quote(json.dumps({"name": slug, **cfg}, separators=(",", ":")))
    cursor = ("cursor://anysphere.cursor-deeplink/mcp/install?name=" + slug + "&config="
              + urllib.parse.quote(base64.b64encode(json.dumps(cfg, separators=(",", ":")).encode()).decode(), safe=""))
    shell = "docker run -i --rm " + ('-v "$PWD:$PWD:ro" -w "$PWD" ' if files else "") + oci
    readme = (d / "README.md").read_text()
    readme = re.sub(r"<!--.*?-->", "", readme, flags=re.S)
    readme = re.sub(r"\A#[^\n]*\n", "", readme)  # page has its own h1
    body = markdown.markdown(readme, extensions=["tables", "fenced_code"])
    body = body.replace("(project 10aday)", '(project <a href="https://github.com/Lawatch/10aday">10aday</a>)')
    return dict(slug=slug, sj=sj, oci=oci, mcpb=mcpb, vscode=vscode, cursor=cursor, shell=shell,
                cfg=cfg, body=body, pitch=pitch, folder=folder)


def buttons(t):
    s = t["slug"]
    b = []
    if t["mcpb"]:
        b.append(f'<a class="btn" href="{html.escape(t["mcpb"])}" data-goatcounter-click="install-{s}-claude">Claude Desktop (.mcpb)</a>')
    b.append(f'<a class="btn" href="{html.escape(t["vscode"])}" data-goatcounter-click="install-{s}-vscode">Install in VS Code</a>')
    b.append(f'<a class="btn" href="{html.escape(t["cursor"])}" data-goatcounter-click="install-{s}-cursor">Install in Cursor</a>')
    b.append(f'<a class="btn" href="https://github.com/Lawatch/10aday/tree/main/{t["folder"]}" data-goatcounter-click="source-{s}">Source</a>')
    return '<div class="btns">' + "".join(b) + "</div>"


def page(title, desc, url, inner, crumbs):
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{html.escape(title)}</title>
<meta name="description" content="{html.escape(desc)}">
<link rel="canonical" href="{url}">
<meta property="og:title" content="{html.escape(title)}">
<meta property="og:description" content="{html.escape(desc)}">
<meta property="og:url" content="{url}">
<style>{CSS}</style>
</head>
<body>
<p class="muted">{crumbs}</p>
{inner}
<footer>Free, open source (MIT), offline, read-only. Built and maintained by AI agents (project <a href="https://github.com/Lawatch/10aday">10aday</a>). Listed on the <a href="https://registry.modelcontextprotocol.io/v0/servers?search=io.github.Lawatch">official MCP registry</a>.</footer>
{GC}
</body>
</html>
"""


def main():
    tools = [load(*t) for t in TOOLS]
    OUT.mkdir(parents=True, exist_ok=True)
    cards = []
    for t in tools:
        sj = t["sj"]
        cards.append(f'<div class="card"><h3><a href="{t["slug"]}/">{html.escape(sj["title"])}</a></h3>'
                     f'<p>{t["pitch"]}</p>{buttons(t)}</div>')
        cfg_json = json.dumps({"mcpServers": {t["slug"]: t["cfg"]}}, indent=2).replace("${workspaceFolder}", "/path/to/project")
        inner = f"""<h1>{html.escape(sj["title"])} — MCP server</h1>
<p><strong>{html.escape(sj["description"])}</strong></p>
{buttons(t)}
<p class="muted">Registry name <code>{sj["name"]}</code>, version {sj["version"]}. The VS Code and Cursor buttons run the Docker image and give it read-only access to the open project.</p>
<h2>Other clients</h2>
<pre><code>{html.escape(t["shell"])}</code></pre>
<p>JSON config (Claude Desktop, Windsurf, Cline…), replace the path:</p>
<pre><code>{html.escape(cfg_json)}</code></pre>
<h2>Documentation</h2>
{t["body"]}
<h2>More tools from the same factory</h2>
<p>{" · ".join(f'<a href="../{o["slug"]}/">{o["slug"]}</a>' for o in tools if o is not t)}</p>"""
        d = OUT / t["slug"]
        d.mkdir(exist_ok=True)
        (d / "index.html").write_text(page(f'{sj["title"]} — MCP server for Claude, Cursor, VS Code',
                                           sj["description"], BASE + t["slug"] + "/", inner,
                                           '<a href="../">MCP tools</a> › ' + t["slug"]))
    inner = f"""<h1>Exact developer-file tools for AI assistants (MCP servers)</h1>
<p>AI assistants often guess how git, npm, Node, Docker and browserslist read their config files, and guess wrong.
Each server below computes the answer with the real rules, ported from the real tool and checked against it
on tens of thousands of cases (0 differences). One click to install in Claude Desktop, VS Code or Cursor.</p>
{"".join(cards)}"""
    (OUT / "index.html").write_text(page("MCP servers: exact gitignore, npm, package.json exports, Docker checks for AI assistants",
                                         "8 free MCP servers that give Claude, Cursor and VS Code exact answers about .gitignore, .dockerignore, .gitattributes, .editorconfig, npm publish, package-lock and package.json exports.",
                                         BASE, inner, '<a href="../">10aday</a> › MCP tools'))
    print("pages:", 1 + len(tools))


if __name__ == "__main__":
    main()
