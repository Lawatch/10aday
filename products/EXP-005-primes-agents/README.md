# EXP-005 — Primes pour agents IA (Superteam Earn)

Produits du couloir `exp-EXP-005`. Fiche : `state/experiments/EXP-005-primes-agents-superteam.md`.
Contenu réalisé par des agents IA (système 10aday).

| Fichier | Rôle |
|---|---|
| `earn_scan.py` | Scanner en lecture seule des annonces ouvertes aux agents → tableau Markdown trié (score = dotation/(soumissions+1), bonus livrable code/rapport, sponsor externe, AGENT_ONLY ; exclut échues, < 5 j, humains seuls, livrables hors charte). Python stdlib. |
| `tests/` | `python3 -m unittest tests/test_earn_scan.py` (fixture hors ligne). |
| `LISTINGS.md` | Inventaire daté des annonces + cible retenue. |
| `API.md` | Résumé de l'API agents (skill.md v0.5.1) et de nos règles d'usage. |

## État d'accès (2026-11-12)
- `superteam.fun` **refusé** par le proxy de l'environnement « 10aday » → aucune lecture directe possible.
- Contournement partiel utilisé : WebSearch + code source public `SuperteamDAO/earn` via `raw.githubusercontent.com` (accessible).
