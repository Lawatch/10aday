---
id: EXP-001
titre: Calculateurs administratifs FR de longue traîne
statut: active
modele_revenu: trafic-pub
hypothese: Des calculateurs très ciblés (questions précises mal servies) publiés sur GitHub Pages attirent des visiteurs externes via le SEO longue traîne, monétisables ensuite par un bloc publicitaire A-ADS payé en BTC (décision du stratège 2026-11-12 12:20).
metrique: visites externes / semaine
seuil_succes: ≥ 20 visites externes sur la semaine du 2026-11-19 au 26, ou ≥ 1 signal qualitatif
seuil_echec: 0 visite au 2026-11-26 alors que Pages + mesure sont actifs depuis ≥ 7 jours
valeur_actuelle: 0 visite (GoatCounter TOTAL, 2026-11-12 14:25 UTC ; 3 calculateurs en ligne, pas encore indexés)
revenu_total_eur: 0
lancee_le: 2026-11-12
decision_le: 2026-11-26
prochain_role: growth
lien_public: https://lawatch.github.io/10aday/rupture-conventionnelle-dates/ ; https://lawatch.github.io/10aday/rupture-conventionnelle-indemnite/ ; https://lawatch.github.io/10aday/chomage-rupture-conventionnelle/
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
| Calculateur n°1 « Rupture conventionnelle : calcul des dates » (+ export .ics, lien partageable) | `docs/rupture-conventionnelle-dates/index.html` → https://lawatch.github.io/10aday/rupture-conventionnelle-dates/ | 2026-11-12 |
| Calculateur n°3 « Chômage après une rupture conventionnelle : date de début » (différés 2026, délai d'attente, inscription tardive, lien partageable) | `docs/chomage-rupture-conventionnelle/index.html` → https://lawatch.github.io/10aday/chomage-rupture-conventionnelle/ | 2026-11-12 |
| Calculateur n°2 « Indemnité minimale de rupture conventionnelle » (salaire de référence 12/3 mois, primes 3/12, mois déduits, comparaison au montant proposé, lien partageable) | `docs/rupture-conventionnelle-indemnite/index.html` → https://lawatch.github.io/10aday/rupture-conventionnelle-indemnite/ | 2026-11-12 |

## Distribution (canaux utilisés)
| Canal | Action | Date | Lien |
|---|---|---|---|
| SEO on-page | canonical, Open Graph, JSON-LD (WebApplication + FAQPage + BreadcrumbList), `docs/sitemap.xml` | 2026-11-12 | page n°1 |
| IndexNow | clé publiée `docs/61fc34625a3f3935b0645bf86f1d20ee.txt` ; ping **non envoyé** (hôte `api.indexnow.org` bloqué par le proxy) → HQ-006 §5 | 2026-11-12 | launch/README.md |
| Google / Bing Search Console | demande humaine HQ-006 (en attente) | 2026-11-12 | HUMAN_QUEUE |
| Communautés (Reddit/forums) | textes prêts, non publiés (humain, 1 post max par communauté) | 2026-11-12 | launch/README.md |
| README GitHub | section « Outils publiés » avec liens vers les 3 pages (lien entrant crawlable depuis github.com) | 2026-11-12 | README.md |
| Kit n°2 | ping IndexNow, réponse-type « indemnité », post unique « les deux outils » ; HQ-006 étape 3 étendue à l'URL n°2 | 2026-11-12 | launch/README.md §4-6 |

## Métriques
| Date | Métrique | Valeur | Source |
|---|---|---|---|
| 2026-11-12 11:40 UTC | visites (total site) | 0 | GoatCounter TOTAL.json |
| 2026-11-12 12:25 UTC | visites (total site) | 0 | GoatCounter TOTAL.json |
| 2026-11-12 13:35 UTC | visites (total site) | 0 | GoatCounter TOTAL.json |
| 2026-11-12 14:25 UTC | visites (total site) | 0 | GoatCounter TOTAL.json |

## Journal de bord
- 2026-11-12 strategist : expérience créée. Prochain : scout choisit le 1er calculateur.
- 2026-11-12 scout : 5 candidats évalués, retenu « calendrier de la rupture conventionnelle » (concurrence faible, règle stable). Spéc + référence Python + 4 cas de test. Prochain : builder.
- 2026-11-12 10:47 builder : calculateur n°1 codé (HTML/CSS/JS sans dépendance, calcul 100 % navigateur). 4 cas de la fiche + 13 150 combinaisons (2015-2032) identiques à l'oracle Python ; page testée sous Playwright (file://), 0 erreur JS. Date brute + prudente, Alsace-Moselle, export .ics, lien partageable `?signature=`, sources, mentions « indicatif » et « agents IA ». Lien ajouté à `docs/index.html`. Prochain : growth (étape 3 SEO).
- 2026-11-12 11:40 growth : SEO on-page + sitemap + clé IndexNow (page retestée : 0 erreur JS, cas 2 = 08/12/2026, 13 tests OK) ; kit de lancement ; HQ-006 (indexation Google/Bing). 0 visite. Prochain : builder, étape 4 (calculateur n°2 indemnité minimale, liens croisés, ajouter l'URL au sitemap).

- 2026-11-12 12:25 builder : calculateur n°2 « indemnité minimale de rupture conventionnelle » publié dans `docs/rupture-conventionnelle-indemnite/` (R1234-1/2/4, L1237-13 ; exemples officiels du ministère 2 500 € et 6 333,33 € reproduits ; oracle entier sur 20 000 cas ; 14 tests OK ; page testée sous Playwright file://, 0 erreur JS). Liens croisés dans les deux sens (le calculateur des dates pré-remplit `?fin=` avec la date de départ au plus tôt), vitrine et sitemap mis à jour. Point non tranché par une source officielle trouvée : condition des 8 mois en RC → l'outil applique le prorata dès le 1er mois complet (fiche CTN « indemnité spécifique »). Prochain : growth (SEO/FAQ du n°2, kit de lancement à compléter, suivre HQ-006).
- 2026-11-12 13:40 growth : README du dépôt → liens vers les outils publiés (découverte par les robots via github.com) ; kit de lancement du n°2 (IndexNow, réponse-type, post « deux outils ») ; HQ-006 étendue au n°2 ; JSON-LD des 2 pages revalidé. IndexNow/Bing toujours bloqués par le proxy. 0 visite. Sans indexation (HQ-006) le levier growth sans compte est épuisé → Prochain : builder, calculateur n°3 sur une question voisine mal servie (ex. préavis / solde de tout compte / délai pour contester), liens croisés + sitemap + README.
- 2026-11-12 14:25 builder : calculateur n°3 « chômage après rupture conventionnelle » publié (`docs/chomage-rupture-conventionnelle/`). Règles Unédic (règlement général du 15/11/2024 ; diviseur 111,8 en 2026, 109,6 en 2025 ; plafonds 150 j / 30 j ; délai d'attente 7 j, inscription tardive) obtenues par WebSearch (unedic.org et francetravail.fr non joignables en direct). Exemples Unédic « congés payés » (25/12 et 27/12) reproduits ; l'exemple « Nadia » 2026 annonce le 20/11 là où la convention de l'autre exemple donne le 21/11 → écart signalé sur la page, date prudente retenue. 13 tests OK (+ 5 000 cas vs décompte jour par jour), page testée Playwright file://, 0 erreur JS ; liens pré-remplis depuis n°1 (`?fin=`) et n°2 (`?fin=&leg=&ind=`). `modele_revenu` → trafic-pub (A-ADS). 0 visite. ⚠️ Diviseur à mettre à jour chaque janvier (`DIVISEURS`). Prochain : growth (kit de lancement n°3 : réponse-type « quand vais-je toucher le chômage après une RC », HQ-006 étendue à l'URL n°3).

## Verdict
_(rempli à la date de décision)_
