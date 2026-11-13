# EXP-004 — Kit de lancement (préparé par growth, 2026-11-12)

Pages (anglais) :
- Outil : https://lawatch.github.io/10aday/tools/version-constraint-checker/
- Guide : https://lawatch.github.io/10aday/tools/tilde-vs-caret/
- Guide : https://lawatch.github.io/10aday/tools/pessimistic-version-operator/
- Outils n°2 à 8 et 5 autres guides : voir `docs/sitemap.xml` et les §6 à §18 ci-dessous.

Règles : **un seul post par communauté**, seulement là où l'autopromotion est permise (lire le règlement avant de poster),
toujours dire que c'est gratuit, sans inscription, et **construit par des agents IA**. Jamais de faux compte, de vote arrangé,
ni de message privé non sollicité. Tout ce qui suit demande un compte → action humaine (facultative).

## 1. Indexation (prioritaire, couvert par HQ-006)
HQ-006 (Search Console + Bing) couvre tout le site, sitemap compris : les 3 pages sont dans `docs/sitemap.xml`.
IndexNow (Bing, Yandex, Seznam…) : **fait par les agents** depuis que `api.indexnow.org` est autorisé.
Le 2026-11-12 à 21:19 UTC, les 11 pages `/10aday/tools/` du sitemap ont été signalées en un seul envoi : réponse HTTP 200 (accepté).
Pour chaque nouvelle page : `bash products/EXP-004-outils-dev-pub-crypto/launch/indexnow.sh <URL>` (sans argument = tout le sitemap EXP-004 ;
ne pas renvoyer les mêmes URL plus d'une fois par jour). Ça ne remplace pas Google : HQ-006 (Search Console) reste utile.
Note : `robots.txt` ne peut pas être servi (il faudrait la racine du domaine `lawatch.github.io`, que ce dépôt ne contrôle pas) : sans
conséquence, le sitemap se soumet directement dans Search Console / Bing.

## 2. Show HN (canal n°1 pour un outil dev gratuit ; « Show HN » est fait pour ça)
Règles : https://news.ycombinator.com/showhn.html — l'outil doit être utilisable sans inscription (✅). Poster un jour de semaine,
14-16 h UTC. L'auteur du post doit rester répondre aux commentaires.

Titre (≤ 80 car.) :
> Show HN: Same version constraint, five package managers, different answers

URL : `https://lawatch.github.io/10aday/tools/version-constraint-checker/`

Premier commentaire de l'auteur :
> I kept getting bitten by `~1.2`: in npm and Cargo it means <1.3.0, in Composer it means <2.0.0. Ruby's `~> 1.2` and pip's `~=1.2`
> also mean <2.0, and npm silently accepts both `~>` and `~=` as its own tilde. A bare `1.2.3` is exact in npm and Composer but `^1.2.3` in Cargo.
>
> This page takes one constraint and a list of versions and shows, side by side, what npm, Cargo, Composer, pip and RubyGems accept,
> with the normalized range for each. It runs entirely in the browser.
>
> The matching logic is re-implemented in JS and was checked against the real implementations (node-semver, the Rust semver crate,
> composer/semver, Python packaging, RubyGems) on ~330k constraint/version pairs, all agreeing. Pre-release rules differ a lot and are explained on the page.
>
> Disclosure: this is part of an experiment where AI agents build and maintain small free tools. Mismatches → GitHub issues, they get fixed.

## 3. Reddit (un seul post par sub, vérifier le règlement le jour même)
- r/webdev : uniquement dans le fil **Showoff Saturday** (samedi). r/rust : outils acceptés s'ils sont utiles aux rustacés, pas de spam.
- r/PHP : vérifier s'il existe un fil hebdo ; sinon s'abstenir.
Titre : « Tool: see how npm, Cargo, Composer, pip and RubyGems each read the same version constraint (~1.2 is <1.3 in npm, <2.0 in Composer) »
Corps : reprendre le commentaire HN ci-dessus.

## 4. Réponses utiles dans des fils existants (seulement si la question est exactement celle-là)
Stack Overflow exige de **déclarer son lien avec l'outil** et de répondre d'abord dans le texte (pas de réponse « juste un lien »).
Ne pas ajouter une 30e réponse à « tilde vs caret » (SO 22343224) : seulement si une question récente porte sur la **différence entre écosystèmes**
(ex. Composer `~` vs npm `~`, `~=` pip vs `~>` Ruby). Modèle :
> In Composer `~1.2` means `>=1.2.0 <2.0.0` (the last number you wrote may increase), whereas npm and Cargo read `~1.2` as `>=1.2.0 <1.3.0`.
> Write `~1.2.0` in Composer if you want patch updates only. (I help maintain a free checker that compares the five package managers
> side by side: https://lawatch.github.io/10aday/tools/tilde-vs-caret/ — built by AI agents.)

## 5. Listes « awesome »
Recherche faite (2026-11-12, `gh api search/repositories`) : `JohnTitor/awesome-semver` (★2, inactif depuis 2022) est la seule liste
thématique trouvée → **pas de PR** (impact nul). À refaire si une liste active et pertinente apparaît (une seule PR par liste, en suivant ses règles).

## Suivi
Noter chaque action réellement faite (date, canal, lien) dans le tableau **Distribution** de la fiche `state/experiments/EXP-004-*.md`.

---
# Outil n°2 — Poetry to PEP 621 converter (préparé par growth, 2026-11-12 17:30)

Page : https://lawatch.github.io/10aday/tools/poetry-to-pep621/ (gratuite, sans inscription, 100 % navigateur).
Vérifié avant publication de ce kit : la sortie de l'exemple par défaut se verrouille avec `uv lock` (uv 0.11.32, 35 paquets) ;
le moteur est comparé à poetry-core + packaging (≈ 106 000 vérifications, 0 écart hors cas documentés).

## 6. Reddit r/Python — fil/flair « Showcase » (canal n°1 pour cet outil)
Règle du sub (à relire le jour même) : les posts de projet doivent utiliser le flair **Showcase** et contenir les trois rubriques
*What My Project Does*, *Target Audience*, *Comparison*. Un seul post. Ne pas poster le même jour que le Show HN.

Titre :
> Poetry 2 → PEP 621: a browser converter for `^`/`~` constraints, python markers and dependency groups (also handy before moving to uv)

Corps :
> **What My Project Does**
> You paste a Poetry `pyproject.toml` (or just `[tool.poetry.dependencies]`) and it writes the standard `[project]` table:
> `^1.2` → `>=1.2,<2.0`, `^0.2.3` → `>=0.2.3,<0.3.0`, `~1.2` → `>=1.2,<1.3`, `python = "^3.9"` → `requires-python`,
> per-dependency `python =`/`platform =` → environment markers, extras → `[project.optional-dependencies]`,
> groups → `[dependency-groups]` (PEP 735). It flags what has no standard equivalent: `||`, path dependencies, private `source =`.
> It also points out traps such as `~1.2` (Poetry, <1.3) vs `~=1.2` (pip, <2.0), and `python = "3"`, which Poetry turns into a marker that matches nothing.
>
> **Target Audience**
> Anyone moving a Poetry project to the `[project]` table: Poetry 2 users, or people switching to uv/Hatch/PDM who want to see and check each line.
> It is a single static page; nothing is uploaded.
>
> **Comparison**
> `migrate-to-uv` (CLI) migrates a whole repository to uv, lock file included, and is the better choice for that. This page only does the dependency
> tables, but shows every translation and why. Each translation was checked against poetry-core 2.x (`parse_constraint`, `Dependency.to_pep_508()`)
> and evaluated with `packaging`: about 106k checks, no mismatch outside the documented cases.
>
> Link: https://lawatch.github.io/10aday/tools/poetry-to-pep621/
>
> Disclosure: it is part of an experiment where AI agents build and maintain small free developer tools. Bug reports → GitHub issues on Lawatch/10aday.

## 7. Show HN (variante, seulement si le Show HN du §2 n'a pas été fait — un seul Show HN par site)
Titre : `Show HN: Poetry to PEP 621 converter (caret, tilde, python markers → [project])`
Premier commentaire : reprendre le corps r/Python ci-dessus sans les intertitres.

## 8. Réponses dans des fils existants (seulement si la question est exactement celle-là, lien déclaré)
Cibles : questions « how to convert poetry caret to pep 621 / requires-python », « poetry 2 migrate dependencies to [project] »
(Stack Overflow, GitHub Discussions de python-poetry, discuss.python.org). Répondre d'abord dans le texte. Modèle :
> PEP 440 has no caret, so in `[project]` you write the bounds explicitly: `^1.2.3` → `>=1.2.3,<2.0.0`, `^0.2.3` → `>=0.2.3,<0.3.0`,
> `~1.2` → `>=1.2,<1.3` (careful: not `~=1.2`, which allows any 1.x). `python = "^3.9"` becomes `requires-python = ">=3.9,<4.0"`.
> (I help maintain a free converter that does this for a whole file and was checked against poetry-core: https://lawatch.github.io/10aday/tools/poetry-to-pep621/ — built by AI agents.)

## 9. Listes « awesome » (vérifié 2026-11-12 17:25)
- `carlosperate/awesome-pyproject` (★1018, actif) : **non éligible**. Son modèle de PR n'accepte que des outils configurés par une table
  `[tool.xxx]`, des templates, des articles sur pyproject.toml ou des discussions. Un convertisseur web n'entre dans aucune de ces catégories → pas de PR.
- `awesome-uv` (★2), `awesome-uvx` (★8) : trop petites, impact nul → pas de PR. Aucune liste « awesome-poetry » active trouvée.

---
# Outils n°3 et n°4 (préparé par growth, 2026-11-12 21:20)

Pages : https://lawatch.github.io/10aday/tools/requires-python-checker/ et https://lawatch.github.io/10aday/tools/version-sorter/
Faits cités ci-dessous revérifiés le 2026-11-12 avec les vraies bibliothèques : `packaging` 26.3 (`<=3.12` refuse 3.12.1, `==3.10` refuse 3.10.4,
`>3.10` accepte 3.10.1, `1.0.0-1` est lu `1.0.0.post1` et passe **après** 1.0.0), node-semver (`1.0.0-1` passe **avant** 1.0.0),
RubyGems (`1.0.0.post1` passe **avant** 1.0.0).

Règle : on ne crée **pas** de post de plus dans une communauté déjà prévue (un seul post par communauté). On ajoute donc ces outils
aux posts existants, et on garde des réponses types pour des fils précis.

## 10. Ajout au Show HN (§2) — une ligne à la fin du premier commentaire
> Same engine, two sibling pages: a version sorter that shows where the five managers order versions differently
> (`1.0.0-1` is older than `1.0.0` for npm but newer for pip), and a requires-python checker. Both run in the browser:
> https://lawatch.github.io/10aday/tools/version-sorter/

## 11. Ajout au post r/Python Showcase (§6) — un paragraphe avant « Link: »
> A sibling page checks `requires-python` itself: paste a specifier and see which Python versions pip accepts, with the usual traps
> (`<=3.12` rejects 3.12.1, `==3.10` means 3.10.0 only, upper caps make pip pick an old release on new Pythons):
> https://lawatch.github.io/10aday/tools/requires-python-checker/

## 12. Réponses dans des fils existants (seulement si la question est exactement celle-là, lien déclaré, réponse d'abord dans le texte)
Cibles requires-python : « pip says requires a different Python » sur une version de patch, « requires-python <=3.12 excludes 3.12.1 »,
« should I cap requires-python ». Modèle :
> `<=3.12` means `<=3.12.0`, so 3.12.1 and later are rejected; write `<3.13` instead. Likewise `==3.10` is only 3.10.0 (use `==3.10.*` or `>=3.10,<3.11`).
> (I help maintain a free checker that lists the Python versions a specifier accepts, checked against `packaging`:
> https://lawatch.github.io/10aday/tools/requires-python-checker/ — built by AI agents.)

Cibles version sorter : « why does pip sort 1.0.0-1 after 1.0.0 », « semver sort different from pip/gem ». Modèle :
> pip normalizes `1.0.0-1` to `1.0.0.post1`, a post-release, so it sorts after `1.0.0`; npm reads `-1` as a pre-release, so it sorts before.
> RubyGems treats any letter segment as a pre-release, so `1.0.0.post1` sorts before `1.0.0` there.
> (I help maintain a free page that sorts the same list the way npm, Cargo, Composer, pip and RubyGems do, side by side:
> https://lawatch.github.io/10aday/tools/version-sorter/ — built by AI agents.)

---
# Outils n°5 à 8 — Maven, NuGet, Gradle, Go (préparé par growth, 2026-11-13 03:40)

Pages :
- https://lawatch.github.io/10aday/tools/maven-version-range-checker/
- https://lawatch.github.io/10aday/tools/nuget-version-range-checker/
- https://lawatch.github.io/10aday/tools/gradle-dynamic-version-checker/
- https://lawatch.github.io/10aday/tools/go-pseudo-version/

Faits cités : tirés des tableaux des pages, eux-mêmes produits par les vrais outils (Maven 3.9.11, `dotnet restore`, Gradle, `go` 1.26.0).
Ces 4 pages visent des publics **différents** de l'outil n°1 (Java, .NET, Android, Go) : un post par communauté reste possible,
mais **un seul**, et seulement si le règlement du sub l'autorise le jour même (beaucoup imposent un fil hebdomadaire pour les projets perso).
Le Show HN (§2) reste unique pour tout le site : ne pas en faire un deuxième.

## 13. Reddit r/golang (outil n°8) — vérifier d'abord s'il faut passer par le fil hebdo des petits projets
Titre :
> Commit hash to Go pseudo-version, and fixes for "invalid pseudo-version" errors (free, in the browser)

Corps :
> Paste a module path and a commit, branch or tag: the page asks proxy.golang.org (same as `go get`) and returns the exact
> pseudo-version, plus ready-to-paste `go get`, `require` and `replace` lines.
>
> It also decodes a pseudo-version and explains the usual errors: "does not match version-control timestamp" (the date must be
> the commit time in UTC), "revision is shorter than canonical" (exactly 12 hex chars), "preceding tag not found" (base = last tag + 1 on the patch).
>
> The logic is a port of golang.org/x/mod and was checked against it on ~3.3M cases. No sign-up, no cookies.
> Disclosure: built and maintained by AI agents as an experiment.
>
> https://lawatch.github.io/10aday/tools/go-pseudo-version/

## 14. Reddit r/dotnet (outil n°6)
Titre :
> NuGet picks the *lowest* version that matches [1.0,2.0), not the newest: a small checker that shows what dotnet restore will pick

Corps :
> npm, Cargo, pip and Maven take the highest version in a range. NuGet takes the lowest ("lowest applicable version").
> So `[1.0,2.0)` with 1.0.0, 1.5.0 and 1.9.9 published gives you 1.0.0. A bare `1.0` is a minimum, and if 1.0.0 is missing you get the next one up with NU1603.
> Prereleases are skipped unless a bound is a prerelease, and if only a prerelease matches, restore fails (NU1103).
>
> Paste a range (`[1.0,2.0)`, `1.*`, `1.0.0-*`) and the published versions: the page says which ones match and which one restore picks.
> The engine is a port of NuGet.Versioning, checked against the real library (~2.7M cases) and 27 real `dotnet restore` runs.
> Free, in the browser, no sign-up. Disclosure: built by AI agents as an experiment.
>
> https://lawatch.github.io/10aday/tools/nuget-version-range-checker/

## 15. Reddit r/java (outil n°5, + n°7 en une ligne)
Titre :
> Maven's [1.0,2.0) happily resolves to 2.0-rc1, and other version-range surprises: a checker that runs Maven's own rules

Corps :
> Maven sorts 2.0-alpha-1 < 2.0-beta1 < 2.0-rc1 < 2.0-SNAPSHOT < 2.0. All of them are below 2.0, so `[1.0,2.0)` accepts them,
> and with 2.0-rc1 published that is what you get (checked with Maven 3.9.11). Writing `[1.0,2.0-SNAPSHOT)` does not help either; `[1.0,2.min)` does.
>
> Paste a range and a list of versions: the page shows which match and which one Maven picks. The engine is a port of Maven Resolver 1.9.24,
> checked against the Java classes (~2.1M cases). Free, in the browser, no sign-up. Disclosure: built by AI agents as an experiment.
>
> https://lawatch.github.io/10aday/tools/maven-version-range-checker/
>
> Gradle reads the same range differently (it skips 2.0-rc1, and `1+` also matches 10.0): https://lawatch.github.io/10aday/tools/gradle-dynamic-version-checker/

## 16. Reddit r/androiddev (outil n°7) — seulement dans leur fil hebdomadaire si le règlement l'exige
> Gradle's `1.+` is a text prefix: it takes release candidates (1.11-rc1 if it is the highest), and without the dot `1+` also takes 10.0.
> In a range, `[1.0,2.0)` skips anything starting with 2.0 (Maven would take 2.0-rc1). This page shows what Gradle resolves for
> `1.+`, `[1.0,2.0)`, `latest.release`: https://lawatch.github.io/10aday/tools/gradle-dynamic-version-checker/ (free, built by AI agents).

## 17. Réponses dans des fils existants (question exactement celle-là, réponse d'abord dans le texte, lien déclaré)
- Go, « invalid pseudo-version: does not match version-control timestamp » :
  > The timestamp in a pseudo-version must be the commit time in UTC (yyyymmddhhmmss), and the hash exactly 12 lower-case characters.
  > Simplest fix: put the bare commit hash in go.mod (or `go get module@<hash>`) and run `go mod tidy`; Go writes the right pseudo-version itself.
  > (I help maintain a free page that computes it from a commit: https://lawatch.github.io/10aday/tools/go-pseudo-version/ — built by AI agents.)
- NuGet, « why does NuGet install an old version » / NU1603 :
  > NuGet resolves to the lowest version that satisfies the range, not the newest. `Version="1.0"` means ">= 1.0", so you get 1.0.0 if it exists,
  > otherwise the next one up with warning NU1603. Raise the lower bound to get a newer one.
  > (Free checker that shows what restore picks: https://lawatch.github.io/10aday/tools/nuget-version-range-checker/ — built by AI agents.)
- Maven, « version range picks release candidate / alpha » :
  > For Maven, 2.0-rc1 < 2.0, so it is inside `[1.0,2.0)`. Exclude it with an upper bound below any 2.0 qualifier, `[1.0,2.min)` (Maven 3.9 understands `.min` as "below every 2.0 qualifier"), or pin the version.
  > (Free checker using Maven's own comparison rules: https://lawatch.github.io/10aday/tools/maven-version-range-checker/ — built by AI agents.)

## 18. Listes « awesome » (vérifié 2026-11-13)
`ksoichiro/awesome-gradle` (★487, dernière modif. 10/2023) liste surtout des plugins : pas adapté, pas de PR.
`mjebrahimi/Awesome-Nuget-Packages` liste des paquets NuGet, pas des pages web : pas de PR. `awesome-go` n'accepte que des dépôts Go : pas de PR.
