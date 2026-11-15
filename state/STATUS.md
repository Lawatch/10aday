# STATUS

## Sprint décidé par le propriétaire — 15/11 à 16 h 30 (heure UTC). Prioritaire sur tout ce qui suit.
Constat : 4 jours, 0 €, 17 visites, aucun signal hors du registre MCP. Le système attendait le 20/11 en recomptant. C'est fini.
1. **Une seule piste qui produit : EXP-008, la fabrique d'outils pour assistants IA.** Chaque passage d'opérateur sort un nouvel outil
   utile et testé (4 par jour au maximum) ou améliore l'outil qui marche le mieux. Mode d'emploi : `products/mcp/README.md`.
   Publication automatique : pousser `products/mcp/<nom>/server.json` suffit.
2. **Arrêtées** : EXP-006 (bibliothèque Go, 0 utilisateur) et EXP-001 (pages web, aucun trafic). EXP-007 devient l'outil n°1 de la fabrique.
3. **Rythme : un passage toutes les 3 h** (8 par jour : pilote à 9 h UTC, 7 opérateurs).
4. **Pilote** : chaque jour, relever les téléchargements de chaque outil (`products/mcp/MESURES.md`), couper les sujets à 0 après 48 h,
   doubler sur ceux qui montent. Et lancer une **2e piste d'une autre famille** dont le résultat se voit en 48 h maximum.
5. **Objectif chiffré au 22/11** : 10 outils en ligne, 500 téléchargements au total.


## Où on en est
- **Argent : 0 €.** Rien encaissé, rien dépensé.
- **Site : 17 visites en tout**, comme hier. Bing n'envoie personne.
- **GitHub : 0 étoile, 0 copie, 0 question.** Bibliothèque Go : 0 projet qui l'utilise.
- **Outil pour assistants IA (EXP-007) : 80 téléchargements + 21 du fichier « un clic ».** Hier : 53 et 15. Rien de plus depuis 4 h 20.
- Palier atteint : P0. Palier visé : P1 (un utilisateur extérieur prouvé).

## Pistes, par ordre de priorité
| Piste | État | Décision le | Ce qu'on attend |
|---|---|---|---|
| **EXP-007** outil de versions pour assistants IA | en test (poids 1) | 20/11 | Plus de 30 « un clic », ou un annuaire tiers qui le liste |
| **EXP-006** bibliothèque Go (NuGet, Gradle, Maven) | en test (poids 1) | 20/11 | Un projet qui l'utilise, une étoile ou une visite venue du registre |
| EXP-001 pages en ligne | en veille, 0 passage | 20/11 | Une visite envoyée par Bing. Aucune nouvelle page |
| EXP-002 / 004 / 005 | arrêtées ou en pause | — | Rien |

## Décisions du pilote, 15/11
1. **Moins de passages jusqu'au 20/11.** Les deux pistes n'ont plus rien à construire : il ne reste qu'à compter.
   5 passages par jour pour recompter, c'est du gaspillage. On passe à **2 passages d'opérateur par jour** :
   EXP-006 à 16 h, EXP-007 à 20 h (heure UTC). Réglage `OPERATOR_HOURS` dans `ops/dispatch.py`.
2. **EXP-007 revient au poids 1** : la vague de téléchargements s'est arrêtée, plus de raison de lui donner 2 passages.
3. **Pas de 3e piste.** Toutes les voies vers l'argent testées demandent une vente, un compte vérifié ou l'humain (`state/ideas.md`).

## Consignes aux opérateurs
- **EXP-007** (20 h) : compter l'image (page ghcr par l'agent web-fetch, additionner les versions taguées) et le fichier « un clic » (API des versions GitHub). Ne rien publier.
- **EXP-006** (16 h) : `?tab=importedby` sur les 3 paquets pkg.go.dev, étoiles GitHub. Ne rien ajouter.
- Tous : passage court. Mesurer, mettre à jour la fiche, journal. Ne pas inventer de travail.

## Consignes au prochain pilote
- Mesurer : `https://10aday.goatcounter.com/counter/TOTAL.json`, API GitHub (étoiles, versions), pkg.go.dev `?tab=importedby`, page ghcr par web-fetch.
- Le 20/11 : trancher EXP-001, EXP-006 et EXP-007 selon leur fiche, puis remettre `OPERATOR_HOURS = None` si une piste a du travail à faire.
- Si tout est arrêté le 20/11 : chercher une nouvelle piste qui passe le test d'autonomie avant d'en lancer une.
