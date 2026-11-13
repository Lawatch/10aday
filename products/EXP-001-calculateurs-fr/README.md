# EXP-001 — Calculateurs administratifs FR

| Calculateur | Page publiée | Logique | Tests |
|---|---|---|---|
| Calendrier de la rupture conventionnelle | `docs/rupture-conventionnelle-dates/` | `src/rc-dates.js` (copié tel quel dans la page) | `node test/rc-dates.test.js` |
| Indemnité minimale de rupture conventionnelle | `docs/rupture-conventionnelle-indemnite/` | `src/rc-indemnite.js` (copié tel quel) | `node test/rc-indemnite.test.js` |
| Indemnité compensatrice de congés payés au départ | `docs/indemnite-conges-payes-depart/` | `src/iccp.js` (copié tel quel) | `node test/iccp.test.js` |
| Impôt, cotisations et CSG de l'indemnité de RC | `docs/rupture-conventionnelle-impot-csg/` | `src/rc-fiscal.js` (copié tel quel) | `node test/rc-fiscal.test.js` |
| Date de début du chômage après RC (différés + délai d'attente) | `docs/chomage-rupture-conventionnelle/` | `src/chomage-differe.js` (copié tel quel) | `node test/chomage-differe.test.js` |
| Délais pour contester (RC 12 mois, solde de tout compte 6 mois, salaires 3 ans, exécution 2 ans, discrimination/harcèlement 5 ans) | `docs/delais-contestation-rupture/` | `src/delais-contestation.js` (copié tel quel) | `node test/delais-contestation.test.js` |

- `reference/rc_dates.py` : oracle Python ; le test JS le compare sur 13 150 combinaisons de dates (nécessite `python3`).
- Après toute modification de `src/rc-dates.js` : `cp src/rc-dates.js ../../docs/rupture-conventionnelle-dates/rc-dates.js` (le test vérifie l'identité).
- Après toute modification de `src/rc-indemnite.js` : `cp src/rc-indemnite.js ../../docs/rupture-conventionnelle-indemnite/rc-indemnite.js`.
- Après toute modification de `src/chomage-differe.js` : `cp src/chomage-differe.js ../../docs/chomage-rupture-conventionnelle/chomage-differe.js`. **Diviseur du différé spécifique à mettre à jour chaque janvier** (`DIVISEURS`, circulaire Unédic).
- Après toute modification de `src/delais-contestation.js` : `cp src/delais-contestation.js ../../docs/delais-contestation-rupture/delais-contestation.js`. Pas de constante annuelle ; revérifier les articles L1237-14, L1234-20, L3245-1, L1471-1, L1134-5 en cas de réforme.
- Après toute modification de `src/iccp.js` : `cp src/iccp.js ../../docs/indemnite-conges-payes-depart/iccp.js`.

- Après toute modification de `src/rc-fiscal.js` : `cp src/rc-fiscal.js ../../docs/rupture-conventionnelle-impot-csg/rc-fiscal.js`. **PASS à ajouter chaque janvier** (`PASS`, arrêté annuel), et vérifier les versions de CGI 80 duodecies, CSS L242-1 et L136-1-1 (lois de finances / LFSS).

## Version « à intégrer » (iframe sur d'autres sites) — 2026-11-12
- Page publique : `docs/integrer/` (code `<iframe>` à copier pour les 5 calculateurs, aperçu, FAQ).
- `docs/integrer/integre.js` est chargé dans le `<head>` de chaque calculateur. Il ne fait rien sans `?integre=1`. Avec : n'affiche que titre, formulaire, résultat, avertissement + lien de crédit ; liens en nouvel onglet ; `noindex` ; envoie sa hauteur au parent.
- `docs/integrer/hote.js` (facultatif, côté site hôte) : ajuste la hauteur des `<iframe data-10aday>` (n'accepte que l'origine `https://lawatch.github.io`).
- Mesure : GoatCounter compte ces vues sous `<chemin de la page>integre/` (`allow_frame`), le référent est le site hôte. Compteur : `https://10aday.goatcounter.com/counter/<chemin encodé>integre%2F.json`.
- Test : `node test/integre.playwright.js` (sert `docs/` à la place du site publié, bloque GoatCounter, simule un site hôte avec les 5 codes copiés).
- Tout nouveau calculateur : ajouter la balise `<script src="../integrer/integre.js"></script>` après le `canonical`, un bloc dans `docs/integrer/index.html`, et le lien en pied de page.
