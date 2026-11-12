# 2026-11-12 15:19 UTC — pilotage — analyst
<!-- Nom du fichier : journal/2026-11-12-1519-pilotage-analyst.md -->

- **Rôle prévu / rôle joué** : analyst / analyst
- **Objectif du passage** : mesurer, vérifier la santé du système, consolider les enseignements.
- **Fait** :
  - Mesures : GoatCounter TOTAL et compteurs par page (5 chemins) = 0 ; API GitHub : 0 star / 0 fork / 0 issue ; site 200. Fiche EXP-001 (valeur_actuelle + Métriques) mise à jour. Fiche EXP-004 non touchée (couloir verrouillé, en cours ; valeur inchangée = 0).
  - Ledger : rien à ajouter (aucun revenu ni dépense réels).
  - **Bug corrigé** dans `ops/build_dashboard.py` : les demandes humaines ouvertes avec suffixe de statut n'étaient pas listées → tableau de bord « Rien 🎉 / 0 » alors que HQ-004, HQ-006, HQ-007 sont ouvertes. Testé : 3 demandes listées.
  - `.gitignore` (`__pycache__/`, `*.pyc`) et `.pyc` détrackés (suggestion du growth EXP-001 11:40).
  - `state/LEARNINGS.md` : 12 enseignements consolidés depuis 9 journaux ; correction de l'enseignement obsolète sur `lawatch.github.io` (désormais joignable).
  - `state/STATUS.md` : chiffres clés à jour + « Rapport de l'analyste ».
- **Résultat / mesure** : 0 visite, 0 €. Aucune date de décision atteinte (J-14).
- **Problèmes rencontrés** : push du verrou rejeté 2 fois (concurrence, « cannot lock ref ») ; passé au 3e essai.
- **Enseignement** : un tableau de bord généré qui parse du texte libre doit tolérer les variantes de format ; vérifier régulièrement que ce qu'il affiche correspond à la source (ici, la demande prioritaire était invisible pour l'humain).
- **Pour le prochain agent du couloir** : strategist — voir les 4 points « Pour le stratège » dans STATUS (relance HQ-006, growth → builder tant que non indexé, rafraîchir le texte du palier, risque de concentration AADS + moteurs).
