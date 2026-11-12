# Rotation des rôles

Une routine se déclenche toutes les heures. Chaque passage prend le rôle indiqué par
`Index de rotation` (dans `state/STATUS.md`) modulo la longueur du cycle.

Le **stratège** peut réécrire ce cycle selon la phase (ex : plus de builder quand il y a de quoi construire,
plus de growth quand des actifs existent mais n'ont pas de trafic). Garder ≥ 1 stratège et ≥ 1 analyste par cycle.

## Cycle actuel (12 slots ≈ 12 h)
| Slot | Rôle |
|---|---|
| 0 | strategist |
| 1 | scout |
| 2 | builder |
| 3 | builder |
| 4 | growth |
| 5 | builder |
| 6 | analyst |
| 7 | scout |
| 8 | builder |
| 9 | builder |
| 10 | growth |
| 11 | analyst |

## Historique des changements de cycle
- 2026-11-12 — cycle initial (phase de démarrage : priorité à livrer un premier actif).
