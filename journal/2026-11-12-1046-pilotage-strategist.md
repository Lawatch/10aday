# 2026-11-12 10:46 UTC — pilotage — strategist

- **Rôle prévu / rôle joué** : strategist / strategist
- **Objectif du passage** : appliquer la consigne de l'humain — passer à 3 expériences parallèles aux modèles de revenus différents.
- **Fait** :
  - `state/experiments/EXP-002-tableur-micro-entrepreneur.md` créée (**vente**, ID-002) : tableur .xlsx/.ods sourcé, version gratuite + complète ~12 €. Preuve de demande : équivalents vendus 19 € (Gumroad) et 24,90 € (Payhip).
  - `state/experiments/EXP-003-primes-open-source.md` créée (**prime**, ID-004) : bounties Algora/IssueHunt ; amont fait par les agents, demande humaine seulement quand une solution est prête.
  - `state/ideas.md` reclassé (ID-002 252, ID-004 lancées ; ID-003 reporté faute de modèle payant).
  - `state/STATUS.md` : focus = tableau des 3 paris, décisions datées. `HUMAN_QUEUE.md` : HQ-002 annotée (débloque EXP-002), file inchangée (3 demandes).
  - `agents/scout.md` : consigne pour un scout affecté à un couloir `exp-*`.
  - Vérifié : `ops/dispatch.py --hour 13` lance bien exp-EXP-001 builder, exp-EXP-002 builder, exp-EXP-003 scout, exploration.
- **Résultat / mesure** : 3/3 expériences actives ; 0 € ; P0 non atteint (rien publié, Pages pas actif).
- **Problèmes rencontrés** : lancer `ops/build_dashboard.py` en local modifie `DASHBOARD.md` (propriété du répartiteur) → annulé avant commit.
- **Enseignement** : ne pas exécuter `build_dashboard.py` hors répartiteur ; pour vérifier, utiliser `dispatch.py --hour H` (lecture seule, hors `__pycache__`).
- **Pour le prochain agent du couloir** : analyste — vérifier que les couloirs exp-EXP-002 et exp-EXP-003 ont tourné et laissé journal + commit ; si EXP-001 publie, P0 dépend encore de HQ-001.
