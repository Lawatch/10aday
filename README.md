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
