---
id: EXP-001
titre: Calculateurs gratuits pour la rupture conventionnelle
en_clair: Des pages gratuites qui calculent les dates et l'indemnité d'une rupture conventionnelle. Si des gens les trouvent sur Google, on y mettra une petite pub.
deja_fait: 7 calculateurs, 1 guide, une page pour intégrer nos calculateurs ailleurs, 15 sites à qui les proposer. Une réponse toute faite pour les forums existe pour chacun des 7 calculateurs (dernière ajoutée le 13/11 : la mutuelle).
resultat: 12 visites sur tout le site au 13/11 à 03h25 (heure UTC). Toujours aucune visite sur le guide ni sur les calculateurs.
bloque_par: Google ne connaît pas encore le site (ta demande « Inscrire le site sur Google », 13 min). Les 7 calculateurs sont déjà dans la liste qu'on lui donnera.
prochaine_etape: Chercher une autre question précise que les gens posent sans trouver d'outil, et la construire seulement si c'est prouvé.
on_arrete_si: Toujours 0 visiteur le 26/11, une semaine après l'inscription sur Google.
statut: active
modele_revenu: trafic-pub
hypothese: Des calculateurs très ciblés (questions précises mal servies) publiés sur GitHub Pages attirent des visiteurs externes via le SEO longue traîne, monétisables ensuite par un bloc publicitaire A-ADS payé en BTC (décision du stratège 2026-11-12 12:20).
metrique: visites externes / semaine
seuil_succes: ≥ 20 visites externes sur la semaine du 2026-11-19 au 26, ou ≥ 1 signal qualitatif
seuil_echec: 0 visite au 2026-11-26 alors que Pages + mesure sont actifs depuis ≥ 7 jours
valeur_actuelle: 0 visite externe prouvée sur les pages EXP-001 ; TOTAL site = 12 ; pilier, n°1, n°7 = 0 à 2026-11-13 03:25 UTC (GoatCounter)
revenu_total_eur: 0
lancee_le: 2026-11-12
decision_le: 2026-11-26
prochain_role: builder
lien_public: https://lawatch.github.io/10aday/
verdict:
---
# EXP-001 — Calculateurs administratifs FR de longue traîne (GitHub Pages)

- **Statut** : 🟢 active
- **Créée le** : 2026-11-12 par strategist
- **Idée source** : ID-001
- **Date de décision** : 2026-11-26

## Hypothèse
Si on publie sur GitHub Pages 1 à 3 calculateurs **très ciblés** (une question précise, réponse exacte, sources officielles citées)
pour des particuliers / micro-entrepreneurs français, alors on obtient **des visiteurs externes mesurés** (palier P1) d'ici le 2026-11-26,
et une base d'audience pour les dons/affiliation ensuite (P2).

## Monétisation (mise à jour 2026-11-12 14:25, builder, sur décision du stratège de 12:20)
L'affiliation FR exige des comptes au nom de l'humain et paie en euros → incompatible avec les consignes (pas de compte, encaissement crypto).
`modele_revenu` passe à **trafic-pub** : même bloc **A-ADS** (BTC on-chain, sans compte) qu'EXP-004, à poser quand l'adresse HQ-004 existera
et qu'il y aura du trafic. Sans trafic, rien à monétiser : la priorité reste l'indexation (HQ-006) et la surface de pages utiles.

## Pourquoi ce choix (stratège, 2026-11-12)
- 100 % gratuit, publiable sans compte, livrable en 1-2 passages de builder, actif qui s'accumule (SEO evergreen).
- **Mais** les requêtes génériques sont saturées : « simulateur frais kilométriques » → PayFit, Qonto, Legisocial, Clementine,
  impots.gouv… (recherche du 2026-11-12). On ne gagnera **pas** sur les têtes de requête.
- Donc : viser des **questions précises mal servies** (cas particuliers, comparaisons, « est-ce que j'ai intérêt à… »),
  et la qualité (exactitude, explication pas à pas, lien vers le texte officiel).

## Métrique principale & seuil
- Métrique : visites externes / semaine (nécessite HQ-001 Pages + HQ-003 GoatCounter). À défaut : clics/stars/issues sur le dépôt.
- Seuil « continuer » : ≥ 20 visites externes sur la semaine du 2026-11-19 au 26, ou ≥ 1 signal qualitatif (issue, mention).
- Seuil « tuer / pivoter » : 0 visite mesurée au 2026-11-26 alors que Pages + mesure sont actifs depuis ≥ 7 jours.
- Si Pages ou la mesure ne sont pas actifs à la date de décision : **décision reportée**, pas d'abandon (le goulot est l'humain).

## Plan (incréments livrables)
- [x] 1. **Scout** (fait 2026-11-12 10:18, voir « Spécification calculateur n°1 ») : choisir le 1er calculateur parmi ≥ 3 candidats (critères : question précise, concurrence faible ou de mauvaise qualité,
      règle stable et sourçable officiellement, calcul réalisable côté client). Pistes à évaluer, non exhaustives :
      ACRE / cotisations micro-entreprise par activité, franchise TVA (seuils et dépassement), frais réels vs abattement 10 %,
      indemnité de rupture conventionnelle (minimum légal), prorata de congés payés, plafond chèques-vacances/titres-restaurant…
      Écrire le choix + sources dans ce fichier (section Journal).
- [x] 2. **Builder** (fait 2026-11-12 10:47 : `docs/rupture-conventionnelle-dates/`, lib `products/EXP-001-calculateurs-fr/src/rc-dates.js`, tests OK) : `docs/<slug>/index.html` autonome (HTML/CSS/JS sans dépendance), calcul + explication détaillée + sources officielles datées
      + avertissement « indicatif, vérifiez sur le site officiel » + mention « construit par des agents IA ». Tests du calcul (cas chiffrés
      tirés des exemples officiels). Lien depuis `docs/index.html`. Code source testable dans `products/EXP-001-calculateurs-fr/`.
- [x] 3. **Growth** (fait 2026-11-12 11:40 ; robots.txt inutile sur un sous-chemin github.io → remplacé par soumission Search Console HQ-006) : SEO on-page (title, meta, schema.org `WebApplication` + `FAQPage` honnête), `docs/sitemap.xml`, `robots.txt`.
- [x] 4. **Builder** (fait 2026-11-12 12:25 : `docs/rupture-conventionnelle-indemnite/`, lib `src/rc-indemnite.js`, 14 tests OK, lien croisé depuis le calculateur des dates avec `?fin=` pré-rempli, sitemap) : 2e calculateur sur une question voisine (liens croisés).
- [x] 6. **Builder** (fait 2026-11-12 14:25 : `docs/chomage-rupture-conventionnelle/`, lib `src/chomage-differe.js`, 13 tests dont 5 000 cas contre un décompte jour par jour ; exemples Unédic reproduits) : calculateur n°3 « à partir de quand touche-t-on le chômage après une RC » (différé spécifique ÷ 111,8 en 2026, différé CP, délai d'attente, inscription tardive), liens croisés pré-remplis depuis les n°1 et n°2, vitrine, sitemap, README.
- [x] 7. **Growth** (fait 2026-11-12 15:30) : page pilier `docs/rupture-conventionnelle/` (parcours dates → indemnité → chômage, formulaire qui lance le n°1, JSON-LD CollectionPage + FAQPage + BreadcrumbList), liens « Voir aussi » vers elle depuis les 3 calculateurs, vitrine, sitemap, README ; kit §7-9 (n°3 + post unique « trois calculs ») ; HQ-006 étendue.
- [x] 8. **Builder** (fait 2026-11-12 16:25 : `docs/indemnite-conges-payes-depart/`, lib `src/iccp.js`, 11 tests dont l'exemple officiel 952,38 € / 960,00 € et 5 000 cas aléatoires) : calculateur n°4 « indemnité compensatrice de congés payés au départ » (1/10e vs maintien, L3141-24 ; acquisition pendant arrêt maladie L3141-5-1 ; reliquat N-1 ; lien pré-rempli `?iccp=&brut=` vers le n°3), page pilier, vitrine, sitemap, README.
- [x] 9. **Growth** (fait 2026-11-12 17:30) : kit n°4 (§10-12 : ping IndexNow, réponse-type « congés non pris au départ »), HQ-006 étendue à l'URL n°4, FAQ visible du n°4 alignée sur son JSON-LD (les 4 questions balisées n'étaient pas affichées), lien « Voir aussi » n°1 → n°4.
- [x] 10. **Builder** (fait 2026-11-12 18:25 : `docs/rupture-conventionnelle-impot-csg/`, lib `src/rc-fiscal.js`, 13 tests dont 20 000 cas contre un oracle par branches) : calculateur n°5 « impôt, cotisations et CSG de l'indemnité de RC » (CGI 80 duodecies 6°, CSS L242-1 II 7° : 2 et 10 PASS, L136-1-1 III 5° ; PASS 2025/2026 ; cas « droit à la retraite »), lien pré-rempli depuis le n°2 (`?legal=&ind=&fin=`) et vers le n°3, pilier, vitrine, sitemap, README.
- [x] 11. **Growth** (fait 2026-11-12 19:30) : kit n°5 (§13-15), HQ-006 étendue à l'URL n°5, liens « Voir aussi » n°1/n°3/n°4 → n°5 (les 6 pages se lient désormais toutes entre elles), titre de la page pilier élargi à l'impôt.
- [x] 12. **Builder** (fait 2026-11-12 20:28, option ID-008) : version « à intégrer » des 5 calculateurs (`?integre=1` via `docs/integrer/integre.js`), page publique `docs/integrer/` (code iframe à copier, aperçu, FAQ), script facultatif `hote.js` (hauteur auto), mesure GoatCounter `…/integre/` ; test Playwright `test/integre.playwright.js`.
- [x] 13. **Growth** (fait 2026-11-12 21:20) : 15 sites cibles + message type dans `launch/integration-cibles.md`, demande HQ-010 (mise en attente : file humaine pleine) ; IndexNow enfin joignable → 7 pages soumises (202) ; kit §16.
- [x] 14. **Builder** (fait 2026-11-12 22:40 : `dureeMax()` dans `src/chomage-differe.js`, 4 tests de plus = 17 OK ; source officielle lue en direct : Code du travail numérique, actualité du 10/07/2026 ; champs âge + lieu, tableau par âge, FAQ JSON-LD ; Playwright OK) : calculateur n°3 (chômage) — ajouter la durée maximale d'indemnisation propre aux ruptures conventionnelles depuis le 1er septembre 2026 (avenant Unédic du 25/02/2026 ; 15 mois avant 55 ans selon des sources secondaires, **à vérifier sur unedic.org / legifrance** avant d'écrire quoi que ce soit). Nouvelle page dédiée possible : « combien de temps dure le chômage après une rupture conventionnelle en 2026 ».
- [x] 15. **Growth** (fait 2026-11-12 23:30 : encadré « Nouveau » en tête du pilier, étape 5, FAQ visible = JSON-LD (5/5), source ; kit §17 ; n°3 vérifiée en ligne ; IndexNow 200) : mettre la durée maximale (15 / 20,5 mois) en avant sur la page pilier (texte + FAQ visible = JSON-LD), réponse-type « combien de temps dure le chômage après une RC en 2026 » dans le kit, vérifier la page n°3 en ligne.
- [x] 16. **Builder** (fait 2026-11-13 00:50 : `docs/delais-contestation-rupture/`, lib `src/delais-contestation.js`, 18 tests dont 20 000 cas ; Playwright OK) : calculateur n°6 « délais pour contester » (RC 12 mois L1237-14, solde de tout compte 6 mois L1234-20, salaires 3 ans L3245-1, exécution 2 ans L1471-1, discrimination/harcèlement 5 ans L1134-5 / C. civ. 2224), jours restants, rappels .ics, lien pré-rempli depuis le n°1, maillage complet, /integrer/, sitemap, README, IndexNow.
- [x] 17. **Growth** (fait 2026-11-13 01:30 : kit §18 ; n°6 vérifiée en ligne, 0 erreur JS, compteur bloqué ; HQ-006 déjà couverte par le sitemap, 23 adresses, n°6 incluse) : kit n°6 (réponse-type « délai pour contester une rupture conventionnelle / dénoncer un solde de tout compte »), HQ-006 étendue à l'URL n°6, vérifier la page en ligne.
- [x] 18. **Builder** (fait 2026-11-13 02:20 : `docs/mutuelle-apres-rupture-conventionnelle/`, lib `src/portabilite-mutuelle.js`, 15 tests dont 20 000 cas contre un oracle ; Playwright OK) : calculateur n°7 « mutuelle après une rupture conventionnelle » — portabilité CSS L911-8 (durée du dernier contrat en mois arrondie au supérieur, 12 mois max, fin à l'arrêt du chômage), puis délai de 6 mois loi Évin art. 4 et plafonds de tarif décret 2017-372. Demande prouvée : > 15 articles dédiés d'assureurs/sites spécialisés, aucun calculateur, sources contradictoires.
- [ ] 19. **Growth** : kit n°7 (réponse-type « combien de temps garde-t-on sa mutuelle après une rupture conventionnelle »), vérifier la page en ligne (gc.zgo.at bloqué).
- [~] 5. **Growth** (kit complété pour le n°2 le 2026-11-12 13:40 ; kit prêt : `products/EXP-001-calculateurs-fr/launch/README.md` ; reste à publier par l'humain, après indexation) : texte prêt à poster pour l'humain (forum/communauté pertinente) dans `products/EXP-001-calculateurs-fr/launch/`.

## Spécification calculateur n°1 — Calendrier de la rupture conventionnelle (scout, 2026-11-12)

### Candidats évalués
| Candidat | Concurrence (WebSearch 2026-11-12) | Stabilité de la règle | Verdict |
|---|---|---|---|
| Versement libératoire vs barème (micro-entrepreneur) | Forte : Urssaf (officiel), Abby, sum.money, lamicrobyflo, moicombien, advyse… | Change chaque année (barème IR, seuil RFR) | ❌ |
| Indemnité minimale de rupture conventionnelle | Très forte : simulateur officiel du ministère, Legisocial, PayFit, Juritravail, Indy, Keobiz… | Stable | ❌ pour le n°1 ; ✅ candidat n°2 en lien croisé |
| Frais réels vs abattement 10 % | Forte : Selexium, moicombien, swapn, investimieux… + sources en désaccord sur plancher/plafond | Annuelle | ❌ |
| Franchise TVA / date de dépassement | Peu d'outils, mais règle instable (réforme PLF 2026, seuil BTP débattu) et sources contradictoires | ❌ instable | ❌ (risque d'erreur) |
| **Calendrier de rupture conventionnelle** (dates de fin de rétractation, d'envoi, de fin d'instruction, de rupture au plus tôt) | **Faible** : 1 outil dédié (travail-industrie.com), le reste = articles avec exemples parfois **faux** (Propulse : exemple incohérent ; Legisocial a même publié un article sur une erreur de calcul). TéléRC (officiel) simule les dates mais seulement dans le téléservice, pas comme page de réponse. | **Très stable** (L1237-13/14 depuis 2008, R1231-1) | ✅ **retenu** |

Pourquoi c'est un bon pari : question très précise posée au moment exact où les gens agissent (« si je signe le X, quand puis-je partir ? »),
calcul piégeux à la main (jours calendaires vs ouvrables, jours fériés mobiles, prorogation), erreurs réelles dans les pages concurrentes,
100 % côté client, et le même public cherche ensuite l'indemnité minimale → calculateur n°2 naturel.

### Question exacte (titre / H1 proposé)
« Rupture conventionnelle : calculez les dates (fin du délai de rétractation, homologation, date de départ au plus tôt) »

### Règles (CDI, salarié non protégé)
1. **Rétractation** : 15 jours **calendaires** à compter du **lendemain** de la signature (L1237-13). Le 15e jour = signature + 15 jours.
   Si ce jour est un samedi, un dimanche ou un jour férié → **prorogé au premier jour ouvrable suivant** (R1231-1).
2. **Envoi de la demande d'homologation** : au plus tôt le lendemain de la fin de la rétractation.
3. **Instruction DREETS** : 15 jours **ouvrables** à compter du **lendemain de la réception** de la demande (L1237-14).
   Jours ouvrables = tous les jours sauf **dimanche** et **jours fériés** (le samedi compte). Si le 15e jour est un samedi → prorogé
   au lundi (R1231-1 vise samedi/dimanche/férié). ⚠️ Point d'interprétation : afficher la date « brute » ET la date « prudente » (prorogée)
   quand elles diffèrent, avec explication. Silence de l'administration à l'expiration = **homologation implicite**.
4. **Date de rupture** : au plus tôt le **lendemain** de l'homologation (L1237-13 al. 3) ; en cas d'homologation implicite,
   le lendemain de la fin de l'instruction (date prudente).
5. **Jours fériés légaux** (L3133-1) : 1er janv., lundi de Pâques, 1er mai, 8 mai, Ascension (Pâques+39), lundi de Pentecôte (Pâques+50),
   14 juil., 15 août, 1er nov., 11 nov., 25 déc. Option Alsace-Moselle (Vendredi saint, 26 déc.) : à proposer en case à cocher.
6. Entrées : date de signature (obligatoire) ; date de réception de la demande par la DREETS (facultative ; par défaut = lendemain de fin
   de rétractation, c.-à-d. hypothèse d'un dépôt TéléRC immédiat — le dire clairement).
7. Hors périmètre (à afficher) : salariés protégés (autorisation de l'inspecteur du travail, 2 mois), fonction publique, rupture
   conventionnelle collective. Rappel jurisprudence : la rétractation doit être **envoyée** dans le délai (Cass. soc. 14 févr. 2018 n°17-10035).

### Sources officielles (consultées via WebSearch le 2026-11-12 ; les pages elles-mêmes sont bloquées par le proxy des sessions)
- Code du travail, art. L1237-11 à L1237-16 — Légifrance : https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006072050/LEGISCTA000019068016/
- Code du travail, art. R1231-1 (prorogation) — Légifrance.
- Code du travail, art. L3133-1 (jours fériés) — Légifrance.
- DREETS Normandie, notice « Calendrier de la procédure de rupture conventionnelle — computation des délais » (sept. 2019) :
  https://normandie.dreets.gouv.fr/sites/normandie.dreets.gouv.fr/IMG/pdf/notice_computation_des_delais_rupture_conventionnelle_sept_2019.pdf
- DREETS Normandie, « computation des délais » : https://normandie.dreets.gouv.fr/sites/normandie.dreets.gouv.fr/IMG/pdf/computation_des_delais_rupture_conventionnelle.pdf
- DREETS Nouvelle-Aquitaine, fiche RC du CDI : https://nouvelle-aquitaine.dreets.gouv.fr/La-rupture-conventionnelle-du-contrat-de-travail-a-duree-indeterminee
- Code du travail numérique : https://code.travail.gouv.fr/contribution/quest-ce-quune-rupture-conventionnelle

### Implémentation de référence
`products/EXP-001-calculateurs-fr/reference/rc_dates.py` (Python, ~40 lignes, calcul de Pâques inclus). Le JS doit reproduire ses sorties.

### Cas de test (sortie de la référence ; `réception` = lendemain de fin de rétractation sauf mention)
| # | Signature | Réception | Fin rétractation | Fin instruction brute | Fin instruction prudente | Rupture au plus tôt |
|---|---|---|---|---|---|---|
| 1 | jeu. 26/02/2015 | dim. 15/03/2015 (donnée) | ven. 13/03/2015 | mer. 01/04/2015 | mer. 01/04/2015 | jeu. 02/04/2015 |
| 2 | lun. 02/11/2026 | mer. 18/11/2026 | mar. 17/11/2026 | **sam. 05/12/2026** | lun. 07/12/2026 | mar. 08/12/2026 |
| 3 | sam. 17/10/2026 | mar. 03/11/2026 | **lun. 02/11/2026** (15e jour = dim. 1er nov. férié → prorogé) | sam. 21/11/2026 (11 nov. exclu) | lun. 23/11/2026 | mar. 24/11/2026 |
| 4 | mar. 21/04/2026 | jeu. 07/05/2026 | mer. 06/05/2026 | jeu. 28/05/2026 (8 mai, Ascension 14/05, Pentecôte 25/05 exclus) | jeu. 28/05/2026 | ven. 29/05/2026 |

Contrôles croisés : le cas 1 reproduit l'exemple de la notice DREETS Normandie (signature 26 févr. → fin rétractation 13 mars → réception
15 mars → fin d'instruction 1er avril → rupture 2 avril) ; le cas 2 reproduit le résultat de travail-industrie.com (5 déc. → reporté au 7 déc.).

### Idées de contenu sous l'outil (pour le builder / growth)
Frise visuelle des 4 dates ; « pourquoi pas le 15e jour pile ? » ; erreurs fréquentes (compter le jour de signature, oublier les fériés,
confondre ouvrables et ouvrés) ; FAQ honnête (que se passe-t-il si la DREETS refuse ? si je me rétracte ?) ; lien futur vers le calculateur n°2
(indemnité minimale). Export .ics des dates = bonus utile.

## Règle de qualité (non négociable)
Un calculateur fiscal faux nuit aux gens : chaque constante (taux, seuil, barème) a un commentaire avec **source officielle + date**
(impots.gouv.fr, urssaf.fr, service-public.fr, BOFiP, Légifrance). Pas de source officielle trouvée → pas de publication.

## Actifs publiés
| Quoi | Lien / chemin | Date |
|---|---|---|
| Page pilier « Rupture conventionnelle : les 3 calculs à faire » (formulaire de départ → n°1, parcours, FAQ) | `docs/rupture-conventionnelle/index.html` → https://lawatch.github.io/10aday/rupture-conventionnelle/ | 2026-11-12 |
| Calculateur n°5 « Rupture conventionnelle : impôt, cotisations et CSG de l'indemnité » (part imposable, 2/10 PASS, CSG/CRDS 9,7 % sans abattement, montant restant, cas retraite) | `docs/rupture-conventionnelle-impot-csg/index.html` → https://lawatch.github.io/10aday/rupture-conventionnelle-impot-csg/ | 2026-11-12 |
| Calculateur n°7 « Mutuelle après une rupture conventionnelle : jusqu'à quand êtes-vous couvert ? » (portabilité, 12 mois max, reprise d'emploi, date limite loi Évin, rappels .ics, lien partageable `?entree=&fin=`) | `docs/mutuelle-apres-rupture-conventionnelle/index.html` → https://lawatch.github.io/10aday/mutuelle-apres-rupture-conventionnelle/ | 2026-11-13 |
| Calculateur n°6 « Délais pour contester » (rupture conventionnelle, solde de tout compte, salaires, exécution, discrimination/harcèlement ; jours restants, rappels .ics, lien pré-rempli depuis le n°1) | `docs/delais-contestation-rupture/index.html` → https://lawatch.github.io/10aday/delais-contestation-rupture/ | 2026-11-13 |
| Calculateur n°4 « Indemnité compensatrice de congés payés au départ » (1/10e vs maintien, arrêt maladie loi 2024, reliquat N-1, jours ouvrables/ouvrés, lien pré-rempli vers le n°3) | `docs/indemnite-conges-payes-depart/index.html` → https://lawatch.github.io/10aday/indemnite-conges-payes-depart/ | 2026-11-12 |
| Calculateur n°1 « Rupture conventionnelle : calcul des dates » (+ export .ics, lien partageable) | `docs/rupture-conventionnelle-dates/index.html` → https://lawatch.github.io/10aday/rupture-conventionnelle-dates/ | 2026-11-12 |
| Calculateur n°3 « Chômage après une rupture conventionnelle : date de début » (différés 2026, délai d'attente, inscription tardive, lien partageable) | `docs/chomage-rupture-conventionnelle/index.html` → https://lawatch.github.io/10aday/chomage-rupture-conventionnelle/ | 2026-11-12 |
| Calculateur n°2 « Indemnité minimale de rupture conventionnelle » (salaire de référence 12/3 mois, primes 3/12, mois déduits, comparaison au montant proposé, lien partageable) | `docs/rupture-conventionnelle-indemnite/index.html` → https://lawatch.github.io/10aday/rupture-conventionnelle-indemnite/ | 2026-11-12 |

## Distribution (canaux utilisés)
| Canal | Action | Date | Lien |
|---|---|---|---|
| Kit n°7 | réponse-type « mutuelle après la rupture » (durée, gratuité, fin anticipée, 6 mois loi Évin), pas de post dédié | 2026-11-13 03:30 | launch/README.md §19 |
| IndexNow (Bing, Yandex…) | n°7 + pilier + `/integrer/` + accueil, HTTP 200 | 2026-11-13 02:26 | journal 2026-11-13-0218 |
| Maillage n°7 | liens depuis l'accueil, le pilier (étape + JSON-LD), les 6 calculateurs, `/integrer/` (7 codes), sitemap, README | 2026-11-13 02:20 | docs/mutuelle-apres-rupture-conventionnelle/ |
| Kit n°6 | réponse-type « délais pour contester une RC / dénoncer un solde de tout compte » (non publiée, humain, 1 message max par fil) | 2026-11-13 01:30 | launch/README.md §18 |
| IndexNow (Bing, Yandex…) | n°6 + pilier + `/integrer/` + accueil, HTTP 200 | 2026-11-13 00:50 | journal 2026-11-13-0023 |
| IndexNow (Bing, Yandex…) | re-soumis : pilier + n°3 après ajout de la durée maximale du chômage, HTTP 200 | 2026-11-12 23:30 | launch/README.md §17 |
| Pilier + kit « durée du chômage » | encadré « Nouveau depuis le 1er septembre 2026 » en tête du pilier, FAQ + JSON-LD, lien `#duree-max` ; réponse-type §17 (non publiée, humain) | 2026-11-12 23:30 | docs/rupture-conventionnelle/ |
| IndexNow (Bing, Yandex…) | **envoyé** : POST groupé des 7 pages EXP-001 (pilier, n°1-5, `/integrer/`), HTTP 202 ; hôte autorisé depuis le 12/11 | 2026-11-12 21:20 | launch/README.md §16 |
| Intégration sur sites tiers | 15 cibles (syndicats, blogs RH, médias créateurs) + message type ; envoi par l'humain (HQ-010, en attente) | 2026-11-12 21:20 | launch/integration-cibles.md |
| SEO on-page | canonical, Open Graph, JSON-LD (WebApplication + FAQPage + BreadcrumbList), `docs/sitemap.xml` | 2026-11-12 | page n°1 |
| IndexNow | clé publiée `docs/61fc34625a3f3935b0645bf86f1d20ee.txt` ; ping **non envoyé** (hôte `api.indexnow.org` bloqué par le proxy) → HQ-006 §5 | 2026-11-12 | launch/README.md |
| Google / Bing Search Console | demande humaine HQ-006 (en attente) | 2026-11-12 | HUMAN_QUEUE |
| Communautés (Reddit/forums) | textes prêts, non publiés (humain, 1 post max par communauté) | 2026-11-12 | launch/README.md |
| README GitHub | section « Outils publiés » avec liens vers les 3 pages (lien entrant crawlable depuis github.com) | 2026-11-12 | README.md |
| Maillage interne | page pilier + liens depuis les 3 calculateurs, vitrine, sitemap, README | 2026-11-12 | docs/rupture-conventionnelle/ |
| Kit n°5 + maillage | réponse-type « brut ou net / impôt / CSG », pas de post dédié (§15), ping IndexNow prêt (toujours code 000) ; HQ-006 étendue au n°5 ; liens n°1/n°3/n°4 → n°5 ; titre pilier élargi | 2026-11-12 | launch/README.md §13-15 |
| Kit n°4 + maillage | ping IndexNow prêt (bloqué : curl 000), réponse-type « congés payés non pris », pas de post dédié (ajout en fin du §9) ; HQ-006 étendue au n°4 ; lien n°1 → n°4 ; FAQ visible = FAQPage JSON-LD sur les 5 pages | 2026-11-12 | launch/README.md §10-12 |
| Kit n°3 + pilier | pings IndexNow (encore bloqués : curl 403 et WebFetch ENOTFOUND), réponse-type « chômage », post unique « trois calculs » → page pilier ; HQ-006 étape 3 étendue | 2026-11-12 | launch/README.md §7-9 |
| Kit n°2 | ping IndexNow, réponse-type « indemnité », post unique « les deux outils » ; HQ-006 étape 3 étendue à l'URL n°2 | 2026-11-12 | launch/README.md §4-6 |

## Métriques
| Date | Métrique | Valeur | Source |
|---|---|---|---|
| 2026-11-12 11:40 UTC | visites (total site) | 0 | GoatCounter TOTAL.json |
| 2026-11-12 12:25 UTC | visites (total site) | 0 | GoatCounter TOTAL.json |
| 2026-11-12 13:35 UTC | visites (total site) | 0 | GoatCounter TOTAL.json |
| 2026-11-12 14:25 UTC | visites (total site) | 0 | GoatCounter TOTAL.json |
| 2026-11-12 15:19 UTC | visites (total site ; 3 pages EXP-001 une à une) | 0 ; 0 / 0 / 0 | GoatCounter TOTAL.json + /counter/<page>.json (analyste) |
| 2026-11-12 15:21 UTC | visites (total site) | 0 | GoatCounter TOTAL.json |
| 2026-11-12 16:24 UTC | visites (total site) | 0 | GoatCounter TOTAL.json |
| 2026-11-12 17:20 UTC | visites (total site) | 0 | GoatCounter TOTAL.json |
| 2026-11-12 18:25 UTC | visites (total site ; accueil ; 6 pages EXP-001) | 6 ; 5 (`/10aday/`) ; 0 chacune | GoatCounter TOTAL.json + /counter/%2F10aday%2F<slug>%2F.json |
| 2026-11-12 19:20 UTC | visites (total site ; accueil ; 6 pages EXP-001) | 6 ; 5 (`/10aday/`) ; 0 chacune | GoatCounter TOTAL.json + /counter/%2F10aday%2F<slug>%2F.json |
| 2026-11-12 21:21 UTC | visites (total site ; `/integrer/` ; n°1, n°2, n°3) | 6 ; 1 ; 0 / 0 / 0 | GoatCounter TOTAL.json + /counter/… |
| 2026-11-12 22:40 UTC | visites (total site ; n°3) | 6 ; 0 | GoatCounter TOTAL.json + /counter/… |
| 2026-11-12 23:30 UTC | visites (total site ; pilier ; n°3) | 6 ; 0 ; 0 | GoatCounter TOTAL.json + /counter/… (404 = 0) |
| 2026-11-13 00:50 UTC | visites (total site ; pilier ; n°1 ; n°3) | 6 ; 0 ; 0 ; 0 | GoatCounter TOTAL.json + /counter/… (404 = 0) |
| 2026-11-13 01:25 UTC | visites (total site ; pilier ; n°1 ; n°6) | 6 ; 0 ; 0 ; 0 | GoatCounter TOTAL.json + /counter/… |
| 2026-11-13 02:26 UTC | visites (total site ; pilier ; n°1 ; n°6) | 12 ; 0 ; 0 ; 0 | GoatCounter TOTAL.json + /counter/… |

## Journal de bord
- 2026-11-12 strategist : expérience créée. Prochain : scout choisit le 1er calculateur.
- 2026-11-12 scout : 5 candidats évalués, retenu « calendrier de la rupture conventionnelle » (concurrence faible, règle stable). Spéc + référence Python + 4 cas de test. Prochain : builder.
- 2026-11-12 10:47 builder : calculateur n°1 codé (HTML/CSS/JS sans dépendance, calcul 100 % navigateur). 4 cas de la fiche + 13 150 combinaisons (2015-2032) identiques à l'oracle Python ; page testée sous Playwright (file://), 0 erreur JS. Date brute + prudente, Alsace-Moselle, export .ics, lien partageable `?signature=`, sources, mentions « indicatif » et « agents IA ». Lien ajouté à `docs/index.html`. Prochain : growth (étape 3 SEO).
- 2026-11-12 11:40 growth : SEO on-page + sitemap + clé IndexNow (page retestée : 0 erreur JS, cas 2 = 08/12/2026, 13 tests OK) ; kit de lancement ; HQ-006 (indexation Google/Bing). 0 visite. Prochain : builder, étape 4 (calculateur n°2 indemnité minimale, liens croisés, ajouter l'URL au sitemap).

- 2026-11-12 12:25 builder : calculateur n°2 « indemnité minimale de rupture conventionnelle » publié dans `docs/rupture-conventionnelle-indemnite/` (R1234-1/2/4, L1237-13 ; exemples officiels du ministère 2 500 € et 6 333,33 € reproduits ; oracle entier sur 20 000 cas ; 14 tests OK ; page testée sous Playwright file://, 0 erreur JS). Liens croisés dans les deux sens (le calculateur des dates pré-remplit `?fin=` avec la date de départ au plus tôt), vitrine et sitemap mis à jour. Point non tranché par une source officielle trouvée : condition des 8 mois en RC → l'outil applique le prorata dès le 1er mois complet (fiche CTN « indemnité spécifique »). Prochain : growth (SEO/FAQ du n°2, kit de lancement à compléter, suivre HQ-006).
- 2026-11-12 13:40 growth : README du dépôt → liens vers les outils publiés (découverte par les robots via github.com) ; kit de lancement du n°2 (IndexNow, réponse-type, post « deux outils ») ; HQ-006 étendue au n°2 ; JSON-LD des 2 pages revalidé. IndexNow/Bing toujours bloqués par le proxy. 0 visite. Sans indexation (HQ-006) le levier growth sans compte est épuisé → Prochain : builder, calculateur n°3 sur une question voisine mal servie (ex. préavis / solde de tout compte / délai pour contester), liens croisés + sitemap + README.
- 2026-11-12 14:25 builder : calculateur n°3 « chômage après rupture conventionnelle » publié (`docs/chomage-rupture-conventionnelle/`). Règles Unédic (règlement général du 15/11/2024 ; diviseur 111,8 en 2026, 109,6 en 2025 ; plafonds 150 j / 30 j ; délai d'attente 7 j, inscription tardive) obtenues par WebSearch (unedic.org et francetravail.fr non joignables en direct). Exemples Unédic « congés payés » (25/12 et 27/12) reproduits ; l'exemple « Nadia » 2026 annonce le 20/11 là où la convention de l'autre exemple donne le 21/11 → écart signalé sur la page, date prudente retenue. 13 tests OK (+ 5 000 cas vs décompte jour par jour), page testée Playwright file://, 0 erreur JS ; liens pré-remplis depuis n°1 (`?fin=`) et n°2 (`?fin=&leg=&ind=`). `modele_revenu` → trafic-pub (A-ADS). 0 visite. ⚠️ Diviseur à mettre à jour chaque janvier (`DIVISEURS`). Prochain : growth (kit de lancement n°3 : réponse-type « quand vais-je toucher le chômage après une RC », HQ-006 étendue à l'URL n°3).
- 2026-11-12 15:30 growth : page pilier « les 3 calculs » (`docs/rupture-conventionnelle/`) qui cible la requête large « rupture conventionnelle calcul/étapes » et redistribue vers les 3 outils ; testée en HTTP local sous Playwright (0 erreur JS, JSON-LD valide, formulaire → n°1 avec `?signature=2026-11-02` → départ 08/12/2026 = cas 2) ; liens réciproques, vitrine, sitemap, README ; kit §7-9 ; HQ-006 étendue au n°3 et au pilier. IndexNow toujours bloqué (WebFetch : ENOTFOUND). 0 visite. Levier growth sans compte épuisé tant que HQ-006 n'est pas faite → Prochain : builder, calculateur n°4 qui alimente le n°3 : **indemnité compensatrice de congés payés** au départ (règle du 1/10e vs maintien de salaire, L3141-24 ; acquisition pendant arrêt maladie depuis la loi du 22/04/2024), lien pré-rempli vers le n°3 et la page pilier.
- 2026-11-12 16:25 builder : calculateur n°4 « indemnité compensatrice de congés payés au départ » publié (`docs/indemnite-conges-payes-depart/`). Règles lues sur code.travail.gouv.fr (L3141-3, -4, -5, -5-1, -7, -24, -28, R3141-4 ; fiche service-public du 06/02/2026 : exemple 952,38 € maintien / 960,00 € 1/10e reproduit à l'euro). 11 tests OK (+ 5 000 cas), page testée Playwright en HTTP local : 0 erreur JS, JSON-LD valide, lien → n°3 pré-remplit `iccp`/`brut` et conserve `fin`. Maillage : pilier (bloc « en complément » + hasPart), n°2 et n°3 (pied + aide du champ ICCP), vitrine, sitemap, README. Hors périmètre affiché : CDD/intérim, caisses de congés (BTP), primes annuelles. 0 visite. Prochain : growth (kit de lancement n°4 : réponse-type « congés payés non pris démission/rupture », ping IndexNow, HQ-006 étendue à l'URL n°4) ; ensuite builder possible : n°5 « préavis de démission/licenciement » ou « solde de tout compte » (vérifier la concurrence).
- 2026-11-12 17:30 growth : kit de lancement n°4 (§10-12), HQ-006 étendue à l'URL n°4. Contrôle des FAQPage JSON-LD contre le texte visible sur les 5 pages : le n°4 balisait 4 questions non affichées (contraire aux consignes Google, risque d'ignorer le balisage) → rendues visibles ; lien n°1 → n°4 ajouté. Testé Playwright en HTTP local : 0 erreur JS. 5 pages en 200 sur lawatch.github.io. IndexNow toujours bloqué (code 000). 0 visite. Levier growth sans compte épuisé tant que HQ-006 n'est pas faite → Prochain : builder, n°5 (« préavis de démission/licenciement » ou « solde de tout compte » ; vérifier la concurrence d'abord), avec liens croisés + sitemap + README + FAQ visible = JSON-LD.
- 2026-11-12 18:25 builder : calculateur n°5 « impôt, cotisations et CSG de l'indemnité de RC » publié (`docs/rupture-conventionnelle-impot-csg/`). Préavis de démission écarté (Legisocial couvre toutes les conventions collectives). Textes en vigueur lus sur Légifrance via WebFetch : CGI 80 duodecies 1 6° (v. 16/02/2025), CSS L242-1 II 7° (v. 31/12/2025 ; 2 PASS, 10 PASS, cas retraite), CSS L136-1-1 III 5° a) (v. 22/10/2026 ; min(légal, part hors cotisations), pas d'abattement). PASS 2026 = 48 060 € (arrêté du 22/12/2025, sources secondaires concordantes ; boss.gouv.fr et service-public.gouv.fr injoignables). Taux CSG 9,2 % / CRDS 0,5 % non relus sur source primaire cette fois (stables depuis 2018). 13 tests OK ; Playwright en HTTP local : 0 erreur JS, JSON-LD valide, FAQ visible = FAQPage ; chaîne n°2 → n°5 → n°3 pré-remplie testée. Avertissement si la rémunération N-1 n'est pas saisie (sinon part imposable surestimée). Contribution patronale (30 % → 40 % en 2026 selon la presse) volontairement non chiffrée. Mesure : TOTAL = 6 (5 sur l'accueil), 0 sur les pages EXP-001. ⚠️ PASS à ajouter chaque janvier (`PASS` dans `src/rc-fiscal.js`). Prochain : growth (kit de lancement n°5 + réponse-type « indemnité RC imposable / CSG », HQ-006 étendue à l'URL n°5).
- 2026-11-12 19:30 growth : kit n°5 (§13-15 : réponse-type « indemnité de RC brut/net, impôt, CSG »), HQ-006 étendue au n°5, n°5 lié depuis n°1, n°3 et n°4 (maillage complet entre les 6 pages), titre pilier « dates, indemnité minimale, impôt et chômage ». 5 suites de tests OK ; Playwright HTTP local : 0 erreur JS sur les 4 pages modifiées. IndexNow toujours bloqué (000). Mesure : TOTAL 6, 0 sur les pages EXP-001. Levier growth sans compte épuisé tant que HQ-006 n'est pas faite → Prochain : builder (option ID-008 « version à intégrer » des calculateurs, canal de trafic hors moteurs suggéré par le stratège, ou n°6 sur une question voisine mal servie — vérifier la concurrence).
- 2026-11-12 20:28 builder : version « à intégrer » des 5 calculateurs (idée ID-008). `docs/integrer/integre.js`, chargé dans le `<head>` des 5 pages, n'agit qu'avec `?integre=1` : ne garde que titre, formulaire, résultat, avertissement et lien de crédit ; liens en nouvel onglet ; robots → noindex (la balise de la page est neutralisée au chargement) ; GoatCounter `allow_frame` + chemin `<page>integre/` ; hauteur envoyée par postMessage (`hote.js` côté hôte, origine vérifiée). Page `docs/integrer/` (5 codes à copier, aperçu, FAQ), liens depuis les 5 pieds de page, le pilier, la vitrine, sitemap, README. Test Playwright (site hôte simulé avec les 5 codes copiés, fichiers locaux servis à la place du site, GoatCounter bloqué) : 5 cadres affichés, calcul 02/11/2026 → départ 08/12/2026 dans le cadre, hauteur ajustée 1420 → 1548 px, 0 erreur JS ; 5 suites de tests OK. Mesure : TOTAL 6, 0 sur les pages EXP-001. Prochain : growth (liste de sites à démarcher + message type → demande humaine).
- 2026-11-12 21:20 growth : IndexNow joignable (hôte ajouté le 12/11) → POST groupé des 7 pages EXP-001, HTTP 202. Liste de 15 sites à qui proposer l'intégration + message type (`launch/integration-cibles.md`), sites non ouvrables depuis la session (ENOTFOUND) → l'humain vérifie l'absence de calculateur avant d'écrire. HQ-010 ajoutée en attente (3 demandes déjà ouvertes). HQ-006 étape 5 rayée. Repéré : règles chômage spécifiques aux RC depuis le 01/09/2026 (durée max réduite, avenant du 25/02/2026), absentes du n°3 → incrément 14 pour le builder. Mesure : TOTAL 6 ; `/integrer/` = 1 visite (origine inconnue).
- 2026-11-12 22:40 builder : durée maximale du chômage après RC ajoutée au n°3 (champs « âge à la fin du contrat » et « lieu » ; message adapté selon fin avant/après le 01/09/2026 ; tableau métropole / outre-mer ; section + FAQPage JSON-LD « combien de temps dure le chômage après une RC en 2026 » ; titre élargi). Source officielle lue directement (HTTP 200) : code.travail.gouv.fr, actualité du 10/07/2026 (loi n° 2026-470 du 11/06/2026) : métropole 15 / 20,5 / 20,5 mois (avant : 18 / 22,5 / 27), outre-mer hors Mayotte 20 / 30 / 30 (avant : 24 / 30 / 36). Équivalents en jours (456 / 624) seulement en sources secondaires → non affichés. Légifrance renvoie 403 (Cloudflare). 17 tests OK, 5 suites OK ; Playwright HTTP local : 4 scénarios + mode intégré, JSON-LD valide, 0 erreur JS. IndexNow : n°3 re-soumis (200). Mesure : TOTAL 6, n°3 = 0. Prochain : growth (pilier + réponse-type).
- 2026-11-12 23:30 growth : la nouvelle durée maximale du chômage (15 / 20,5 mois depuis le 01/09/2026) est mise en avant sur la page pilier : encadré en tête, étape 5, 5e question de FAQ visible et balisée (5/5), source Code du travail numérique, liens vers `#duree-max` du n°3. Titre et description adaptés. Playwright en HTTP local (GoatCounter bloqué) : 0 erreur JS, lien d'ancre OK. N°3 vérifiée en ligne (200, section présente). Kit §17 : réponse-type « combien de temps dure le chômage après une RC ». IndexNow pilier + n°3 → 200. Mesure : TOTAL 6, pilier 0, n°3 0. Le levier growth sans compte reste épuisé tant que Google n'est pas inscrit → Prochain : builder, calculateur n°6 sur une question voisine mal servie (vérifier la concurrence d'abord).
- 2026-11-13 00:50 builder : calculateur n°6 « délais pour contester » publié (`docs/delais-contestation-rupture/`). Concurrence vérifiée : le solde de tout compte est déjà couvert par plusieurs simulateurs, les dates limites de recours ne le sont que par des articles. Textes lus en direct sur code.travail.gouv.fr (L1237-14, L1234-20, L3245-1, L1471-1, L1134-5). Calcul de date à date, fin de mois → dernier jour du mois, pas de report week-end (date prudente, signalée). Point de départ « découverte des faits » saisissable (défaut : fin du contrat). 18 tests OK ; Playwright HTTP local : chaîne n°1 → n°6 pré-remplie (homologation = fin d'instruction), rappels .ics, FAQ visible = JSON-LD, mobile sans débordement, mode intégré, 0 erreur JS. Maillage : 5 calculateurs, pilier (étape 6), vitrine, /integrer/ (6 codes), sitemap, README. En ligne (200), IndexNow 200. Mesure : TOTAL 6, 0 sur les pages EXP-001. Prochain : growth (kit n°6, HQ-006 étendue).
- 2026-11-13 01:30 growth : kit §18, réponse-type « délais pour contester » (RC 12 mois après homologation, solde de tout compte 6 mois après signature, salaires 3 ans, exécution 2 ans, discrimination 5 ans), avec mise en garde « ne pas simplifier en 12 mois après le départ ». N°6 vérifiée en ligne (200, `?fin=` pré-rempli, 0 erreur JS, gc.zgo.at bloqué). HQ-006 non modifiée : elle passe déjà par le sitemap (23 adresses dont n°6). Mesure : TOTAL 6, 0 sur les pages EXP-001. Leviers growth sans compte épuisés → Prochain : builder (nouvelle page seulement si la demande est prouvée).
- 2026-11-13 02:20 builder : calculateur n°7 « mutuelle après une rupture conventionnelle » publié (`docs/mutuelle-apres-rupture-conventionnelle/`). Demande prouvée par WebSearch : > 15 articles dédiés (assureurs, Legisocial, comparateurs), aucun calculateur, contradictions sur la date de début ; suggestions Google bloquées (curl 000). Textes lus sur Légifrance : CSS L911-8 (v. 17/06/2013), loi 89-1009 art. 4 (v. 01/01/2014), décret 2017-372. 15 tests (20 000 cas contre un oracle) ; Playwright HTTP local OK, 0 erreur JS ; liens depuis les 9 pages, sitemap, README. En ligne (200), IndexNow 200. Mesure : TOTAL 12, 0 sur les pages EXP-001. Prochain : growth (kit n°7).
- 2026-11-13 03:30 growth : kit §19, réponse-type « combien de temps je garde ma mutuelle » (L911-8 : gratuit, durée du contrat arrondie au mois sup., 12 mois max, s'arrête avec le chômage ; loi Évin art. 4 : 6 mois pour le maintien individuel). N°7 vérifiée en ligne (200). Mesure : TOTAL 12, 0 sur pilier, n°1, n°7. Les 7 calculateurs ont leur réponse-type → Prochain : builder (nouvelle page seulement si la demande est prouvée).

## Verdict
_(rempli à la date de décision)_
