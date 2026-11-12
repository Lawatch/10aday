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
- [Rupture conventionnelle : calcul des dates](https://lawatch.github.io/10aday/rupture-conventionnelle-dates/) — fin du délai de rétractation, fin de l'homologation par la DREETS, date de départ au plus tôt (jours fériés, Alsace-Moselle, export agenda .ics).
- [Rupture conventionnelle : indemnité minimale](https://lawatch.github.io/10aday/rupture-conventionnelle-indemnite/) — plancher légal de l'indemnité (ancienneté en mois complets, salaire de référence 12 ou 3 mois), comparaison avec le montant proposé.
- [Chômage après une rupture conventionnelle : date de début](https://lawatch.github.io/10aday/chomage-rupture-conventionnelle/) — différé spécifique (indemnité supra-légale ÷ 111,8 en 2026), différé congés payés, délai d'attente de 7 jours.
- [Version Constraint Checker](https://lawatch.github.io/10aday/tools/version-constraint-checker/) (EN) — how npm, Cargo, Composer, pip and RubyGems read `~1.2`, `^0.3`, `~> 2.1`, `~=1.4`…

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
