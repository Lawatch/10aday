# 2026-11-12 11:00 UTC — pilotage — strategist

- **Rôle prévu / rôle joué** : strategist / strategist
- **Objectif du passage** : appliquer les consignes humaines du jour (pas de vente, encaissement crypto via Kraken, Pages actif) : réévaluer EXP-003, remplir le slot libéré par EXP-002.
- **Fait** :
  - Vérifié en ligne : `https://lawatch.github.io/10aday/` → 200, mais Pages sert la **racine** (README rendu par Jekyll) ; le calculateur est public à `/10aday/docs/rupture-conventionnelle-dates/` (200) → **P0 atteint**. HQ-005 ajoutée (passer Pages sur `/docs`).
  - **EXP-003 tuée** (Stripe Connect obligatoire chez Algora, pas de crypto confirmé ; PR tierces = compte de l'humain). ID-004 suspendue.
  - **EXP-004 créée** (ID-006, trafic-pub) : outils web anglophones + bloc A-ADS payé à une adresse BTC sans compte ; prochain : scout (vérifier A-ADS, choisir l'outil).
  - 3e slot laissé libre ; commande à l'exploration : 2 dossiers d'idées sans vente / sans compte / payables en crypto.
  - `state/ideas.md`, `state/STATUS.md`, `state/HUMAN_QUEUE.md` (3 ouvertes : HQ-005 > HQ-003 > HQ-004) mis à jour.
  - Vérifié : `dispatch.py --hour 13` lance exp-EXP-001 growth, exp-EXP-004 scout, exploration.
- **Résultat / mesure** : P0 ✅ ; 0 € ; 2 expériences actives (EXP-001, EXP-004), 1 en pause, 1 tuée.
- **Problèmes rencontrés** : `10aday.goatcounter.com` répond 400 → le site GoatCounter n'existe pas encore (HQ-003 toujours ouverte). `dispatch.py` modifie `ops/__pycache__` : annulé avant commit.
- **Enseignement** : vérifier en ligne l'URL réelle d'un actif publié — Pages peut servir la racine du dépôt au lieu de `/docs`. Écarter d'emblée les paris dont l'encaissement ou la livraison passe par un compte de l'humain.
- **Pour le prochain agent du couloir** : analyste — vérifier les journaux de exp-EXP-001 / exp-EXP-004 / exploration ; si HQ-005 est faite, prévenir que les URL perdent `/docs/`. Prochain stratège : lancer la 3e expérience à partir des dossiers `research/` de l'exploration.

## Complément 11:05 UTC (réponses de l'humain)
- HQ-005 faite : Pages sert `/docs` (vérifié 200 sur `/10aday/rupture-conventionnelle-dates/`).
- HQ-003 : GoatCounter `10aday` créé ; script ajouté avant `</body>` dans `docs/index.html` et `docs/rupture-conventionnelle-dates/index.html` (tests EXP-001 : 13/13 OK). Tableau de bord encore privé (303 / 403) → étape (b) laissée ouverte.
- Consigne ajoutée dans STATUS : toute nouvelle page `docs/` inclut le script GoatCounter.
