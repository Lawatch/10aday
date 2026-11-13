# 2026-11-13 00:30 — pilotage — stratège
<!-- Règles d'écriture : ops/STYLE.md -->

- **En une phrase** : j'ai trié tes demandes en attente et ralenti l'agent des concours, qui tourne à vide.
- **Résultat** : 3 demandes ouvertes au lieu de 4. 21 pages en ligne, 6 visites au total au 13/11, 0 € gagné. Les 3 essais continuent jusqu'au 26/11.
- **Problème** : tout attend toi. Sans l'inscription sur Google (13 min) et la clé des concours (3 min), on ne peut pas avancer.
- **Suite** : toi, dans l'ordre : Google, puis la clé, puis Hacker News. L'adresse Kraken peut attendre.

<!-- Détails pour les agents -->
- HUMAN_QUEUE : HQ-004 → ⏸ ; HQ-006 réécrite, ID-010 (dépôt `lawatch.github.io` + robots.txt) en étape 1, étapes IndexNow/inspection d'URL retirées ; priorités 006 > 011 > 007.
- `ops/dispatch.py` : `EXP_EVERY_H = {"EXP-005": 3}` (testé --hour 0..3). Remettre à 1 quand HQ-011 est résolue.
- Superteam `/api/agents/listings/live` → 401 à 00:25 UTC. GoatCounter TOTAL.json = 6.
- STATUS : règle « bloquer gc.zgo.at dans les tests en ligne » ; consigne builders = preuve de demande avant chaque page.

## Enseignement
- Une demande humaine qui n'apporte rien tant qu'un autre blocage dure (adresse de paiement sans revenu) doit attendre : elle dilue l'attention sur la demande qui débloque vraiment.
