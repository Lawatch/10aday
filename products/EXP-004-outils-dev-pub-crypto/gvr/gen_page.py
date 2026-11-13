#!/usr/bin/env python3
"""Builds docs/tools/gradle-dynamic-version-checker/ from page.tpl.html, real_gradle/RESULTS.txt and gvr.js. Usage: python3 gvr/gen_page.py CHECKS"""
import json, re, sys, shutil, html, os
H = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(H, '../../../docs/tools/gradle-dynamic-version-checker')
URL = "https://lawatch.github.io/10aday/tools/gradle-dynamic-version-checker/"
TITLE = "Gradle Dynamic Version Checker: what does 1.+ or [1.0,2.0) resolve to?"
DESC = "Paste a Gradle version such as 1.+, [1.0,2.0) or latest.release and the versions published: see which ones match and which one Gradle resolves. Betas count, and 1+ matches 10.0."
FAQ = [
("What does 1.+ mean in Gradle?",
 "1.+ matches every version whose text starts with \"1.\" and Gradle takes the highest one. It is a text prefix, not a semantic rule: betas and release candidates are included. We ran Gradle with 1.0 and 1.1-rc1 published: 1.+ resolved 1.1-rc1. With 1.0, 1.9, 1.10 and 2.0 published it resolved 1.10, because 10 is higher than 9."),
("Why does 1+ pick version 10.0?",
 "Without a dot, the prefix is just \"1\", and \"10.0\" and \"11.2\" start with \"1\". With 1.0, 1.5, 10.0 and 11.2 published, 1+ resolved 11.2. Write 1.+ instead. The same trap exists one level down: 1.1+ matches 1.12.0."),
("Does Gradle include 2.0-rc1 in the range [1.0,2.0)?",
 "No. For an excluded upper bound, Gradle also leaves out every version whose text starts with the bound, so 2.0-rc1 and 2.0-beta1 are skipped. With 1.0, 1.5, 2.0-rc1 and 2.0 published, [1.0,2.0) resolved 1.5. Maven handles the same range differently and would take 2.0-rc1. Betas below the bound still count: [1.0,) resolved 3.1-alpha1."),
("Does latest.release skip betas and release candidates?",
 "No, not in a Maven repository. There, only -SNAPSHOT versions have the status \"integration\"; everything else is a \"release\". With 1.0, 1.1 and 2.0-rc1 published, latest.release resolved 2.0-rc1. latest.integration also takes -SNAPSHOT versions."),
("Is \"1.2.3\" in Gradle an exact version?",
 "It is the version Gradle asks for, but not a hard limit. If another library in the build needs a higher version, Gradle's conflict resolution takes the higher one. For a hard pin, use strictly, for example implementation(\"g:a\") { version { strictly(\"1.2.3\") } }. [1.2.3] is read as the plain version 1.2.3."),
("Can I use ^1.0, ~1.0, >=1.0 or 1.* in Gradle?",
 "No. Gradle does not know these signs and reads the whole text as a fixed version, so the build looks for a version literally called \"^1.0\" and fails. Use 1.+ for \"any 1.x\" or a range: [1.0,2.0) for \">=1.0 <2.0\", (1.0,) for \">1.0\"."),
]
WHY = ["10 is higher than 9: the highest text starting with “1.” wins.", "A release candidate starts with “1.” too, and it is the highest.", "1.2-beta1 is higher than 1.1: betas are not skipped.",
 "“1” does not start with “1.”: nothing matches.", "No dot: “10.0” and “11.2” start with “1”.", "“1.12.0” starts with “1.1”.", "With the dot, 1.12.0 is left out.", "Highest of all, release candidates included.",
 "2.0-rc1 starts with the excluded bound 2.0: skipped.", "Same rule for betas.", "Bound “2”: 2.0-beta1 and 2-rc1 both start with it.", "Kotlin-style RC starting with the bound: skipped.",
 "1.5.1 is above 1.5, and 1.5-rc1 is below it but lower than 1.5.", "Included upper bound.", "No upper bound: an alpha above 3.0 is taken.", "Ivy-style brackets: ]1.0 excludes 1.0.",
 "Single-version range = that version.", "Fixed version.", "In a Maven repository an RC counts as a release.", "-SNAPSHOT is not a release.", "latest.integration takes snapshots.",
 "1.0-final and 1.0-dev are both lower than 1.0.", "Both are below 1.0: nothing matches.", "1.0.1-dev is higher than 1.0.0.", "1.0.1 beats 1.0-sp1 (number beats word); 1.1-rc1 starts with the bound.",
 "Uppercase RC and Beta still rank below the final.", "Nothing between 1.5 and 2.0: fails."]
SHOW = [0, 1, 2, 4, 5, 8, 10, 14, 15, 18, 19, 21, 24, 26]
e = html.escape
lines = [l.strip() for l in open(os.path.join(H, 'real_gradle/RESULTS.txt')) if l.strip() and not l.startswith('#')]
gradle = re.match(r'# Gradle (\S+)', open(os.path.join(H, 'real_gradle/RESULTS.txt')).readline()).group(1)
assert len(lines) == len(WHY), (len(lines), len(WHY))
rows = []
for i in SHOW:
    sel, vers, got = lines[i].split('|')
    rows.append(f'<tr><td class="v">{e(sel)}</td><td class="v">{e(vers.replace(",", ", "))}</td><td class="v">{"fails" if got == "FAIL" else e(got)}</td><td>{e(WHY[i])}</td></tr>')
ld1 = {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in FAQ]}
ld2 = {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [{"@type": "ListItem", "position": 1, "name": "10aday", "item": "https://lawatch.github.io/10aday/"}, {"@type": "ListItem", "position": 2, "name": "Gradle Dynamic Version Checker", "item": URL}]}
t = open(os.path.join(H, 'page.tpl.html')).read()
for k, v in {"TITLE": e(TITLE), "DESC": e(DESC), "URL": URL, "LD1": json.dumps(ld1).replace("</", "<\\/"), "LD2": json.dumps(ld2),
             "REAL_ROWS": "\n".join(rows), "FAQ": "\n".join(f"<h3>{e(q)}</h3>\n<p>{e(a)}</p>" for q, a in FAQ),
             "CHECKS": sys.argv[1] if len(sys.argv) > 1 else "?", "REAL": str(len(lines)), "GRADLE": gradle}.items():
    t = t.replace("{{" + k + "}}", v)
assert "{{" not in t
os.makedirs(OUT, exist_ok=True)
open(os.path.join(OUT, 'index.html'), 'w').write(t); shutil.copy(os.path.join(H, 'gvr.js'), OUT)
print("written", OUT, "rows", len(rows), "real", len(lines))
