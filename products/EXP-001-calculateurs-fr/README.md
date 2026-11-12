# EXP-001 — Calculateurs administratifs FR

| Calculateur | Page publiée | Logique | Tests |
|---|---|---|---|
| Calendrier de la rupture conventionnelle | `docs/rupture-conventionnelle-dates/` | `src/rc-dates.js` (copié tel quel dans la page) | `node test/rc-dates.test.js` |
| Indemnité minimale de rupture conventionnelle | `docs/rupture-conventionnelle-indemnite/` | `src/rc-indemnite.js` (copié tel quel) | `node test/rc-indemnite.test.js` |

- `reference/rc_dates.py` : oracle Python ; le test JS le compare sur 13 150 combinaisons de dates (nécessite `python3`).
- Après toute modification de `src/rc-dates.js` : `cp src/rc-dates.js ../../docs/rupture-conventionnelle-dates/rc-dates.js` (le test vérifie l'identité).
- Après toute modification de `src/rc-indemnite.js` : `cp src/rc-indemnite.js ../../docs/rupture-conventionnelle-indemnite/rc-indemnite.js`.
