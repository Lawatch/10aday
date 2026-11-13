#!/usr/bin/env python3
"""Builds docs/tools/nuget-version-range-checker/ from page.tpl.html, RESULTS.txt and nvr.js. Usage: python3 nvr/gen_page.py CHECKS"""
import json, re, sys, shutil, html, os
H = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(H, '../../../docs/tools/nuget-version-range-checker')
URL = "https://lawatch.github.io/10aday/tools/nuget-version-range-checker/"
TITLE = "NuGet Version Range Checker: which version does dotnet restore pick?"
DESC = "Paste a NuGet version such as [1.0,2.0), 1.* or 1.0.0-* and the versions published: see which ones match and which one dotnet restore picks. NuGet takes the lowest match, not the newest."
FAQ = [
("Why does NuGet install 1.0.0 for [1.0,2.0) and not the newest 1.x?",
 "NuGet uses the lowest applicable version: in a range it picks the lowest version that matches, unlike npm, Cargo or Maven, which pick the highest. We ran dotnet restore with 1.0.0, 1.5.0, 1.9.9 and 2.0.0 published: [1.0,2.0) restored 1.0.0. To get the newest 1.x, use a floating version: 1.* restored 1.4.0 out of 0.9.0, 1.0.0, 1.4.0, 1.9.9-beta and 2.0.0."),
("Does Version=\"1.0\" mean exactly 1.0 in a PackageReference?",
 "No. A bare version means 1.0 or higher. NuGet takes 1.0.0 if it exists. If it does not, it takes the next higher version and prints warning NU1603. For exactly 1.0, write [1.0]: if 1.0 is missing, restore fails with NU1102."),
("Why does NuGet skip my prerelease package?",
 "In a normal range, prerelease versions are only used if one of the bounds is itself a prerelease, or with a floating version ending in -*. [1.0,2.0) with 1.5.0-beta and 1.6.0 published restored 1.6.0. With only 1.5.0-beta published it failed with NU1103. [1.0.0-beta,2.0) or 1.*-* let prereleases in."),
("What is the difference between 1.*, 1.*-* and *-*?",
 "1.* takes the highest stable 1.x version. 1.*-* takes the highest 1.x version, prereleases included. *-* takes the highest version of all, prereleases included. * takes the highest stable version."),
("Can I use ^1.0, ~1.0 or >=1.0 in NuGet?",
 "No. These are npm or Cargo notations. NuGet only understands a bare version (a minimum), brackets such as [1.0,2.0) and floating versions with *. dotnet restore rejects ^1.0, ~1.0 and >=1.0. The NuGet equivalent of ^1.2 is [1.2,2.0), but NuGet will still pick the lowest match."),
("What do warnings NU1603 and NU1604 mean?",
 "NU1603: the lower bound of your range was not found, so NuGet used the next version up. NU1604: the range has no included lower bound, such as (,2.0] or (1.0,): the result depends on what the feed holds. (,2.0] restored 0.1.0, the lowest version available."),
]
WHY = {"lowest": "NuGet takes the lowest match, not the newest.", "bare-miss": "A bare version is a minimum. 1.0.0 is missing, so the next one up.",
 "pre-skip": "1.5.0-beta is skipped: no bound is a prerelease.", "pre-only": "Only a prerelease matches: restore fails.", "pre-bound": "A prerelease lower bound lets prereleases in.",
 "excl-min": "Lowest version above 1.0.", "upper-only": "No lower bound: the lowest version in the feed.", "exact-miss": "Exact version missing: restore fails.",
 "star": "Highest stable version.", "star-star": "Highest version, prereleases included.", "minor-float": "Highest stable 1.x.", "float-miss": "No 1.2.x at all: the lowest version above it.",
 "pre-float": "Highest 1.x, prereleases allowed. 1.5.0 is higher than 1.5.0-beta.", "rel-prefix": "Highest 1.0.0 prerelease starting with beta.",
 "float-range": "Floating inside a range: highest 1.x below 2.0.", "caret": "Not NuGet syntax: rejected.", "none-in": "Nothing between 1.0 and 2.0: restore fails."}
e = html.escape
rows, real = [], 0
for line in open(os.path.join(H, 'real_restore/RESULTS.txt')):
    m = re.match(r'^(\S+) \| Version="(.*)" \| published: (.*) \| restored: (\S+) \| codes: (.*)$', line.strip())
    if not m: continue
    real += 1
    if m.group(1) not in WHY: continue
    res = "fails" if m.group(4) == "FAIL" else m.group(4)
    if m.group(5).strip() not in ("", "none"): res += " (" + m.group(5).strip() + ")"
    rows.append(f'<tr><td class="v">{e(m.group(2))}</td><td class="v">{e(m.group(3).replace(" ", ", "))}</td><td class="v">{e(res)}</td><td>{e(WHY[m.group(1)])}</td></tr>')
ld1 = {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in FAQ]}
ld2 = {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [{"@type": "ListItem", "position": 1, "name": "10aday", "item": "https://lawatch.github.io/10aday/"}, {"@type": "ListItem", "position": 2, "name": "NuGet Version Range Checker", "item": URL}]}
t = open(os.path.join(H, 'page.tpl.html')).read()
for k, v in {"TITLE": e(TITLE), "DESC": e(DESC), "URL": URL, "LD1": json.dumps(ld1).replace("</", "<\\/"), "LD2": json.dumps(ld2),
             "REAL_ROWS": "\n".join(rows), "FAQ": "\n".join(f"<h3>{e(q)}</h3>\n<p>{e(a)}</p>" for q, a in FAQ),
             "CHECKS": sys.argv[1] if len(sys.argv) > 1 else "?", "REAL": str(real)}.items():
    t = t.replace("{{" + k + "}}", v)
os.makedirs(OUT, exist_ok=True)
open(os.path.join(OUT, 'index.html'), 'w').write(t); shutil.copy(os.path.join(H, 'nvr.js'), OUT)
print("written", OUT, "rows", len(rows), "real", real)
