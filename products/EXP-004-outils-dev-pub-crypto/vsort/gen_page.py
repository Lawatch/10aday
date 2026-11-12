# Generates docs/tools/version-sorter/index.html (static text + FAQ JSON-LD). The interactive part runs vcc.js in the browser.
# Every comparison stated in the FAQ is checked by vsort/claims.js.
import json, html, os
FAQ = [
 ("How do I sort version numbers correctly?", "Do not sort them as text: as text, 1.10 comes before 1.9. Compare the numbers one by one, then apply your package manager's rule for pre-releases (1.0.0-rc.1 comes before 1.0.0). Each package manager has slightly different rules, which is why this tool shows all five orders."),
 ("Is 1.0.0-rc.1 older or newer than 1.0.0?", "Older, in all five package managers: a pre-release always comes before the final release with the same numbers."),
 ("Why is 1.0.0-alpha.10 newer than 1.0.0-alpha.2?", "Identifiers made only of digits are compared as numbers, so 10 > 2, in all five package managers. Text sorting gets this wrong. Prefer alpha.2 to alpha2: for npm and Cargo, 1.0.0-alpha10 is older than 1.0.0-alpha2, because alpha10 and alpha2 are compared as text."),
 ("Is 1.0.0-1 older or newer than 1.0.0?", "It depends. For npm, Cargo and RubyGems it is a pre-release, so it is older. For pip (PEP 440), 1.0.0-1 means the post-release 1.0.0.post1, so it is newer. Composer rejects it."),
 ("Are 1.0 and 1.0.0 the same version?", "For pip, Composer and RubyGems, yes: missing parts count as zeros. For npm and Cargo, 1.0 is not a valid version: a full version needs three numbers."),
 ("Does build metadata like 1.0.0+build.1 change the order?", "Not for npm, Cargo or Composer: build metadata is ignored when ordering. In pip, +build.1 is a local version label, and 1.0.0+build.1 sorts after 1.0.0. RubyGems rejects the plus sign."),
 ("Where does dev-master go when Composer sorts versions?", "Composer's Semver::sort reads dev-master, dev-default and dev-trunk as 9999999-dev, so they come after every numbered version. Other branch names, such as dev-main or dev-feature, have no order between them."),
]
URL = "https://lawatch.github.io/10aday/tools/version-sorter/"
ld = {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in FAQ]}
bc = {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [{"@type": "ListItem", "position": 1, "name": "10aday", "item": "https://lawatch.github.io/10aday/"}, {"@type": "ListItem", "position": 2, "name": "Version sorter", "item": URL}]}
dump = lambda o: json.dumps(o, ensure_ascii=False).replace('<', '\\u003c')
title = "Version Sorter: Sort and Compare Version Numbers (npm, Cargo, Composer, pip, RubyGems)"
desc = "Paste version numbers and see them sorted the way npm, Cargo, Composer, pip and RubyGems sort them, side by side, with the places where they disagree: 1.0.0-1, 1.0.0+build, .post1, dev-master, alpha.10."
faq = "\n".join(f"<h3>{html.escape(q)}</h3>\n<p>{html.escape(a)}</p>" for q, a in FAQ)
here = os.path.dirname(os.path.abspath(__file__))
tpl = open(os.path.join(here, 'page.tpl.html'), encoding='utf-8').read()
out = (tpl.replace('{{TITLE}}', html.escape(title)).replace('{{DESC}}', html.escape(desc)).replace('{{URL}}', URL)
          .replace('{{LD_FAQ}}', dump(ld)).replace('{{LD_BC}}', dump(bc)).replace('{{FAQ}}', faq))
open(os.path.join(here, '../../../docs/tools/version-sorter/index.html'), 'w', encoding='utf-8').write(out)
json.dump(FAQ, open(os.path.join(here, 'faq.json'), 'w'), indent=1)
print('ok', len(out))
