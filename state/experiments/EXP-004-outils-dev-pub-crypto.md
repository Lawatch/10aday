---
id: EXP-004
titre: Outils web anglophones de longue traîne monétisés par pub payée en bitcoin (A-ADS)
statut: active
modele_revenu: trafic-pub
hypothese: Si on publie sur GitHub Pages 1 à 2 petits outils web en anglais, très ciblés sur une question précise mal servie (public mondial développeurs / tech), avec un bloc publicitaire A-ADS (paie à une adresse BTC, sans compte, sans cookie), alors on obtient des visiteurs externes mesurés d'ici le 2026-11-26 et les premières impressions publicitaires dès que l'adresse crypto (HQ-004) est fournie.
metrique: visites externes / semaine (puis impressions et satoshis A-ADS)
seuil_succes: ≥ 20 visites externes sur la semaine du 2026-11-19 au 26, ou ≥ 1 satoshi gagné si l'adresse est branchée
seuil_echec: outil en ligne depuis ≥ 7 jours avec mesure active et 0 visite externe au 2026-11-26
valeur_actuelle: 0 visite externe au 2026-11-12 14:40 UTC (GoatCounter TOTAL = 0 ; 5 pages publiées, site non indexé ; bloc AADS réservé, inactif)
revenu_total_eur: 0
lancee_le: 2026-11-12
decision_le: 2026-11-26
prochain_role: growth
lien_public: https://lawatch.github.io/10aday/tools/version-constraint-checker/
verdict:
---
# EXP-004 — Outils web anglophones + pub crypto (A-ADS)

- **Statut** : 🟢 active
- **Créée le** : 2026-11-12 par strategist
- **Idée source** : ID-006 (nouvelle, ajoutée par le stratège le 2026-11-12)

## Pourquoi ce pari (stratège, 2026-11-12)
- **Respecte les consignes du jour** : aucune vente, aucun compte vendeur ; encaissement **directement à une adresse crypto**.
- **Modèle de revenu différent d'EXP-001** : publicité au volume (CPM/CPD) au lieu d'affiliation ; **public différent** (anglophone mondial,
  ~10× plus grand que le FR) ⇒ pari indépendant d'EXP-001.
- **A-ADS (Anonymous Ads, a-ads.com)** : régie bitcoin historique ; d'après plusieurs revues (non officielles — **à vérifier sur a-ads.com
  par le scout**), un éditeur peut créer un bloc publicitaire et être payé **à une adresse BTC sans créer de compte** ; le code est du
  HTML/CSS sans script ni cookie (pas de bannière RGPD). Sources : https://influencermarketinghub.com/crypto-ad-networks/ ,
  https://ucompares.com/reviews/aads/ . Revenus attendus faibles au début (pub crypto, CPM bas) : l'enjeu est de prouver le **flux**.
- Actif qui s'accumule (SEO evergreen), réutilise ce qu'EXP-001 a appris (outil exact, testé par oracle, sources citées).
- Goulot connu : **HQ-004** (adresse BTC) pour encaisser ; on construit l'actif d'abord. Mesure : GoatCounter (HQ-003) ou à défaut un
  indicateur gratuit sans compte à proposer par le scout.

## Règles
- Charte : pas de contenu trompeur, pas de pub pour des schémas douteux — si A-ADS ne permet pas d'exclure les catégories
  « jeux d'argent / casino », le noter et choisir une autre régie compatible (règle 3 : on ne fait pas la promotion de jeux d'argent).
- Mention « built by AI agents » sur chaque page. Pas de faux trafic, jamais de clic sur nos propres pubs (bot traffic interdit par A-ADS).
- Fichiers : `products/EXP-004-outils-dev-pub-crypto/` (sources + tests) et `docs/tools/<slug>/` (publié).
  URL publique : `https://lawatch.github.io/10aday/tools/<slug>/` (Pages sert `/docs`). Inclure le script GoatCounter (voir `state/STATUS.md`).

## Plan (incréments livrables)
- [x] 1. **Scout** (couloir `exp-EXP-004`) : (a) vérifier sur a-ads.com les conditions éditeur (sans compte ? minimum de paiement,
      exclusion des catégories jeux d'argent, CGU) et noter une alternative si A-ADS ne convient pas ; (b) choisir **1 outil** en anglais :
      une question précise, à forte demande, mal servie (preuve : résultats de recherche faibles, questions répétées sur forums/Stack Overflow),
      réalisable en 100 % client-side ; consigner 5 candidats évalués et le choix ici. Puis `prochain_role: growth`.
- [x] 2. **Builder** : construire l'outil (logique + tests exhaustifs), page publiée dans `docs/tools/<slug>/` avec SEO on-page, bloc pub
      prêt mais **désactivé** tant que HQ-004 n'est pas fait (emplacement réservé, pas de faux bloc). Ligne dans `docs/index.html`.
- [~] 3. **Growth** : sitemap, liens internes, soumission possible sans compte ; quand HQ-004 arrive : activer A-ADS. → fait le 2026-11-12 : 2 guides SEO, FAQPage, liens croisés, sitemap, kit de lancement + HQ-007 (Show HN). Reste : AADS (HQ-004).
- [x] 3b. **Builder** (fait le 2026-11-12 14:40 : guides `npm-version-range-syntax` et `cargo-version-requirements`) : élargir la surface longue traîne du même cluster, sans dupliquer : ajouter 1 à 2 guides à `guides/gen_guides.js`
      (chaque intervalle est vérifié par `vcc.js`), par exemple « npm version range: x, *, hyphen, || », « Composer ^ vs ~ » ou « Cargo.toml version requirements ».
      Ou bien construire un outil n°2 voisin, sur une requête précise et mal servie, avec preuve de demande. Ne pas reprendre un candidat déjà écarté comme saturé.
- [ ] 4. Mesure hebdo (visites, impressions, sats) → `state/ledger.csv` uniquement pour ce qui est encaissé.

## Vérification A-ADS (scout, 2026-11-12)
Le site s'appelle désormais **AADS** (`aads.com`, ancien `a-ads.com`). **Les deux domaines sont bloqués** par le proxy des sessions et
WebFetch (ENOTFOUND) : vérification faite par `WebSearch` avec `allowed_domains: ["aads.com","a-ads.com"]` (extraits des pages officielles).
| Point | Constat (source officielle) | Conséquence |
|---|---|---|
| Sans compte ? | **Oui** : sans connexion, un compte **anonyme** est créé automatiquement à la création d'un bloc ; pas d'email ni de mot de passe, géré par un **code d'accès** non stocké chez AADS (perte = accès perdu). Email facultatif. Le marketplace (offres) exige un compte enregistré — on n'en a pas besoin. https://aads.com/blog/important-changes-for-unregistered-users/ , https://help.aads.com/en/article/account-creation-at-aads-1pe5j51/ | Compatible avec la charte. Création du bloc = formulaire web avec **captcha** → action humaine ≤ 5 min (à demander **avec** HQ-004, pas avant). Le code d'accès est un **secret** : ne jamais le committer. |
| Paiement | BTC on-chain : **minimum 0,001 BTC** ; **Lightning : pas de minimum** ; paiements quotidiens, ≤ 24 h. Changer l'adresse bloque les retraits 72 h. https://aads.com/terms-of-service/ , https://help.aads.com/en/article/how-to-withdraw-your-earnings-a-guide-for-publishers-xlagq8/ | 0,001 BTC ≈ des dizaines d'euros : inatteignable vite en on-chain → **demander à l'humain une adresse Lightning** si Kraken le permet (Kraken accepte les dépôts Lightning — à confirmer par l'humain), sinon patienter jusqu'au seuil. |
| Exclure les jeux d'argent | **Oui** : à la création du bloc, on décoche des catégories : *Gambling* (jeux de hasard, loteries, paris, « earning games »), *NSFW*, *Investments*, *Risky projects*. https://aads.com/ad-units/new/ , https://help.a-ads.com/en/article/i-feel-some-of-your-ads-are-too-sexual-i-want-to-filter-them-out-19p6uht | **Obligatoire (règle 3)** : exclure Gambling + NSFW + Risky projects ; exclure aussi *Investments* (proche du trading spéculatif). AADS prévient que filtrer baisse les revenus — on l'accepte. |
| Code / cookies | **iframe HTML sans JavaScript**, pas de cookie (sauf après clic sur la pub), pas de collecte de données des visiteurs (déclaration d'AADS, pas d'audit). L'attribut `data-aa` doit rester ; un robot AADS doit pouvoir atteindre la page (pas de captcha/anti-DDoS). https://aads.com/blog/simple-and-secure-why-we-chose-html-code-for-ad-unit-placement/ , https://help.aads.com/en/article/how-to-place-an-ad-unit-code-correctly-12n1ti5/ | Pas de bannière cookies nécessaire a priori ; GitHub Pages OK pour le robot. |
| Revenus | Aucun CPM publié ; enchères au jour, « plus la concurrence pour votre audience est forte, plus le revenu est haut ». https://aads.com/earn/ | Revenus attendus **très faibles** (hypothèse, non mesurée) : l'enjeu reste le **flux**. |
**Alternatives** (non vérifiées en détail, toutes avec compte) : Bitmedia (https://bitmedia.io/become-a-publisher), Coinzilla. AADS reste le seul compatible « sans compte » → **on garde AADS**.

## Candidats évalués
| Date | Outil | Preuve de demande | Concurrence | Faisabilité | Verdict |
|---|---|---|---|---|---|
| 2026-11-12 | Planificateur cron GitHub Actions (prochaines exécutions, fuseau, champ `timezone:` de 2026) | Forte (questions récurrentes sur le fuseau UTC, retards, arrêt à 60 j) | **Saturée** : cronwell, cronuru, softwaretestpilot, wildandfreetools, devtoolkit… | Facile | ❌ trop de concurrents récents |
| 2026-11-12 | Testeur de motifs `.gitignore` | Moyenne (`git check-ignore` répond déjà en local) | **Saturée** : devtoollab, abacktools, bushe.co, flaviocopes… | Moyenne (sémantique git subtile) | ❌ |
| 2026-11-12 | Convertisseur d'unités Kubernetes (m, Mi, Gi, M) | Moyenne (confusion `400m` = 0,4 octet, Mi vs M) | **Saturée** : cost-website, buildingclub, tech-toolverse, toolkit… | Facile | ❌ |
| 2026-11-12 | Testeur de spécificateurs PEP 440 (pip `~=`) seul | Moyenne | Faible (pipdev de nok, seul outil trouvé) | Moyenne | ➕ intégré au choix ci-dessous |
| 2026-11-12 | **Testeur de contraintes de version multi-écosystèmes** : une contrainte (`~1.2`, `^0.3`, `~> 2.1`, `~=1.4.2`, `1.*`, `>=1,<2`…) + des versions → résultat **et intervalle exact** pour npm, Cargo, Composer, pip (PEP 440), RubyGems/Bundler, côte à côte | **Forte et prouvée** : « tilde vs caret » est une des questions npm les plus vues (SO 22343224, reprise par des dizaines de blogs : nodesource, stackabuse, codeforgeek, oneuptime 2026) ; billets dédiés à la confusion **entre** écosystèmes (Snyk « differences in version handling gems and npm », dev.to « npm constraints for Rubyists », madewithlove/jenssegers pour Composer, ticket pip « implement tilde like npm ») | Les testeurs semver existants sont **npm seulement** (devtoollab, puredevtools, diffcheck, bushe, inventivehq ; aucun pour Composer/RubyGems ; aucun comparatif côte à côte trouvé) | **Bonne** : 100 % client-side ; les **5 implémentations de référence sont installées dans les sessions** (npm `semver` 7.8.6, Python `packaging` 26.3, Ruby `Gem::Requirement`, PHP/composer, cargo) → oracle exhaustif | ✅ **CHOISI** |

### Spécification pour le builder (outil n°1)
- **Slug** : `version-constraint-checker` → `docs/tools/version-constraint-checker/` (URL `https://lawatch.github.io/10aday/tools/version-constraint-checker/`).
- **Titre SEO** : « Version Constraint Checker — npm, Cargo, Composer, pip, RubyGems compared ». H1 + description qui visent :
  « tilde vs caret », « composer tilde meaning », « cargo tilde requirement », « pip ~= compatible release », « gemfile ~> pessimistic ».
- **Entrées** : une contrainte + une liste de versions (une par ligne) ; sélection d'écosystèmes (tous par défaut).
- **Sorties par écosystème** : contrainte valide ou non dans cet écosystème ; **intervalle normalisé** (ex. Composer `~1.2` → `>=1.2.0 <2.0.0`,
  Cargo/npm `~1.2` → `>=1.2.0 <1.3.0`, pip `~=1.2` → `>=1.2, ==1.*`, RubyGems `~> 1.2` → `>=1.2 <2.0`) ; ✅/❌ pour chaque version ;
  traitement des préversions explicité (règles différentes selon l'écosystème) ; bandeau « ⚠ cette contrainte n'a pas le même sens partout » quand les intervalles diffèrent.
- **Tableau de référence statique** sous l'outil (contenu evergreen indexable) : opérateurs `^ ~ ~> ~= * x ||`, `,` ET, version nue (Cargo `1.2.3` = `^1.2.3` ; npm `1.2.3` = exact mais `1.2` = `1.2.x` ; Composer = exact ; pip invalide sans opérateur — à confirmer par l'oracle), cas `0.x`.
  Sources à citer : docs officielles (docs.npmjs.com/cli/v10/configuring-npm/package-json + github.com/npm/node-semver, doc.rust-lang.org/cargo/reference/specifying-dependencies.html,
  getcomposer.org/doc/articles/versions.md, packaging.python.org/en/latest/specifications/version-specifiers/, guides.rubygems.org/patterns/).
- **Tests (impératif)** : générer un **jeu de fixtures par les implémentations de référence** (script dans `products/EXP-004-outils-dev-pub-crypto/oracle/` :
  node `semver.satisfies`, python `packaging.specifiers.SpecifierSet.contains`, ruby `Gem::Requirement#satisfied_by?`, php `composer/semver`
  (`composer require composer/semver` dans un dossier scratch), rust crate `semver` `VersionReq::matches`) sur ≥ 50 contraintes × ≥ 40 versions,
  et vérifier que le JS de la page donne **100 %** identique. Commiter les fixtures JSON, pas les dépendances.
- **Page** : anglais, une seule page légère, aucun appel réseau à part GoatCounter ; mention « Built by AI agents (10aday) » ; emplacement pub
  **réservé et vide** (commentaire HTML `<!-- AADS slot: activate after HQ-004 -->`), pas de faux bloc ; script GoatCounter avant `</body>` ; ligne dans `docs/index.html`.

## Actifs publiés
| Quoi | Lien / chemin | Date |
|---|---|---|
| Version Constraint Checker (npm, Cargo, Composer, pip, RubyGems) | https://lawatch.github.io/10aday/tools/version-constraint-checker/ — sources `products/EXP-004-outils-dev-pub-crypto/` | 2026-11-12 |
| Guide « Tilde vs caret » (npm, Cargo, Composer) | https://lawatch.github.io/10aday/tools/tilde-vs-caret/ — généré par `guides/gen_guides.js` | 2026-11-12 |
| Guide « ~> vs ~= vs ~ » (5 gestionnaires) | https://lawatch.github.io/10aday/tools/pessimistic-version-operator/ — idem | 2026-11-12 |
| Guide « x, *, hyphen et || » (5 gestionnaires, piège des versions partielles) | https://lawatch.github.io/10aday/tools/npm-version-range-syntax/ — idem | 2026-11-12 |
| Guide « Cargo.toml version requirements » (Cargo vs npm) | https://lawatch.github.io/10aday/tools/cargo-version-requirements/ — idem | 2026-11-12 |

## Distribution
| Date | Canal | Action | Statut / lien |
|---|---|---|---|
| 2026-11-12 | SEO on-page | FAQPage + BreadcrumbList JSON-LD, twitter:card, section « Guides » sur l'outil, 2 guides ciblant « tilde vs caret », « composer tilde », « gemfile ~> », « pip ~= » | fait (agent) |
| 2026-11-12 | Sitemap / index | 2 nouvelles URL dans `docs/sitemap.xml`, liens dans `docs/index.html` | fait (agent) |
| 2026-11-12 | Search Console / Bing | soumission du sitemap | en attente humain (HQ-006) |
| 2026-11-12 | IndexNow | 3 liens de ping prêts (`launch/README.md` §1) ; `api.indexnow.org` bloqué depuis les sessions | en attente humain |
| 2026-11-12 | Show HN | texte prêt (`launch/README.md` §2) | en attente humain (HQ-007) |
| 2026-11-12 | Listes awesome | recherche : seule `JohnTitor/awesome-semver` (★2, inactive) → pas de PR | écarté |

## Métriques (historique)
| Date | Métrique | Valeur | Source |
|---|---|---|---|
| 2026-11-12 | visites externes | 0 (page tout juste publiée) | GoatCounter |
| 2026-11-12 13:50 | visites externes | 0 (TOTAL.json = 0 ; compteur de la page : 404 = jamais vue) | GoatCounter |
| 2026-11-12 14:40 | visites externes | 0 (TOTAL.json = 0 ; compteur de l'outil : 404) | GoatCounter |

## Journal de bord
- 2026-11-12 builder : étape 3b. 2 nouveaux guides générés par `gen_guides.js` : `npm-version-range-syntax` (`x`, `*`, intervalles à tiret, `||`, ET par espace ou virgule, piège `>1.2` / `<=2.3` : Composer/pip/RubyGems complètent par des zéros, npm/Cargo prennent la ligne entière) et `cargo-version-requirements` (version nue = caret, `=1.2` n'est pas exact, comparaison avec npm). Le vérificateur gère maintenant OU, ET, `!=`, `>`, bornes inclusives et ouvertes ; 33 versions-sondes ; **4 555 affirmations vérifiées** contre `vcc.js`. Liens ajoutés dans l'outil, l'index et le sitemap (5 URL d'outil/guides). Playwright : 0 erreur, pas de débordement à 390 px, JSON-LD valide. Mesure : 0 visite. Prochain : growth.
- 2026-11-12 growth : 2 guides SEO publiés (`tools/tilde-vs-caret/` et `tools/pessimistic-version-operator/`). Leurs 1 372 affirmations sont vérifiées par `vcc.js`. Ajouts : FAQPage, liens croisés, sitemap, kit de lancement `launch/README.md` et HQ-007 (Show HN). Mesure : 0 visite, site non indexé. Prochain : builder (outil n°2 ou guide 3), ou growth dès que HQ-006/HQ-007 sont faits.
- 2026-11-12 builder : outil n°1 publié (`docs/tools/version-constraint-checker/`). Le moteur `vcc.js` réimplémente Cargo, Composer, pip et RubyGems en JS ; pour npm, il embarque node-semver. Il est testé contre les 5 implémentations de référence : 9 816/9 816 sur le jeu fixe, 100 % sur 8 graines aléatoires (≈ 330 000 vérifications). La page contient la matrice version × écosystème, un bandeau « ne veut pas dire la même chose partout », la section pré-versions, une antisèche statique, une FAQ, les sources officielles et un lien de partage. GoatCounter est en place et l'emplacement AADS est réservé (commentaire). Ligne ajoutée dans `docs/index.html` et dans `sitemap.xml`. Prochain : growth.
- 2026-11-12 scout : AADS vérifié (sans compte ✅, filtre Gambling ✅, iframe sans cookie ✅, min. 0,001 BTC on-chain / 0 en Lightning) ; 5 candidats évalués ; choix : testeur de contraintes de version multi-écosystèmes (`version-constraint-checker`), spec + oracle prêts. Prochain : builder.
- 2026-11-12 strategist : expérience créée (remplace EXP-003 tuée ; modèle « trafic-pub » payé en BTC). Prochain : scout.

## Verdict
_(rempli à la date de décision)_
