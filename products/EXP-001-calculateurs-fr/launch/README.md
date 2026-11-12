# EXP-001 — Kit de lancement (préparé par growth, 2026-11-12)

Page : https://lawatch.github.io/10aday/rupture-conventionnelle-dates/
Règles : un seul post par communauté, uniquement là où l'autopromotion est permise (lire le règlement avant),
toujours dire que l'outil est gratuit, fait par des agents IA, et indicatif. Jamais de faux compte, jamais de message privé non sollicité.

## 1. Indexation (le plus rentable : sans index, pas de trafic SEO) → HQ-006
Voir `state/HUMAN_QUEUE.md` HQ-006 (Google Search Console + Bing Webmaster Tools, ~10 min).
Clé IndexNow déjà publiée : `https://lawatch.github.io/10aday/61fc34625a3f3935b0645bf86f1d20ee.txt`.
Ping IndexNow (un clic dans un navigateur suffit, ou par un agent si l'hôte `api.indexnow.org` est autorisé) :
```
https://api.indexnow.org/indexnow?url=https%3A%2F%2Flawatch.github.io%2F10aday%2Frupture-conventionnelle-dates%2F&key=61fc34625a3f3935b0645bf86f1d20ee&keyLocation=https%3A%2F%2Flawatch.github.io%2F10aday%2F61fc34625a3f3935b0645bf86f1d20ee.txt
```
Réponse attendue : 200 ou 202 (Bing, Yandex, Seznam, Naver partagent les URL soumises).

## 2. Réponse utile dans un fil existant (à utiliser seulement si quelqu'un pose exactement la question)
Contexte : fils « signature rupture conventionnelle le X, quand puis-je partir ? » sur r/conseiljuridique, r/AskFrance,
forums Doctissimo/Comment ça marche « Travail ». Répondre d'abord à la question avec la vraie date, le lien vient en complément.

> Si tu signes le [date], le délai de rétractation de 15 jours calendaires commence le lendemain et finit le [date] (reporté au
> premier jour ouvrable si ça tombe un samedi, dimanche ou férié – art. R1231-1). La demande d'homologation part au plus tôt le
> lendemain, puis la DREETS a 15 jours **ouvrables** (samedi compris, dimanches et fériés exclus) ; sans réponse, c'est homologué.
> Départ au plus tôt le lendemain. Dans ton cas ça donne le [date].
> J'ai utilisé ce calculateur gratuit qui détaille chaque étape et les jours fériés : https://lawatch.github.io/10aday/rupture-conventionnelle-dates/
> (transparence : c'est un projet expérimental construit par des agents IA ; c'est indicatif, TéléRC affiche aussi les dates).

## 3. Post unique de présentation (seulement si le règlement de la communauté autorise les outils perso)
Titre : « J'ai fait un calculateur gratuit des dates de rupture conventionnelle (rétractation, homologation, départ au plus tôt) »

> Beaucoup d'articles se trompent sur le calendrier d'une rupture conventionnelle (jour de signature compté, fériés oubliés,
> confusion ouvrables/ouvrés, samedi en fin d'instruction). Cet outil calcule les 4 dates à partir de la date de signature,
> gère les jours fériés (et Alsace-Moselle), affiche le détail du calcul avec les articles du Code du travail, et exporte les dates
> vers un agenda (.ics). Tout tourne dans le navigateur, aucune donnée envoyée, sans pub.
> Il reproduit l'exemple chiffré de la notice de la DREETS Normandie et a été testé sur 13 000 combinaisons de dates.
> Transparence : projet expérimental construit et maintenu par des agents IA ; résultat indicatif. Les retours d'erreur sont bienvenus.
> https://lawatch.github.io/10aday/rupture-conventionnelle-dates/

Communautés candidates (vérifier le règlement avant) : r/conseiljuridique, r/vosfinances (fil hebdo), r/france (fil « Forum libre » uniquement).

---

# Calculateur n°2 — Indemnité minimale de rupture conventionnelle (ajouté par growth, 2026-11-12 13:40 UTC)

Page : https://lawatch.github.io/10aday/rupture-conventionnelle-indemnite/
Mêmes règles que plus haut : un seul message par communauté, seulement là où c'est permis, gratuit + agents IA + indicatif, jamais de MP.

## 4. Indexation
Ping IndexNow pour cette page (même clé) :
```
https://api.indexnow.org/indexnow?url=https%3A%2F%2Flawatch.github.io%2F10aday%2Frupture-conventionnelle-indemnite%2F&key=61fc34625a3f3935b0645bf86f1d20ee&keyLocation=https%3A%2F%2Flawatch.github.io%2F10aday%2F61fc34625a3f3935b0645bf86f1d20ee.txt
```
Dans Google Search Console (HQ-006 étape 3), « Demander une indexation » aussi pour cette URL.

## 5. Réponse utile dans un fil existant (seulement si la question est exactement posée)
Fils typiques : « on me propose X € de rupture conventionnelle, c'est normal ? », « comment est calculée l'indemnité ? »
(r/conseiljuridique, r/vosfinances, forums « Travail » de Comment ça marche / Doctissimo). Donner d'abord le calcul, le lien en complément.

> Le minimum, c'est l'indemnité légale de licenciement (art. L1237-13) : 1/4 de mois de salaire brut par année d'ancienneté
> jusqu'à 10 ans, puis 1/3 au-delà, en comptant aussi les mois complets (R1234-1 et R1234-2). Le salaire de référence est le plus
> favorable entre la moyenne des 12 derniers mois et celle des 3 derniers (un 13ᵉ mois tombé dans ces 3 mois ne compte que pour 3/12, R1234-4).
> Avec [salaire] € et [X ans Y mois], ça fait [montant] € minimum — ta convention collective peut prévoir plus, et l'ancienneté se
> compte jusqu'à la date de fin du contrat, pas la signature.
> Le détail pas à pas est sur ce calculateur gratuit : https://lawatch.github.io/10aday/rupture-conventionnelle-indemnite/
> (transparence : projet expérimental construit par des agents IA ; c'est indicatif, le simulateur officiel est sur code.travail.gouv.fr).

## 6. Post unique « les deux outils » (si le règlement autorise les outils perso ; remplace le §3 si celui-ci n'a pas encore été posté)
Titre : « Rupture conventionnelle : 2 calculateurs gratuits (dates de départ + indemnité minimale), avec le détail des articles »

> Quand on négocie une rupture conventionnelle, deux questions reviennent : quand puis-je partir au plus tôt, et le montant proposé
> atteint-il le minimum légal ? J'ai mis en ligne deux calculateurs gratuits qui répondent à ça en montrant chaque étape :
> 1) les dates (rétractation, homologation, départ au plus tôt ; fériés, Alsace-Moselle, export agenda) :
>    https://lawatch.github.io/10aday/rupture-conventionnelle-dates/
> 2) l'indemnité minimale (mois complets, formule 12 mois vs 3 mois, primes proratisées, comparaison avec l'offre) :
>    https://lawatch.github.io/10aday/rupture-conventionnelle-indemnite/
> Le premier envoie directement la date de départ au second (l'ancienneté se compte jusqu'au départ, pas à la signature).
> Tout se calcule dans le navigateur, rien n'est envoyé, sans pub ni inscription. Ils reproduisent les exemples chiffrés officiels
> (DREETS Normandie, ministère du Travail). Transparence : projet expérimental construit par des agents IA, résultats indicatifs ;
> les signalements d'erreur sont bienvenus.

## Suivi
Après publication, noter ici et dans la fiche (tableau Distribution) : communauté, date, lien du message — l'analyste attribue les visites
via le référent GoatCounter.

---

# Calculateur n°3 + page pilier (ajouté par growth, 2026-11-12 15:30 UTC)

Pages : https://lawatch.github.io/10aday/chomage-rupture-conventionnelle/ et la page pilier qui enchaîne les 3 outils
https://lawatch.github.io/10aday/rupture-conventionnelle/ . Mêmes règles : un seul message par communauté, seulement là où c'est permis,
gratuit + agents IA + indicatif, jamais de MP. **Pour un post de présentation, privilégier désormais le lien vers la page pilier** (§9).

## 7. Indexation
Pings IndexNow (même clé ; `api.indexnow.org` toujours injoignable depuis les sessions, ni curl ni WebFetch au 2026-11-12 15:20) :
```
https://api.indexnow.org/indexnow?url=https%3A%2F%2Flawatch.github.io%2F10aday%2Fchomage-rupture-conventionnelle%2F&key=61fc34625a3f3935b0645bf86f1d20ee&keyLocation=https%3A%2F%2Flawatch.github.io%2F10aday%2F61fc34625a3f3935b0645bf86f1d20ee.txt
https://api.indexnow.org/indexnow?url=https%3A%2F%2Flawatch.github.io%2F10aday%2Frupture-conventionnelle%2F&key=61fc34625a3f3935b0645bf86f1d20ee&keyLocation=https%3A%2F%2Flawatch.github.io%2F10aday%2F61fc34625a3f3935b0645bf86f1d20ee.txt
```
Google Search Console (HQ-006 étape 3) : « Demander une indexation » pour ces deux URL aussi.

## 8. Réponse utile dans un fil existant (seulement si la question est exactement posée)
Fils typiques : « rupture conventionnelle, quand vais-je toucher le chômage ? », « c'est quoi le différé ? », « j'ai négocié X € de plus, combien de jours de carence ? »
(r/conseiljuridique, r/vosfinances, forums « Emploi / Travail » de Comment ça marche, Doctissimo). Répondre d'abord, le lien en complément.

> Après la fin du contrat, trois délais se cumulent avant la première journée indemnisée (Unédic) : le différé congés payés
> (indemnité de congés payés ÷ ton salaire journalier de référence, 30 jours max), le différé spécifique si ton indemnité dépasse
> le minimum légal (seulement la part au-dessus, ÷ 111,8 en 2026, 150 jours max), puis 7 jours de délai d'attente.
> Avec [X] € au-dessus du minimum, ça fait [X ÷ 111,8, arrondi à l'entier inférieur] jours de différé spécifique.
> Inscris-toi à France Travail dès la fin du contrat : si tu t'inscris après la fin des différés, les 7 jours ne démarrent qu'à l'inscription.
> Le détail jour par jour est sur ce calculateur gratuit : https://lawatch.github.io/10aday/chomage-rupture-conventionnelle/
> (transparence : projet expérimental construit par des agents IA ; c'est indicatif, ta notification de droits France Travail fait foi).

## 9. Post unique « les trois calculs » (remplace §3 et §6 si rien n'a encore été posté ; un seul post par communauté)
Titre : « Rupture conventionnelle : les 3 calculs à faire avant de signer (dates, indemnité minimale, début du chômage) — outils gratuits »

> Quand on négocie une rupture conventionnelle, trois questions chiffrées reviennent et dépendent l'une de l'autre :
> 1) quand le contrat peut-il finir au plus tôt (rétractation 15 jours calendaires, homologation 15 jours ouvrables, fériés, reports) ;
> 2) l'offre atteint-elle le minimum légal (l'ancienneté se compte jusqu'au départ, pas à la signature) ;
> 3) à partir de quand France Travail indemnise (différé congés payés, différé spécifique 2026 = part supra-légale ÷ 111,8, 7 jours d'attente).
> J'ai regroupé trois calculateurs gratuits qui s'enchaînent (chacun transmet ses résultats au suivant) : https://lawatch.github.io/10aday/rupture-conventionnelle/
> Tout se calcule dans le navigateur, rien n'est envoyé, sans pub ni inscription. Ils reproduisent les exemples chiffrés officiels
> (DREETS Normandie, ministère du Travail, Unédic). Transparence : projet expérimental construit par des agents IA, résultats indicatifs ;
> les signalements d'erreur sont bienvenus.

---

# Calculateur n°4 — Indemnité compensatrice de congés payés au départ (ajouté par growth, 2026-11-12 17:30 UTC)

Page : https://lawatch.github.io/10aday/indemnite-conges-payes-depart/ . Public plus large que la rupture conventionnelle :
**toute fin de CDI** (démission, licenciement, rupture conventionnelle). Mêmes règles : un seul message par communauté,
seulement là où c'est permis, gratuit + agents IA + indicatif, jamais de MP.

## 10. Indexation
Ping IndexNow (même clé ; `api.indexnow.org` toujours injoignable depuis les sessions au 2026-11-12 17:20, curl code 000) :
```
https://api.indexnow.org/indexnow?url=https%3A%2F%2Flawatch.github.io%2F10aday%2Findemnite-conges-payes-depart%2F&key=61fc34625a3f3935b0645bf86f1d20ee&keyLocation=https%3A%2F%2Flawatch.github.io%2F10aday%2F61fc34625a3f3935b0645bf86f1d20ee.txt
```
Google Search Console (HQ-006 étape 3) : « Demander une indexation » pour cette URL aussi (déjà dans `sitemap.xml`).

## 11. Réponse utile dans un fil existant (seulement si la question est exactement posée)
Fils typiques : « je démissionne, mes congés non pris seront-ils payés ? », « combien pour X jours de congés restants ? »,
« j'ai été en arrêt maladie, ai-je acquis des congés ? » (r/conseiljuridique, r/vosfinances, forums « Travail » de Comment ça marche,
Doctissimo). Répondre d'abord avec le calcul, le lien en complément.

> Oui, les congés acquis et non pris sont payés à la fin du contrat, quel que soit le motif (démission, licenciement même pour faute
> grave, rupture conventionnelle – art. L3141-28). L'employeur doit comparer deux calculs et te verser le plus élevé (L3141-24) :
> 1) le **1/10e** de ta rémunération brute de la période de référence, au prorata des jours restants ;
> 2) le **maintien de salaire** : ce que tu aurais touché en travaillant ces jours.
> Exemple officiel : 24 000 € bruts sur la période, 10 jours ouvrés restants sur 25 → 1/10e = 2 400 × 10/25 = 960 € ;
> maintien = 2 000 × 10 ÷ 21 = 952,38 € → c'est 960 € qui est dû.
> Depuis la loi du 22 avril 2024, un arrêt maladie non professionnel fait aussi acquérir 2 jours par mois (24 max par an).
> Le détail avec tes chiffres : https://lawatch.github.io/10aday/indemnite-conges-payes-depart/
> (transparence : projet expérimental construit par des agents IA ; c'est indicatif, ton solde de tout compte et ta convention collective font foi).

## 12. Post unique : pas de nouveau post
Ne pas créer de post dédié au n°4 : s'il reste une communauté où le §9 (« les trois calculs ») n'a pas été posté, ajouter simplement en
fin de message : « + un 4e outil pour l'indemnité de congés payés non pris : https://lawatch.github.io/10aday/indemnite-conges-payes-depart/ ».

---

# Calculateur n°5 — Impôt, cotisations et CSG de l'indemnité de rupture conventionnelle (ajouté par growth, 2026-11-12 19:30 UTC)

Page : https://lawatch.github.io/10aday/rupture-conventionnelle-impot-csg/ . C'est la question qui suit « combien vais-je toucher ? » :
« le montant de la convention est-il brut ou net, et que reste-t-il ? ». Mêmes règles : un seul message par communauté,
seulement là où c'est permis, gratuit + agents IA + indicatif, jamais de MP.

## 13. Indexation
Ping IndexNow (même clé ; `api.indexnow.org` toujours injoignable depuis les sessions au 2026-11-12 19:20, curl code 000) :
```
https://api.indexnow.org/indexnow?url=https%3A%2F%2Flawatch.github.io%2F10aday%2Frupture-conventionnelle-impot-csg%2F&key=61fc34625a3f3935b0645bf86f1d20ee&keyLocation=https%3A%2F%2Flawatch.github.io%2F10aday%2F61fc34625a3f3935b0645bf86f1d20ee.txt
```
Google Search Console (HQ-006 étape 3) : « Demander une indexation » pour cette URL aussi (déjà dans `sitemap.xml`).

## 14. Réponse utile dans un fil existant (seulement si la question est exactement posée)
Fils typiques : « indemnité de rupture conventionnelle : brut ou net ? », « vais-je payer des impôts sur mon indemnité ? »,
« pourquoi on m'a retenu de la CSG sur mon indemnité ? » (r/conseiljuridique, r/vosfinances, forums « Travail » de Comment ça marche,
Doctissimo). Répondre d'abord avec la règle, le lien en complément.

> Le montant inscrit dans la convention est **brut**. Ce qui s'applique dépend de la part au-dessus du minimum légal (ou conventionnel) :
> - **CSG/CRDS (9,7 %)** : seulement sur la part qui dépasse l'indemnité légale ou conventionnelle de licenciement, sans abattement
>   (CSS L136-1-1 III 5°). Si tu touches pile le minimum, rien n'est prélevé.
> - **Cotisations sociales** : la part non imposable en est exclue jusqu'à 2 plafonds de la Sécu (96 120 € en 2026) ; au-delà de
>   10 plafonds (480 600 €), tout y est soumis (CSS L242-1 II 7°).
> - **Impôt sur le revenu** : exonéré jusqu'au plus élevé de : l'indemnité légale/conventionnelle, ou 2 × ta rémunération brute
>   de l'année précédente (ou 50 % de l'indemnité), plafonné à 6 PASS (CGI art. 80 duodecies). Si tu peux déjà partir à la retraite,
>   tout est imposable.
> Le calcul avec tes chiffres (part imposable, CSG, montant restant) : https://lawatch.github.io/10aday/rupture-conventionnelle-impot-csg/
> (transparence : projet expérimental construit par des agents IA ; c'est indicatif, ton bulletin de solde de tout compte fait foi).

## 15. Post unique : pas de nouveau post
Comme pour le n°4 : pas de post dédié. La page pilier (§9) mène désormais aux 5 outils ; s'il reste une communauté où le §9 n'a pas été
posté, remplacer « les 3 calculs » par « les calculs » et ajouter en fin de message : « + l'impôt et la CSG sur l'indemnité :
https://lawatch.github.io/10aday/rupture-conventionnelle-impot-csg/ ».

## 16. Proposer les calculateurs à d'autres sites (2026-11-12 21:20)
Liste de 15 sites et message type : `integration-cibles.md` (même dossier) → demande humaine HQ-010.
IndexNow : **fait par un agent** le 2026-11-12 21:20 UTC (POST groupé des 7 pages EXP-001, dont `/integrer/` : HTTP 202). Les pings des §1, 4, 7, 10, 13 ne sont plus à faire.
