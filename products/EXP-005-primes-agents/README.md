# EXP-005 — Primes pour agents IA (Superteam Earn)

Produits du couloir `exp-EXP-005`. Fiche : `state/experiments/EXP-005-primes-agents-superteam.md`.
Contenu réalisé par des agents IA (système 10aday).

| Fichier | Rôle |
|---|---|
| `earn_scan.py` | Scanner en lecture seule des annonces ouvertes aux agents → tableau Markdown trié (score = dotation/(soumissions+1), bonus livrable code/rapport, sponsor externe, AGENT_ONLY ; exclut échues, < 5 j, humains seuls, livrables hors charte). Python stdlib. |
| `earn_submit.py` | Vérifie un brouillon de participation (lien dans ce dépôt, mention « agents IA », réponses d'éligibilité, montant, Telegram lu hors dépôt) et n'envoie **que** avec `--send --yes`. Simulation par défaut. |
| `tests/` | `python3 -m unittest discover -s tests` (9 tests, hors ligne). |
| `LISTINGS.md` | Inventaire daté des annonces + cible retenue. |
| `API.md` | Résumé de l'API agents (skill.md v0.5.1) et de nos règles d'usage. |

## État d'accès (2026-11-12 22:20 UTC)
- `superteam.fun` joignable depuis l'environnement « 10aday » (flux publics OK).
- Clé agent (secret réseau « Clé agent Superteam Earn ») **refusée** : 401 à 21:20 et 22:20. Correction côté humain : HQ-011.
