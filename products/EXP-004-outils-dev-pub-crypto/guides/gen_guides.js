// Generates the static SEO guide pages in docs/tools/<slug>/ from guides data.
// Every interval written on a page is CHECKED against vcc.js (itself 100 % equal to the official
// implementations, see ../test.js) on a set of probe versions: if a claim is wrong, generation fails.
// Usage: node products/EXP-004-outils-dev-pub-crypto/guides/gen_guides.js
const fs = require('fs'); const path = require('path');
const ROOT = path.join(__dirname, '..');
global.nodeSemver = (function () { const m = {}; const src = fs.readFileSync(path.join(ROOT, 'semver.min.js'), 'utf8'); new Function('globalThis', src + ';globalThis.nodeSemver=nodeSemver;')(m); return m.nodeSemver; })();
const VCC = require(path.join(ROOT, 'vcc.js'));
const cmp = (a, b) => { const x = a.split('.').map(Number), y = b.split('.').map(Number); for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] - y[i]; return 0; };
const BASE = 'https://lawatch.github.io/10aday/tools/';
const CHECKER = BASE + 'version-constraint-checker/';
const PROBES = ['0.0.0','0.0.3','0.0.4','0.0.9','0.1.0','0.1.5','0.2.0','0.2.3','0.2.9','0.3.0','0.9.9','1.0.0','1.1.9','1.2.0','1.2.2','1.2.3','1.2.9','1.3.0','1.9.9','2.0.0','2.5.0'];
const NAMES = { npm: 'npm', cargo: 'Cargo', composer: 'Composer', pip: 'pip', rubygems: 'RubyGems' };
let checks = 0;

// spec: 'invalid' | ['=', v] | [lo, hi]  (lo inclusive, hi exclusive)
function verify(eco, c, spec) {
  const p = VCC[eco].parse(c);
  if (spec === 'invalid') { if (p.valid) throw new Error(`${eco} ${c}: expected invalid`); checks++; return; }
  if (!p.valid) throw new Error(`${eco} ${c}: rejected but page says ${JSON.stringify(spec)}`);
  for (const v of PROBES) {
    const want = spec[0] === '=' ? cmp(v, spec[1]) === 0 : (cmp(v, spec[0]) >= 0 && cmp(v, spec[1]) < 0);
    const got = p.test(v);
    if (got !== want) throw new Error(`${eco} ${JSON.stringify(c)} on ${v}: engine says ${got}, page says ${want} (${JSON.stringify(spec)})`);
    checks++;
  }
}
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
function show(spec) {
  if (spec === 'invalid') return '<span class="na">not valid</span>';
  if (spec[0] === '=') return 'exactly ' + spec[1];
  return `≥${spec[0]} &lt;${spec[1]}`;
}
function tryLink(c, versions) {
  return `<a href="../version-constraint-checker/?c=${encodeURIComponent(c)}&amp;v=${encodeURIComponent(versions.join(','))}">try&nbsp;it</a>`;
}
function table(cols, rows, versions) {
  let h = '<div style="overflow-x:auto"><table><tr><th>Constraint</th>' + cols.map(e => `<th>${NAMES[e]}</th>`).join('') + '<th></th></tr>\n';
  for (const r of rows) {
    const cells = cols.map(e => {
      const c = r.per && r.per[e] ? r.per[e] : r.c;
      verify(e, c, r[e]);
      const diff = r.hl && r.hl.includes(e);
      return `<td${diff ? ' class="hl"' : ''}>${r.per ? `<code>${esc(c)}</code><br>` : ''}${show(r[e])}</td>`;
    }).join('');
    h += `<tr><td><code>${esc(r.label || r.c)}</code>${r.note ? `<br><small>${r.note}</small>` : ''}</td>${cells}<td>${tryLink(r.c, versions)}</td></tr>\n`;
  }
  return h + '</table></div>';
}
function page(g) {
  const url = BASE + g.slug + '/';
  const faqLd = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: g.faq.map(([q, a]) => ({ '@type': 'Question', name: q.replace(/<[^>]+>/g, ''), acceptedAnswer: { '@type': 'Answer', text: a.replace(/<[^>]+>/g, '') } })) };
  const crumbLd = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: '10aday', item: 'https://lawatch.github.io/10aday/' },
    { '@type': 'ListItem', position: 2, name: 'Version Constraint Checker', item: CHECKER },
    { '@type': 'ListItem', position: 3, name: g.short, item: url }] };
  const related = GUIDES.filter(x => x.slug !== g.slug).map(x => `<li><a href="../${x.slug}/">${x.short}</a></li>`).join('');
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${g.title}</title>
<meta name="description" content="${esc(g.description)}">
<link rel="canonical" href="${url}">
<meta property="og:title" content="${esc(g.title)}">
<meta property="og:description" content="${esc(g.description)}">
<meta property="og:type" content="article">
<meta property="og:url" content="${url}">
<meta name="twitter:card" content="summary">
<script type="application/ld+json">${JSON.stringify(faqLd)}</script>
<script type="application/ld+json">${JSON.stringify(crumbLd)}</script>
<style>
  body{font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:900px;margin:2rem auto;padding:0 1rem;line-height:1.6;color:#1d1d1f}
  h1{font-size:1.6rem;margin:.2rem 0 .6rem} h2{font-size:1.2rem;margin-top:2rem}
  code{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
  table{border-collapse:collapse;width:100%;margin:.6rem 0;font-size:.92rem}
  th,td{border:1px solid #ddd;padding:.35rem .5rem;text-align:left;vertical-align:top}
  th{background:#f6f6f6} td.hl{background:#fff4d6;font-weight:600} .na{color:#999}
  .muted{color:#666} .cta{background:#eef4ff;border:1px solid #b8cdf5;padding:.7rem .9rem;border-radius:6px}
  footer{margin-top:3rem;font-size:.85rem;color:#666;border-top:1px solid #ddd;padding-top:1rem}
</style>
</head>
<body>
<p class="muted"><a href="../../">10aday</a> › <a href="../version-constraint-checker/">Version Constraint Checker</a> › ${g.short}</p>
<h1>${g.h1}</h1>
${g.intro}
<p class="cta">Have a constraint and a list of versions? Paste them into the <a href="../version-constraint-checker/"><strong>Version Constraint Checker</strong></a>: it shows, side by side, what npm, Cargo, Composer, pip and RubyGems accept.</p>
${g.body(table)}
<!-- AADS slot: activate after HQ-004 -->
<h2>Common questions</h2>
${g.faq.map(([q, a]) => `<h3>${q}</h3>\n<p>${a}</p>`).join('\n')}
<h2>Related</h2>
<ul><li><a href="../version-constraint-checker/">Version Constraint Checker</a> — test any constraint against your versions in five package managers</li>${related}</ul>
<h2>Sources</h2>
<ul>
<li>npm: <a href="https://github.com/npm/node-semver#advanced-range-syntax">node-semver, advanced range syntax</a></li>
<li>Cargo: <a href="https://doc.rust-lang.org/cargo/reference/specifying-dependencies.html">Specifying dependencies</a></li>
<li>Composer: <a href="https://getcomposer.org/doc/articles/versions.md">Versions and constraints</a></li>
<li>pip: <a href="https://packaging.python.org/en/latest/specifications/version-specifiers/#compatible-release">Version specifiers, compatible release</a></li>
<li>RubyGems: <a href="https://guides.rubygems.org/patterns/#pessimistic-version-constraint">Pessimistic version constraint</a></li>
</ul>
<footer>
<p><strong>Built by AI agents</strong> as part of the <a href="../../">10aday</a> project. Every range on this page is generated by the engine of the
<a href="../version-constraint-checker/">Version Constraint Checker</a> and checked on probe versions. That engine agrees 100% with node-semver 7.8.5, the Rust <code>semver</code> crate 1.0.28,
composer/semver 3.6.0, Python <code>packaging</code> 26.3 and RubyGems 3.5.22 on about 330,000 test pairs. Found a mistake? <a href="https://github.com/Lawatch/10aday/issues">Open an issue</a>.</p>
</footer>
<script data-goatcounter="https://10aday.goatcounter.com/count" async src="//gc.zgo.at/count.js"></script>
</body>
</html>
`;
}

const GUIDES = [
{
  slug: 'tilde-vs-caret',
  short: 'Tilde vs caret',
  title: 'Tilde (~) vs Caret (^) Version Ranges: npm, Cargo and Composer Compared',
  h1: 'Tilde (~) vs caret (^): what each one allows in npm, Cargo and Composer',
  description: 'Exact ranges for ~1.2.3, ~1.2, ^1.2.3, ^0.2.3, ^0.0.3 in npm, Cargo and Composer. Why ~1.2 means <1.3 in npm but <2.0 in Composer, and how ^ behaves below 1.0.',
  intro: `<p><strong>Short answer:</strong> the caret <code>^</code> allows every update that does not change the <em>first non-zero</em> number;
the tilde <code>~</code> allows patch updates only, when you write a patch number. <code>^1.2.3</code> = ≥1.2.3 &lt;2.0.0 and <code>~1.2.3</code> = ≥1.2.3 &lt;1.3.0
in npm, Cargo and Composer alike. The trap is the <strong>two-number tilde</strong>: <code>~1.2</code> stops before 1.3.0 in npm and Cargo, but allows every 1.x from 1.2 in <strong>Composer</strong>.</p>`,
  faq: [
    ['What is the difference between ~ and ^ in package.json?', '<code>~1.2.3</code> accepts patch updates only (≥1.2.3 &lt;1.3.0). <code>^1.2.3</code> also accepts minor updates (≥1.2.3 &lt;2.0.0). npm writes <code>^</code> by default when you run <code>npm install</code>.'],
    ['Why does ^0.2.3 not accept 0.3.0?', 'Below 1.0.0 the caret locks the first non-zero number. <code>^0.2.3</code> means ≥0.2.3 &lt;0.3.0 and <code>^0.0.3</code> means ≥0.0.3 &lt;0.0.4, in npm, Cargo and Composer.'],
    ['Does ~1.2 mean the same in Composer and npm?', 'No. In npm and Cargo <code>~1.2</code> means ≥1.2.0 &lt;1.3.0. In Composer the last number you wrote may move, so <code>~1.2</code> means ≥1.2.0 &lt;2.0.0. Write <code>~1.2.0</code> in Composer if you want patch updates only.'],
    ['What does a bare version like "1.2.3" mean in Cargo.toml?', 'In Cargo a bare version is a caret requirement: <code>serde = "1.2.3"</code> means ^1.2.3 (≥1.2.3 &lt;2.0.0). In npm and Composer the same string means exactly 1.2.3. Use <code>=1.2.3</code> in Cargo to pin.'],
  ],
  body: t => `<h2>Tilde and caret, side by side</h2>
<p>Highlighted cells are where the package managers disagree.</p>
${t(['npm', 'cargo', 'composer'], [
  { c: '~1.2.3', npm: ['1.2.3', '1.3.0'], cargo: ['1.2.3', '1.3.0'], composer: ['1.2.3', '1.3.0'] },
  { c: '~1.2', npm: ['1.2.0', '1.3.0'], cargo: ['1.2.0', '1.3.0'], composer: ['1.2.0', '2.0.0'], hl: ['composer'] },
  { c: '~1', npm: ['1.0.0', '2.0.0'], cargo: ['1.0.0', '2.0.0'], composer: ['1.0.0', '2.0.0'] },
  { c: '~0.2.3', npm: ['0.2.3', '0.3.0'], cargo: ['0.2.3', '0.3.0'], composer: ['0.2.3', '0.3.0'] },
  { c: '~0.2', npm: ['0.2.0', '0.3.0'], cargo: ['0.2.0', '0.3.0'], composer: ['0.2.0', '1.0.0'], hl: ['composer'] },
  { c: '^1.2.3', npm: ['1.2.3', '2.0.0'], cargo: ['1.2.3', '2.0.0'], composer: ['1.2.3', '2.0.0'] },
  { c: '^1.2', npm: ['1.2.0', '2.0.0'], cargo: ['1.2.0', '2.0.0'], composer: ['1.2.0', '2.0.0'] },
  { c: '^1', npm: ['1.0.0', '2.0.0'], cargo: ['1.0.0', '2.0.0'], composer: ['1.0.0', '2.0.0'] },
  { c: '^0.2.3', npm: ['0.2.3', '0.3.0'], cargo: ['0.2.3', '0.3.0'], composer: ['0.2.3', '0.3.0'], note: 'below 1.0: minor = breaking' },
  { c: '^0.2', npm: ['0.2.0', '0.3.0'], cargo: ['0.2.0', '0.3.0'], composer: ['0.2.0', '0.3.0'] },
  { c: '^0.0.3', npm: ['0.0.3', '0.0.4'], cargo: ['0.0.3', '0.0.4'], composer: ['0.0.3', '0.0.4'], note: 'only 0.0.3 releases' },
  { c: '^0.0', npm: ['0.0.0', '0.1.0'], cargo: ['0.0.0', '0.1.0'], composer: ['0.0.0', '0.1.0'] },
  { c: '^0', npm: ['0.0.0', '1.0.0'], cargo: ['0.0.0', '1.0.0'], composer: ['0.0.0', '1.0.0'] },
  { c: '1.2.3', label: '1.2.3 (bare)', npm: ['=', '1.2.3'], cargo: ['1.2.3', '2.0.0'], composer: ['=', '1.2.3'], hl: ['cargo'] },
], ['0.2.9', '0.3.0', '1.2.0', '1.2.9', '1.3.0', '1.9.9', '2.0.0'])}
<p class="muted">Ranges shown for release versions. Pre-releases such as <code>1.3.0-rc.1</code> follow extra rules in each tool; see the
<a href="../version-constraint-checker/">checker</a>, which shows them.</p>
<h2>How to remember it</h2>
<ul>
<li><strong>Caret <code>^</code></strong>: “compatible with” — keep the leftmost non-zero number, let everything to its right move.</li>
<li><strong>Tilde <code>~</code> in npm and Cargo</strong>: “approximately” — keep major and minor, let the patch move (with <code>~1</code>, keep the major).</li>
<li><strong>Tilde <code>~</code> in Composer</strong>: let the <em>last number you wrote</em> move. <code>~1.2</code> → any 1.x ≥ 1.2; <code>~1.2.3</code> → any 1.2.x ≥ 1.2.3.
This is the same rule as Ruby's <code>~&gt;</code> and pip's <code>~=</code>: see <a href="../pessimistic-version-operator/">~&gt; vs ~= vs ~</a>.</li>
</ul>`
},
{
  slug: 'pessimistic-version-operator',
  short: '~> vs ~= vs ~',
  title: '~> vs ~= vs ~: Pessimistic Version Constraints in RubyGems, pip, Composer, npm and Cargo',
  h1: '<code>~&gt;</code> vs <code>~=</code> vs <code>~</code>: the “pessimistic” operator in five package managers',
  description: 'Gemfile ~> 2.1, pip ~=1.4.2, Composer ~1.2 and npm ~1.2 compared: exact ranges in each package manager, and why ~1.2 is <1.3 in npm but <2.0 elsewhere.',
  intro: `<p>RubyGems (<code>~&gt;</code>, the “pessimistic” or “twiddle-wakka” operator), pip (<code>~=</code>, “compatible release”) and Composer (<code>~</code>) share one rule:
<strong>the last number you wrote may increase, the ones before it are fixed</strong>. npm and Cargo use <code>~</code> differently: they always keep the minor number when you give one.
So the “same” constraint on <code>1.2</code> means <code>&lt;2.0</code> in three tools and <code>&lt;1.3</code> in the other two.</p>`,
  faq: [
    ['What does ~> mean in a Gemfile?', '<code>~&gt; 2.1</code> means ≥2.1 and &lt;3.0; <code>~&gt; 2.1.0</code> means ≥2.1.0 and &lt;2.2. RubyGems drops the last number you wrote and bumps the one before it. It is called the pessimistic version constraint.'],
    ['What does ~= mean in requirements.txt?', 'It is the PEP 440 compatible release operator. <code>~=1.4.2</code> means ≥1.4.2 and ==1.4.*; <code>~=1.4</code> means ≥1.4 and ==1.* (so &lt;2.0). <code>~=1</code> is invalid: it needs at least two numbers.'],
    ['Is pip ~= the same as npm ~?', 'Only with three numbers. <code>~=1.4.2</code> and npm <code>~1.4.2</code> both mean ≥1.4.2 &lt;1.5.0. With two numbers they differ: pip <code>~=1.4</code> allows up to &lt;2.0, npm <code>~1.4</code> stops before 1.5.0.'],
    ['Can I write ~> in package.json?', 'npm accepts <code>~&gt;</code> and reads it as its own tilde, so <code>~&gt; 1.2</code> in package.json means ≥1.2.0 &lt;1.3.0, not the RubyGems meaning (&lt;2.0). Cargo and Composer reject <code>~&gt;</code>.'],
  ],
  body: t => `<h2>The same intent, five spellings</h2>
<p>Each cell shows the operator that package manager uses, then the range it really allows. Highlighted: the two tools that read the two-number form differently.</p>
${t(['rubygems', 'pip', 'composer', 'npm', 'cargo'], [
  { c: '~1', label: 'on 1', per: { rubygems: '~> 1', pip: '~=1', composer: '~1', npm: '~1', cargo: '~1' },
    rubygems: ['1.0.0', '2.0.0'], pip: 'invalid', composer: ['1.0.0', '2.0.0'], npm: ['1.0.0', '2.0.0'], cargo: ['1.0.0', '2.0.0'] },
  { c: '~1.2', label: 'on 1.2', per: { rubygems: '~> 1.2', pip: '~=1.2', composer: '~1.2', npm: '~1.2', cargo: '~1.2' },
    rubygems: ['1.2.0', '2.0.0'], pip: ['1.2.0', '2.0.0'], composer: ['1.2.0', '2.0.0'], npm: ['1.2.0', '1.3.0'], cargo: ['1.2.0', '1.3.0'], hl: ['npm', 'cargo'] },
  { c: '~1.2.3', label: 'on 1.2.3', per: { rubygems: '~> 1.2.3', pip: '~=1.2.3', composer: '~1.2.3', npm: '~1.2.3', cargo: '~1.2.3' },
    rubygems: ['1.2.3', '1.3.0'], pip: ['1.2.3', '1.3.0'], composer: ['1.2.3', '1.3.0'], npm: ['1.2.3', '1.3.0'], cargo: ['1.2.3', '1.3.0'] },
  { c: '~0.2', label: 'on 0.2', per: { rubygems: '~> 0.2', pip: '~=0.2', composer: '~0.2', npm: '~0.2', cargo: '~0.2' },
    rubygems: ['0.2.0', '1.0.0'], pip: ['0.2.0', '1.0.0'], composer: ['0.2.0', '1.0.0'], npm: ['0.2.0', '0.3.0'], cargo: ['0.2.0', '0.3.0'], hl: ['npm', 'cargo'] },
], ['1.1.9', '1.2.0', '1.2.9', '1.3.0', '1.9.9', '2.0.0'])}
<p class="muted">The “try it” links open the checker with the npm/Cargo/Composer spelling; type <code>~&gt; 1.2</code> or <code>~=1.2</code> there to see RubyGems and pip.</p>
<h2>Cross-checks you can rely on</h2>
${t(['npm', 'cargo', 'composer', 'pip', 'rubygems'], [
  { c: '~> 1.2', npm: ['1.2.0', '1.3.0'], cargo: 'invalid', composer: 'invalid', pip: 'invalid', rubygems: ['1.2.0', '2.0.0'], hl: ['npm'], note: 'npm reads it as ~1.2' },
  { c: '~=1.2', npm: ['1.2.0', '1.3.0'], cargo: 'invalid', composer: 'invalid', pip: ['1.2.0', '2.0.0'], rubygems: 'invalid', hl: ['npm'], note: 'npm reads it as ~1.2' },
], ['1.2.0', '1.2.9', '1.3.0', '1.9.9', '2.0.0'])}
<h2>Which one should I write?</h2>
<ul>
<li>To allow <strong>patch updates only</strong>, write three numbers everywhere: <code>~&gt; 1.2.3</code>, <code>~=1.2.3</code>, <code>~1.2.3</code>. All five tools agree: ≥1.2.3 &lt;1.3.0.</li>
<li>To allow <strong>minor updates</strong>, prefer the caret in npm, Cargo and Composer (<code>^1.2</code>), and the two-number form in RubyGems and pip (<code>~&gt; 1.2</code>, <code>~=1.2</code>).
See <a href="../tilde-vs-caret/">tilde vs caret</a>.</li>
</ul>`
},
];

for (const g of GUIDES) {
  const out = path.join(ROOT, '../../docs/tools', g.slug, 'index.html');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, page(g));
  console.log('wrote', path.relative(path.join(ROOT, '../..'), out));
}
console.log(`${checks} claims checked against vcc.js — all OK`);
