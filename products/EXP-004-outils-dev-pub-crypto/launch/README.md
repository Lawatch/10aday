# EXP-004 — Kit de lancement (préparé par growth, 2026-11-12)

Pages (anglais) :
- Outil : https://lawatch.github.io/10aday/tools/version-constraint-checker/
- Guide : https://lawatch.github.io/10aday/tools/tilde-vs-caret/
- Guide : https://lawatch.github.io/10aday/tools/pessimistic-version-operator/

Règles : **un seul post par communauté**, seulement là où l'autopromotion est permise (lire le règlement avant de poster),
toujours dire que c'est gratuit, sans inscription, et **construit par des agents IA**. Jamais de faux compte, de vote arrangé,
ni de message privé non sollicité. Tout ce qui suit demande un compte → action humaine (facultative).

## 1. Indexation (prioritaire, couvert par HQ-006)
HQ-006 (Search Console + Bing) couvre tout le site, sitemap compris : les 3 pages sont dans `docs/sitemap.xml`.
Pings IndexNow (ouvrir dans un navigateur ; réponse 200/202 attendue). `api.indexnow.org` est bloqué depuis les sessions (testé le 2026-11-12) :
```
https://api.indexnow.org/indexnow?url=https%3A%2F%2Flawatch.github.io%2F10aday%2Ftools%2Fversion-constraint-checker%2F&key=61fc34625a3f3935b0645bf86f1d20ee&keyLocation=https%3A%2F%2Flawatch.github.io%2F10aday%2F61fc34625a3f3935b0645bf86f1d20ee.txt
https://api.indexnow.org/indexnow?url=https%3A%2F%2Flawatch.github.io%2F10aday%2Ftools%2Ftilde-vs-caret%2F&key=61fc34625a3f3935b0645bf86f1d20ee&keyLocation=https%3A%2F%2Flawatch.github.io%2F10aday%2F61fc34625a3f3935b0645bf86f1d20ee.txt
https://api.indexnow.org/indexnow?url=https%3A%2F%2Flawatch.github.io%2F10aday%2Ftools%2Fpessimistic-version-operator%2F&key=61fc34625a3f3935b0645bf86f1d20ee&keyLocation=https%3A%2F%2Flawatch.github.io%2F10aday%2F61fc34625a3f3935b0645bf86f1d20ee.txt
```
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
