# 10aday

Système d'agents IA autonomes qui se relaient pour atteindre **10 € nets / jour**.
Chaque heure, une session Claude Code fraîche se lance, lit l'état du système dans ce dépôt,
joue un rôle, livre quelque chose de concret, puis passe le relais.

## Comment ça marche
```
routine horaire ─▶ répartiteur (session de cadrage) ─▶ ops/dispatch.py ─▶ N sessions fraîches EN PARALLÈLE
                                                                           ├─ pilotage    (3 h)  🧭 strategist / 📊 analyst
                                                                           ├─ exploration (2 h)  🔭 scout
                                                                           ├─ exp-EXP-001 (1 h)  🔨 builder / 📣 growth
                                                                           ├─ exp-EXP-002 (1 h)  …
                                                                           └─ exp-EXP-00N (1 h)  …
                       └─▶ ops/build_dashboard.py ─▶ DASHBOARD.md + page privée « tableau de bord »
```

## 🧰 Outils publiés (gratuits, sans inscription)
Site : **https://lawatch.github.io/10aday/** — chaque couloir `exp-*` ajoute ici une ligne par outil publié.
- [Rupture conventionnelle : les 3 calculs à faire](https://lawatch.github.io/10aday/rupture-conventionnelle/) — parcours guidé qui enchaîne les trois calculateurs ci-dessous (dates → indemnité → chômage).
- [Rupture conventionnelle : calcul des dates](https://lawatch.github.io/10aday/rupture-conventionnelle-dates/) — fin du délai de rétractation, fin de l'homologation par la DREETS, date de départ au plus tôt (jours fériés, Alsace-Moselle, export agenda .ics).
- [Rupture conventionnelle : indemnité minimale](https://lawatch.github.io/10aday/rupture-conventionnelle-indemnite/) — plancher légal de l'indemnité (ancienneté en mois complets, salaire de référence 12 ou 3 mois), comparaison avec le montant proposé.
- [Indemnité compensatrice de congés payés au départ](https://lawatch.github.io/10aday/indemnite-conges-payes-depart/) — 1/10e ou maintien de salaire, congés acquis pendant un arrêt maladie (loi du 22 avril 2024).
- [Rupture conventionnelle : impôt, cotisations et CSG](https://lawatch.github.io/10aday/rupture-conventionnelle-impot-csg/) — part imposable (art. 80 duodecies), part soumise à cotisations (2 et 10 PASS), CSG/CRDS sur la part au-delà du minimum légal, montant restant.
- [Délais pour contester après une rupture conventionnelle](https://lawatch.github.io/10aday/delais-contestation-rupture/) — dates limites : rupture (12 mois), solde de tout compte (6 mois), salaires (3 ans), exécution du contrat (2 ans), discrimination et harcèlement (5 ans).
- [Mutuelle après une rupture conventionnelle](https://lawatch.github.io/10aday/mutuelle-apres-rupture-conventionnelle/) — jusqu'à quand la mutuelle et la prévoyance d'entreprise restent gratuites (portabilité, 12 mois maximum), puis date limite loi Évin (6 mois).
- [Rupture conventionnelle d'un salarié protégé : calcul des délais](https://lawatch.github.io/10aday/rupture-conventionnelle-salarie-protege/) — délégué syndical, élu du CSE : rétractation, demande à l'inspecteur du travail, 2 mois de délai (silence = refus), départ au plus tôt, recours.
- [Indemnité de rupture conventionnelle après du temps partiel ou un congé parental](https://lawatch.github.io/10aday/indemnite-rupture-conventionnelle-temps-partiel/) — ancienneté retenue (congé parental pour moitié, absences retirées) et salaire de référence pondéré (art. L3123-5).
- [Chômage après une rupture conventionnelle : date de début](https://lawatch.github.io/10aday/chomage-rupture-conventionnelle/) — différé spécifique (indemnité supra-légale ÷ 111,8 en 2026), différé congés payés, délai d'attente de 7 jours.
- [Version Constraint Checker](https://lawatch.github.io/10aday/tools/version-constraint-checker/) (EN) — how npm, Cargo, Composer, pip and RubyGems read `~1.2`, `^0.3`, `~> 2.1`, `~=1.4`… Guides : [tilde vs caret](https://lawatch.github.io/10aday/tools/tilde-vs-caret/), [~> vs ~= vs ~](https://lawatch.github.io/10aday/tools/pessimistic-version-operator/), [x, *, hyphen, ||](https://lawatch.github.io/10aday/tools/npm-version-range-syntax/), [Cargo.toml](https://lawatch.github.io/10aday/tools/cargo-version-requirements/), [Composer](https://lawatch.github.io/10aday/tools/composer-version-constraints/), [pip ~=](https://lawatch.github.io/10aday/tools/pip-compatible-release/), [Poetry ^ and ~](https://lawatch.github.io/10aday/tools/poetry-version-constraints/), [pre-releases](https://lawatch.github.io/10aday/tools/prerelease-versions/).
- [requires-python Checker](https://lawatch.github.io/10aday/tools/requires-python-checker/) (EN) — paste `>=3.10`, `<=3.12`, `~=3.10`… and see exactly which Python versions pip accepts in `pyproject.toml`.
- [Poetry → PEP 621 converter](https://lawatch.github.io/10aday/tools/poetry-to-pep621/) (EN) — turns `[tool.poetry.dependencies]` (`^1.2`, `~1.2`) into a `[project]` table for Poetry 2 or uv.
- [Version Sorter](https://lawatch.github.io/10aday/tools/version-sorter/) (EN) — sorts version numbers the way npm, Cargo, Composer, pip and RubyGems do, side by side, and shows where they disagree.
- [Go pseudo-version generator](https://lawatch.github.io/10aday/tools/go-pseudo-version/) (EN) — commit hash → exact `v0.0.0-2019…-abcdef` version for `go.mod`, and decoder.
- [Maven Version Range Checker](https://lawatch.github.io/10aday/tools/maven-version-range-checker/) (EN) — test `[1.0,2.0)` or `(,1.5]` against a list of versions, and see why `[1.0,2.0)` can pick `2.0-rc1`.
- [NuGet Version Range Checker](https://lawatch.github.io/10aday/tools/nuget-version-range-checker/) (EN) — which version `dotnet restore` picks for `[1.0,2.0)`, `1.*` or `1.0.0-*`.
- [Gradle Dynamic Version Checker](https://lawatch.github.io/10aday/tools/gradle-dynamic-version-checker/) (EN) — what `1.+`, `[1.0,2.0)` or `latest.release` resolve to.
- [`verrange`](verrange/) — Go library: NuGet version ranges read exactly like `dotnet restore` ([pkg.go.dev](https://pkg.go.dev/github.com/Lawatch/10aday/verrange/nuget)). Maven and Gradle next.

## 👉 Pour suivre : [`DASHBOARD.md`](DASHBOARD.md)
Chaque expérience : hypothèse, modèle de revenu, métrique, **valeur actuelle mesurée**, seuils de succès/échec, date de décision, revenu, verdict.

| Fichier | Rôle |
|---|---|
| `DASHBOARD.md`, `dashboard/` | Tableau de bord **généré** (ne pas éditer) |
| `CHARTER.md` | Mission, paliers, contraintes, règles absolues |
| `ops/RUNBOOK.md` | Protocole de chaque agent : couloirs, verrous, propriété des fichiers |
| `ops/dispatch.py` | Décide quels couloirs lancer à chaque heure |
| `ops/ROUTINE_PROMPT.md` | Prompt des agents (éditable par le stratège) |
| `agents/*.md` | Fiches de rôle (améliorées par le stratège) |
| `state/STATUS.md` | Décisions du stratège, focus |
| `state/experiments/` | Une fiche par expérience (en-tête chiffré) |
| `state/ideas.md`, `research/` | Pipeline d'idées scorées et dossiers prêts à lancer |
| `state/ledger.csv` | Revenus/dépenses **réels** |
| `state/LEARNINGS.md` | Enseignements cumulés |
| `state/HUMAN_QUEUE.md` | **Ce que les agents attendent de toi** |
| `journal/` | Un compte rendu par passage d'agent |
| `products/`, `docs/` | Ce qui est construit / publié (GitHub Pages) |

## Ton rôle d'humain
1. Regarde régulièrement `state/HUMAN_QUEUE.md` et réponds-y (ouvrir un compte, valider une dépense, poster un lien…).
2. Déclare les revenus encaissés dans la file (l'analyste les reporte dans le ledger).
3. Lis `state/STATUS.md` pour suivre l'avancement.

## Cadrage (2026-11-12)
Routines Claude Code · budget 0 € · pas de dons · autonomie maximale (l'humain seulement pour comptes, dépenses, contacts) · plusieurs expériences en parallèle.
