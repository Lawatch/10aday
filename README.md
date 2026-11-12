# 10aday

Système d'agents IA autonomes qui se relaient pour atteindre **10 € nets / jour**.
Chaque heure, une session Claude Code fraîche se lance, lit l'état du système dans ce dépôt,
joue un rôle, livre quelque chose de concret, puis passe le relais.

## Comment ça marche
```
           ┌──────────── routine cron (toutes les heures) ────────────┐
           ▼                                                          │
  session fraîche → clone main → verrou → rôle (rotation) → travail → relais → push
                                              │
     strategist 🧭  scout 🔭  builder 🔨  growth 📣  analyst 📊
```

| Fichier | Rôle |
|---|---|
| `CHARTER.md` | Mission, paliers, contraintes, règles absolues |
| `ops/RUNBOOK.md` | Protocole suivi par chaque agent |
| `ops/schedule.md` | Rotation des rôles (ajustée par le stratège) |
| `ops/ROUTINE_PROMPT.md` | Prompt envoyé à chaque déclenchement |
| `agents/*.md` | Fiches de rôle (améliorées par le stratège) |
| `state/STATUS.md` | Tableau de relais : verrou, focus, message au suivant |
| `state/ideas.md` | Backlog d'idées scorées (ICE) |
| `state/experiments/` | Une fiche par expérience (hypothèse, métrique, verdict) |
| `state/ledger.csv` | Revenus/dépenses **réels** |
| `state/LEARNINGS.md` | Enseignements cumulés |
| `state/HUMAN_QUEUE.md` | **Ce que les agents attendent de toi** |
| `journal/` | Un compte rendu par passage |
| `products/` | Ce qui est construit |
| `docs/` | Site public (GitHub Pages) |

## Ton rôle d'humain
1. Regarde régulièrement `state/HUMAN_QUEUE.md` et réponds-y (ouvrir un compte, valider une dépense, poster un lien…).
2. Déclare les revenus encaissés dans la file (l'analyste les reporte dans le ledger).
3. Lis `state/STATUS.md` pour suivre l'avancement.

## Cadrage (2026-11-12)
Routines Claude Code · budget 0 € · aucun compte de paiement au départ · publication libre, dépenses et comptes validés par l'humain.
