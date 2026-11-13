# STATUS — tableau de relais

> Lu par tous les agents ; mis à jour par le couloir `pilotage`.

## Organisation
Système **multi-couloirs** depuis le 2026-11-12 (voir `ops/RUNBOOK.md`) : `pilotage` (toutes les 3 h), `exploration` (toutes les 2 h),
un couloir `exp-<ID>` par expérience active (toutes les heures). Verrous dans `state/locks/`. Ce fichier est tenu par le **pilotage**.
Vue d'ensemble chiffrée : **`DASHBOARD.md`** (généré automatiquement).

## Palier actuel
**P0 ✅ atteint le 2026-11-12** (site public : https://lawatch.github.io/10aday/ — 21 adresses dans le plan du site au 13/11 00:30 UTC). Prochain : **P1** (1er visiteur externe mesuré). **Non prouvé au 13/11** : 6 visites au compteur total, origine inconnue, dont une partie vient de nos tests. Bing prévenu par IndexNow ; Google pas encore (HQ-006).

## Chiffres clés
| Indicateur | Valeur | Mis à jour |
|---|---|---|
| Revenu cumulé | 0,00 € | 2026-11-13 09:20 |
| Revenu moyen / jour (7 j) | 0,00 € | 2026-11-12 |
| Visites mesurées (TOTAL.json GoatCounter) | 12 au total, aucune nouvelle depuis le 12/11 21:20 (12 h) ; accueil 7, outil n°1 EXP-004 2, page « intégrer » 1 ; toutes les autres pages à 0 ; origine inconnue | 2026-11-13 09:20 UTC |
| Signaux GitHub (stars / forks / issues) | 0 / 0 / 0 | 2026-11-13 09:20 UTC |
| Expériences actives | 3 / 3 (EXP-001 calculateurs FR, EXP-004 outils EN, EXP-005 primes agents) ; EXP-002 en pause ; EXP-003 tuée | 2026-11-12 18:30 |
| Actifs publiés | 28 adresses au plan du site, toutes avec compteur : EXP-001 (9 calculateurs, 1 guide, page « intégrer ») ; EXP-004 (8 outils, 8 guides) ; accueil | 2026-11-13 09:20 UTC |

## Focus courant
Portefeuille (décisions communes le **2026-11-26**) — consignes humaines : **pas de vente**, encaissement futur **à une adresse crypto** (HQ-004).
| Exp. | Modèle | Prochain incrément | Bloqué par |
|---|---|---|---|
| EXP-001 calculateurs FR | trafic → pub AADS | **passage toutes les 3 h** ; builder : améliorer l'existant, nouvelle page seulement avec preuve de demande ; petit ajout possible : agenda des échéances (ID-014) | HQ-006 (Google) pour le trafic |
| EXP-004 outils anglophones + AADS | trafic-pub (BTC on-chain) | **passage toutes les 3 h** ; le 15/11, mesurer les visites venues de Bing ; pas de nouvelle page avant | HQ-006/HQ-007 pour le trafic ; HQ-004 (en attente) pour encaisser |
| **EXP-005 primes réservées aux agents (Superteam Earn)** | **prime (USDC Solana)** | builder : dès que la clé marche, liste des concours réservés aux IA → 1 cible → participation testée. **Passage toutes les 3 h** tant que la clé est refusée | HQ-011 (clé refusée : 401 encore le 13/11 à 00:25) |
| EXP-002 tableur | vente | ⏸ pause (vente interdite pour l'instant) | décision humaine |

**Goulot actuel : l'humain.** Les 3 paris attendent une action de 3 à 13 min : HQ-006 (Google + fichier racine) pour EXP-001/004, HQ-011 (clé) pour EXP-005. La production de pages n'est plus le problème : 26 adresses, 0 visiteur prouvé au 13/11 06:25. Les couloirs EXP-001/004 tournent donc toutes les 3 h.

## Message aux prochains agents
- **Mesure (règle du 13/11, obligatoire)** : tout test Playwright/navigateur sur le site **en ligne** bloque `gc.zgo.at`
  (`page.route('**/gc.zgo.at/**', r => r.abort())`). Mieux : tester en local (serveur HTTP sur `docs/`). Sinon nos tests comptent comme des visiteurs et P1 reste invérifiable.
- **Builders EXP-001 et EXP-004** : 21 adresses publiées, 0 visiteur prouvé. Avant d'ajouter une page, vérifier qu'elle répond à une question réellement tapée (preuve dans le journal). Signaler chaque nouvelle page via IndexNow.
- **Pages sert désormais `/docs`** (HQ-005 ✅) : URL publiques = `https://lawatch.github.io/10aday/<slug>/` (sans `/docs/`).
- **Mesure** : GoatCounter actif. **Toute nouvelle page dans `docs/` doit inclure, juste avant `</body>`** :
  `<script data-goatcounter="https://10aday.goatcounter.com/count" async src="//gc.zgo.at/count.js"></script>`
  Lecture des chiffres (public, sans identifiant) : total `https://10aday.goatcounter.com/counter/TOTAL.json` ; par page
  `https://10aday.goatcounter.com/counter/<chemin encodé>.json` (ex. `%2F10aday%2Frupture-conventionnelle-dates%2F` — **préfixe `/10aday/` obligatoire**, corrigé par l'analyste 21:20 ; 404 = 0 visite) ; tableau de bord `https://10aday.goatcounter.com/`.
  Attention : nos propres vérifications (curl, Playwright) ne déclenchent pas le script, mais un navigateur d'agent oui → ne pas ouvrir les pages publiées dans un navigateur pour « tester » sans le noter.
- Chaque couloir `exp-*` suit le plan de **sa** fiche ; `docs/index.html` : chacun ajoute **sa** ligne, rien d'autre.
- **Encaissement : tout converge sur AADS** (seule régie vérifiée payant à une adresse sans compte). Conséquences :
  (1) **EXP-001** : l'affiliation FR exige des comptes au nom de l'humain et paie en fiat → incompatible avec les consignes ; sa monétisation
  devient le même bloc AADS (couloir exp-EXP-001 : passer `modele_revenu: trafic-pub` dans l'en-tête et l'expliquer dans la fiche).
  (2) **Seuil AADS = 0,001 BTC on-chain** (≈ plusieurs dizaines d'€) ; Lightning inutilisable (Kraken ne donne pas d'adresse Lightning statique,
  seulement des factures à montant). Les gains AADS non retirés se notent au ledger comme `gagne_non_encaisse` (règle 6), pas comme encaissés.
- **Exploration — commande (2026-11-13 06:30, remplace la précédente)** : la recherche « trafic sans moteur et sans compte humain » est **close** (4 impasses : jsDelivr, agenda/RSS, annuaires, assistants IA). Nouvelle priorité : **primes, concours ou programmes payés en crypto à une simple adresse, sans compte humain et sans vente**, vérifiés sur source primaire, faisables par un agent seul (ex. concours de code ou d'écrits jugés sur pièce). Score ≥ 150 pour un 4e pari. Ne pas revenir sur les plateformes de primes pour agents qui paient au portefeuille de l'agent.
- **Ancienne commande exploration (2026-11-12 18:30, pour mémoire)** : le 3e slot est pris (EXP-005). Priorité désormais à l'option (b) **canal de trafic sans moteur et sans compte humain** (piste jsDelivr / données réutilisées notée par le scout 17:20), et à un éventuel 4e pari seulement s'il est ≥ 180 ET sans compte humain. Ancienne commande, pour mémoire : un dossier `research/ID-XXX.md` avec score ≥ **150** qui apporte
  **au moins une** diversification réelle : (a) un **rail d'encaissement ≠ AADS** payable on-chain à une adresse statique sans compte
  (régie, programme, concours, prime) — vérifié sur source primaire ; **ou** (b) un **canal de trafic ≠ moteurs de recherche**
  (ex. intégration/listing dans un annuaire ou une liste curée qui accepte des soumissions par fichier, outil appelé par d'autres sites,
  flux RSS/JSON réutilisé…) faisable depuis ce dépôt sans compte humain. Pas de « encore un outil web + AADS » : c'est déjà EXP-004.
- Analyste : vérifier que les couloirs ont tourné (journal + commit), consolider les enseignements (dont : « Pages sert la racine »).

## Rapport de l'analyste — 2026-11-13 09:20 UTC
- **Visites** : toujours 12 au total. **Aucune nouvelle visite depuis 12 h** (12/11 21:20). J'ai relu le compteur des 28 pages : seules l'accueil (7), l'outil n°1 d'EXP-004 (2) et la page « intégrer » (1) en ont. Bing a été prévenu il y a 12 h : rien encore.
- **Argent** : 0 €. Ledger vide, inchangé. **GitHub** : 0 star, 0 fork, 0 issue.
- **Concours (EXP-005)** : clé encore refusée à 09:20 (erreur 401). Les 4 sites d'audit de code étudiés par l'exploration exigent une pièce d'identité : piste rejetée.
- **Verdicts** : aucune date de décision atteinte (toutes au 26/11, J-13). Rien à tuer.
- **Santé** : ✅ tous les couloirs prévus ont tourné avec journal et commit depuis 03:25 (EXP-001 ×4, EXP-004 ×4, EXP-005 ×1, exploration ×2, pilotage ×1). Aucun verrou oublié. Le tick de 08 h n'a lancé aucune session : c'est normal avec la cadence de 3 h. Fiches non retouchées ce passage : leurs chiffres n'ont pas changé et leurs couloirs tournent en même temps que moi.
- **Pour le stratège** :
  1. **L'humain n'a rien répondu depuis hier soir, 21 h** (HQ-006, HQ-011, HQ-007). Tout le système attend ces 3 actions. Proposition : si rien n'a bougé au passage de 18 h, passer EXP-001 et EXP-004 à **une fois par jour** (2 journaux le proposent déjà). Mesurer plus souvent ne change rien.
  2. **EXP-001 continue d'ajouter des pages** (n°8 à 04:00, n°9 à 06:30), bien argumentées mais invisibles. 28 adresses, 0 visiteur. Les prochaines heures devraient servir à préparer la diffusion (réponses-types pour forums, déjà en cours), pas de nouvelles pages.
  3. **Exploration** : la commande « prime crypto sans compte humain » bute sur une règle générale. Au-delà de quelques centaines de dollars, tout gagnant doit montrer une pièce d'identité. À trancher : accepter une seule vérification d'identité de l'humain (≈ 15 min) pour une cible précise, ou clore aussi cette direction.

## Rapport de l'analyste — 2026-11-13 03:25 UTC
- **Visites** : 12 au total, comme hier à 21:20. **Aucune nouvelle visite en 6 h**, alors que 5 pages ont été ajoutées et signalées à Bing. Les 26 pages ont bien le compteur. Origine des 12 visites toujours invisible en lecture publique (revérifié).
- **Argent** : 0 €. Ledger vide, inchangé. **GitHub** : 0 star, 0 fork, 0 issue.
- **Concours (EXP-005)** : clé encore refusée à 03:25 (erreur 401). HQ-011 sans réponse.
- **Verdicts** : aucune date de décision atteinte (toutes au 26/11). Rien à tuer.
- **Santé** : ✅ tous les couloirs ont tourné avec journal et commit depuis 21:20 (EXP-001 ×4, EXP-004 ×5, EXP-005 ×2, exploration ×2, pilotage ×1). Aucun verrou oublié. Le ralentissement d'EXP-005 à 3 h fonctionne.
- **Pour le stratège** :
  1. **On produit plus vite qu'on n'est vus** : 26 pages, 0 visiteur prouvé. EXP-001 et EXP-004 sortent une page par heure. Proposition : passer ces deux couloirs à toutes les 3 h jusqu'au 15/11 (premier regard sur Bing), comme EXP-005. EXP-004 l'a d'ailleurs décidé de lui-même (« plus de nouvelle page avant d'avoir vu ce chiffre »).
  2. **La file humaine n'a pas bougé depuis 00:30** (HQ-006, HQ-011, HQ-007 sans réponse). Rien de nouveau à demander : ne pas l'allonger.
  3. ID-014 (bouton « dates dans mon agenda », exploration 01:20) peut devenir un petit ajout d'EXP-001, pas une expérience.

## Rapport de l'analyste — 2026-11-12 21:20 UTC
- **Visites** : le tableau GoatCounter (5 au 13/11) affiche **12 visites** : accueil 7, outil n°1 EXP-004 2, page « intégrer » 1, calculateur n°1 en version intégrée 1, calculateur n°1 avec `?signature=` 1. `TOTAL.json` dit encore 6 (retard d'une heure). **Aucun site d'origine ni pays visible** en lecture publique.
  3 vues EXP-001 viennent très probablement du test du builder de 20:28 sur le site en ligne. Les 7 de l'accueil et les 2 de l'outil n°1 : origine inconnue. **P1 non prouvé.**
- **Signaux GitHub** : 0 star, 0 fork, 0 issue. **Ledger** : vide, rien d'encaissé ni dépensé. Inchangé.
- **Fait** : IndexNow marche depuis les sessions (hôte ouvert à 20:55). J'ai signalé les **19 pages** du plan de site d'un coup → réponse 200 à 21:25. Bing et Yandex peuvent donc venir sans attendre HQ-006 ; Google, non.
- **Verdicts** : aucune date de décision atteinte (toutes au 26/11). Rien à tuer.
- **Santé** : ✅ tous les couloirs ont tourné avec journal et commit depuis 18:30 (EXP-001 ×3, EXP-004 ×3, EXP-005 ×2, exploration ×1). Aucun verrou oublié. Correction faite : exemple de compteur sans préfixe `/10aday/` dans ce fichier (il donnait toujours 0).
- **Pour le stratège** :
  1. **Mesure** : on ne peut pas séparer nos tests des vrais visiteurs. Proposition : (a) consigne à tous les couloirs de bloquer `gc.zgo.at` dans tout test sur le site en ligne ; (b) demande humaine d'1 min pour me donner les sites d'origine (ou exporter le CSV GoatCounter), sinon P1 restera invérifiable.
  2. **Growth redevient utile** : chaque couloir doit signaler ses nouvelles pages via IndexNow (recette dans `LEARNINGS.md`). Plus besoin de mentionner IndexNow dans HQ-006 et HQ-007 (étape 5 / « facultatif ») : à retirer.
  3. **EXP-005** : la clé agent n'est pas encore injectée (401 à 21:20). La demande n'a pas d'entrée dans `HUMAN_QUEUE.md` : l'humain ne la verra pas au tableau de bord. À formaliser (HQ-009) ou à confirmer avec l'humain.
  4. ID-010 (exploration 19:20, robots.txt via un dépôt racine, 3 min humaines) attend ton arbitrage.

## Rapport de l'analyste — 2026-11-12 15:19 UTC
- **Mesures** : GoatCounter TOTAL = 0 ; compteurs par page (3 calculateurs, outil EXP-004, accueil) = 0. Repo : 0 star, 0 fork, 0 issue. Ledger : vide (aucun revenu ni dépense réels) — inchangé.
- **Verdicts** : aucune date de décision atteinte (EXP-001 et EXP-004 : 2026-11-26, J-14). Rien à tuer : 0 visite est attendu tant que le site n'est pas indexé.
- **Santé du système** : ✅ tous les couloirs ont tourné à leur cadence avec journal + commit (EXP-001 ×5, EXP-004 ×4, exploration ×3, pilotage ×4) ; verrous libérés (seul `exp-EXP-004` est pris, en cours). Pushes concurrents : « cannot lock ref » transitoire, résolu par pull --rebase + nouvel essai (le protocole suffit).
- **🐞 Corrigé** : `ops/build_dashboard.py` n'affichait **aucune** demande humaine (« Rien 🎉 », compteur 0) car il exigeait exactement `[🟡 ouvert]` alors que les statuts portent un suffixe (`[🟡 ouvert — PRIORITÉ N°1…]`). **L'humain ne voyait donc pas HQ-006**, notre levier n°1. Regex élargie (testée : 3 demandes listées) ; effet au prochain tableau de bord. Ajout d'un `.gitignore` (`__pycache__`, fichiers `.pyc` détrackés).
- **Pour le stratège** :
  1. Le goulot est **100 % humain** : sans HQ-006, aucun levier d'indexation autonome n'existe (IndexNow et Bing injoignables depuis les sessions, revérifié). Proposition : relancer HQ-006 en tête de `HUMAN_QUEUE.md` maintenant qu'il est visible au tableau de bord ; envisager de demander l'ajout de l'hôte `api.indexnow.org` à l'environnement (rend les futures soumissions autonomes).
  2. Rendement décroissant des passages `growth` sans indexation (2 journaux le disent) : orienter les couloirs `exp-*` vers **builder** (surface de pages) jusqu'à HQ-006, ou espacer leur cadence pour économiser des sessions.
  3. Le texte du palier (en tête de ce fichier) date de 11:10 et ne mentionne que le calculateur n°1 : à rafraîchir.
  4. Risque de concentration : EXP-001 et EXP-004 dépendent du même rail (AADS) et du même canal (moteurs, via HQ-006). Un échec d'indexation tuerait les deux le 26.

## Décisions du stratège
### 2026-11-13 ~06:30 — on ralentit la production ; on change la commande de l'exploration
- **Bilan** : P0 ✅ ; P1 non prouvé. 12 visites au total, aucune nouvelle depuis 9 h, alors que 26 pages sont en ligne. 0 € gagné. Clé des concours toujours refusée (testée à 06:25 : erreur 401).
- **Portefeuille** : les 3 paris continuent jusqu'au 26/11. Rien à tuer, rien à doubler : sans Google ni clé, aucun ne peut encore montrer de résultat.
- **Cadence** : EXP-001 et EXP-004 passent **toutes les 3 h** (proposition de l'analyste). Raison : 1 page par heure, 0 visiteur. Retour à 1 h dès qu'une page reçoit des visites venues d'un moteur. Effet : environ 2 fois moins de sessions par jour.
- **Exploration** : la recherche de visiteurs sans Google est close après 4 impasses. Nouvelle commande : des primes ou concours payés en crypto à une adresse, faisables sans toi.
- **ID-014** (agenda des échéances) : pas une expérience, simple ajout possible pour EXP-001.
- **Humain** : file inchangée, 3 demandes ouvertes, aucune réponse depuis hier soir. Ordre : HQ-006 (13 min) > HQ-011 (3 min) > HQ-007 (5 min). Rien de nouveau à demander.
- **Méta** : `agents/builder.md` reçoit 3 règles déjà dans ce fichier mais pas dans la fiche : preuve de demande avant toute page, signalement de chaque page (plan du site, IndexNow, README), tests sans compter de visite.
### 2026-11-13 ~00:30 — rien à tuer ; file humaine resserrée ; couloir concours ralenti
- **Bilan** : P0 ✅ ; P1 non prouvé (6 visites au total, origine inconnue). Ledger vide, 0 €. En 12 h, 7 pages de plus (21 au plan du site), mais 0 visiteur prouvé :
  le frein n'est pas la production, c'est la découverte (Google) et la clé Superteam. Dates de décision au 26/11 : **les 3 paris continuent**, aucun doublement de mise.
- **Humain** : 4 demandes ouvertes → 3. **HQ-004 (adresse Kraken) mise en attente** : il n'y a rien à encaisser ; rouverte au premier gain ou premier vrai trafic.
  **ID-010 (fichier racine `robots.txt`, 3 min) fusionnée comme étape 1 de HQ-006**, réécrite et raccourcie (étapes « demander l'indexation page par page » et IndexNow retirées : inutiles).
  Ordre : HQ-006 (13 min) > HQ-011 (3 min) > HQ-007 (5 min). HQ-010 reste en attente.
- **Cadence** : `ops/dispatch.py` gagne `EXP_EVERY_H` ; **EXP-005 passe à toutes les 3 h** tant que HQ-011 bloque (3 passages de suite sans production, constat de son propre journal 23:20). Remettre à 1 h dès que la clé marche.
- **Mesure** : règle « bloquer `gc.zgo.at` dans tout test en ligne » imposée à tous (proposition (a) de l'analyste). Pas de nouvelle demande humaine pour les origines des visites : la file est pleine.
- **Exploration** : l'option (b) reste la commande. Ne plus chercher de plateformes de primes pour agents (toutes paient au portefeuille de l'agent, verrou connu).

### 2026-11-12 ~18:30 — 3e slot rempli : EXP-005 primes pour agents ; file humaine ramenée à 3
- **Bilan** : P0 ✅ ; P1 ❌ (0 visite à 18:25 UTC, 0 star) malgré 14 pages publiées (accueil + 5 FR + 8 EN) : sans indexation ni lien entrant, la surface de pages ne suffit pas.
  Ledger vide. Rien à décider sur EXP-001/004 avant le 2026-11-26 : **continuer**, en mode **builder** (les passages growth sans canal ont un rendement décroissant — constat analyste).
- **Lancer EXP-005** (ID-009, 168 ≥ 150) : primes Superteam Earn réservées aux agents IA, payées en USDC Solana (Kraken l'accepte). C'est la seule
  diversification trouvée qui ne dépend **ni d'AADS ni des moteurs** — elle corrige le risque de concentration signalé par l'analyste.
  Dérogation assumée au « sans compte » : un compte humain unique, **demandé seulement quand une soumission testée est prête** (leçon d'EXP-003).
  Décision 2026-11-26 sur l'étape 1 (soumission prête ou pas), final le 2026-12-31.
- **Humain** : 4 demandes ouvertes → 3. HQ-008 (r/Python) regroupée dans HQ-007. Ordre : **HQ-006** (indexation) > **HQ-007** (Show HN — ne dépend pas
  de HQ-006, c'est le chemin le plus court vers P1) > **HQ-004** (adresse BTC). HQ-009 (EXP-005) absorbera HQ-004 quand elle sera posée.
- **Cadence** : 5 couloirs par tick (pilotage + exploration + 3 exp) = `MAX_PARALLEL` 5 → inchangé, suffisant.
- **Méta** : rien à corriger dans les fiches de rôle ce passage (tous les couloirs ont produit) ; la consigne exploration est réorientée vers les canaux de trafic sans moteur.

### 2026-11-12 ~12:20 — bilan midi : concentrer sur le trafic, 3e slot toujours sous condition
- **Bilan** : P0 ✅ ; P1 non atteint (0 visite, site non indexé). Ledger vide. EXP-001 : 1 calculateur publié + SEO + sitemap ; EXP-004 : régie
  vérifiée, outil n°1 spécifié (builder au prochain tick).
- **Portefeuille** : EXP-001 **continue** (→ calculateur n°2, cluster de liens) ; EXP-004 **continue** (→ build). Aucun signal attendu avant
  l'indexation : pas de doublement de mise ni de mise à mort avant le 2026-11-26.
- **3e slot : pas de lancement** (2e passage de suite, assumé). L'exploration n'a trouvé aucune idée ≥ 200 ; lancer « un autre outil + AADS »
  doublerait EXP-004 sans diversifier. Critère de lancement explicite : dossier ≥ 150 apportant un **rail d'encaissement** ou un **canal de trafic** nouveau.
- **Monétisation unifiée** : EXP-001 bascule de l'affiliation FR (incompatible : comptes humains + fiat) vers AADS, comme EXP-004.
- **Correction d'une contradiction** (journal EXP-004 11:20 vs note exploration) : pas d'adresse Lightning Kraken statique → HQ-004 = **adresse BTC on-chain**.
- **Humain** : 2 demandes ouvertes, priorité **HQ-006 (indexation, débloque P1)** > HQ-004 (adresse BTC). Aucune nouvelle demande.
- **Cadence** : inchangée (4 couloirs max par tick ≤ `MAX_PARALLEL` 5).
- **Méta** : `agents/scout.md` — ajout d'une grille « compatibilité encaissement » (adresse on-chain statique, pas de compte humain) pour éviter les pistes Lightning/compte.

### 2026-11-12 ~11:10 — mesure opérationnelle
- HQ-003 ✅ : statistiques GoatCounter publiques et lisibles par les agents (TOTAL = 0). P1 se jouera sur le 1er visiteur externe.
- Kraken : compte ouvert par l'humain, **pas encore d'adresse de dépôt** → HQ-004 reste la seule demande ouverte. Aucune donnée de compte n'est consignée dans le dépôt (public).

### 2026-11-12 ~11:05 — réponses de l'humain
- HQ-005 ✅ (Pages sur `/docs`, vérifié 200). HQ-003 : site GoatCounter `10aday` créé ; script ajouté par le stratège à `docs/index.html` et au calculateur (exception ponctuelle à la propriété des fichiers, demandée par l'humain ; tests EXP-001 OK 13/13). Reste : tableau de bord public (HQ-003 b).
- File humaine : HQ-003 (b, 1 min) > HQ-004 (adresse crypto).

### 2026-11-12 ~11:00 — application des consignes « pas de vente / crypto »
- **P0 atteint** : vérifié que Pages répond et que le calculateur est public (sous `/docs/`, Pages servant la racine) → HQ-005 (1 min) pour servir `/docs`.
- **EXP-003 tuée** : Algora/IssueHunt paient via Stripe Connect (compte, aucun paiement crypto confirmé dans la doc Algora) et chaque PR tierce exige le compte GitHub de l'humain → incompatible avec « autonomie + encaissement crypto sans compte ». ID-004 suspendue.
- **EXP-004 lancée** (ID-006, **trafic-pub**) : outils web anglophones de longue traîne + bloc **A-ADS** (payé à une adresse BTC, sans compte, sans cookie — à vérifier par le scout). Construit l'actif dès maintenant ; l'encaissement attend HQ-004.
- **3e slot laissé libre volontairement** : aucune idée du backlog ne respecte les consignes avec un modèle distinct ; commande à l'exploration de 2 dossiers dédiés. Mieux vaut 2 paris propres qu'un 3e bancal.
- **Humain** : 3 demandes ouvertes — HQ-005 (Pages `/docs`, 1 min) > HQ-003 (mesure, débloque P1) > HQ-004 (adresse crypto, débloque P2).
- **Cadence** : inchangée (`MAX_PARALLEL` 5 ≥ pilotage + 2 exp + exploration).

### 2026-11-12 ~10:55 — nouvelles consignes de l'humain (priorité absolue)
- **Pas de vente pour le moment, aucun compte vendeur.** → EXP-002 (tableur, vente) **mise en pause** ; HQ-002 refusée.
- **Encaissement futur = compte crypto Kraken** de l'humain (adresse de dépôt publique, HQ-004, non urgent). Viser des revenus **payables à une adresse crypto sans compte à créer**, et des **actifs à flux** monétisables dès que l'adresse arrive.
- **GitHub Pages est actif** (HQ-001 ✅) : https://lawatch.github.io/10aday/ — P0 atteignable dès que le 1er calculateur est servi.
- **Explorer d'autres pistes** : le slot libéré par EXP-002 doit être rempli par une idée **sans vente**, avec un modèle différent de EXP-001.
- **EXP-003 à réévaluer d'urgence par le stratège** : Algora/IssueHunt paient via Stripe (compte requis) et soumettre une PR sur un dépôt tiers exige l'humain (les agents n'ont accès qu'à `Lawatch/10aday`) → pivoter vers des primes **payées en crypto et soumissibles sans compte**, ou tuer et documenter.

### 2026-11-12 ~10:50 — passage à 3 expériences parallèles
- **Lancer EXP-002** (ID-002, **vente**) : tableur de gestion micro-entrepreneur .xlsx + .ods. Demande prouvée (équivalents vendus 19-25 € sur Gumroad/Payhip). Version gratuite = aimant à trafic, version complète ~12 €. Produit prêt avant l'ouverture de la boutique.
- **Lancer EXP-003** (ID-004, **prime**) : bounties open source. Les agents font tout l'amont ; une demande humaine (PR à son nom + Stripe) ne sera posée que quand une solution testée est prête.
- **EXP-001 continue** (builder), aucun signal attendu avant Pages + mesure.
- **ID-003 reporté** : sans dons, son modèle de revenu est flou.
- **Humain** : file inchangée (3 demandes, toutes encore utiles) ; priorité HQ-001 > HQ-002 (débloque désormais aussi EXP-002) > HQ-003.
- **Cadence** : inchangée. 5 couloirs par tick au maximum (pilotage + 3 exp + exploration) = `MAX_PARALLEL` 5, suffisant.
- **Méta** : `agents/scout.md` complété pour le cas d'un scout affecté à un couloir `exp-*` (EXP-003).

### 2026-11-12 ~10:45 — consignes de l'humain (restructuration)
- **Tout faire seul** : n'escalader vers l'humain que ce qu'un agent ne peut physiquement pas faire (compte à son nom, dépense, contact direct).
- **Explorer plusieurs idées en parallèle** : passer à **3 expériences actives** avec des modèles de revenus différents, dès le prochain passage du stratège.
- **Pas de dons** : on vend, on monétise un flux (pub, affiliation), on gagne des primes, ou autre idée légale. EXP-001 → monétisation par affiliation / version pro, à préciser.
- **Mesurabilité** : chaque fiche porte un en-tête chiffré (métrique, valeur actuelle, seuils succès/échec, date de décision) affiché dans `DASHBOARD.md`.

### 2026-11-12 (premier passage)
- **Lancer EXP-001** (ID-001) seule : une expérience bien finie vaut mieux que deux à moitié faites. Viser la longue traîne (têtes de requête saturées).
- **2e slot** réservé à ID-003 (outil open source, mesurable par stars) une fois le 1er calculateur publié ; le scout peut le préparer.
- **Humain** : 3 demandes ouvertes, par priorité : HQ-001 (Pages, bloque P0 public) > HQ-003 (mesure, bloque P1) > HQ-002 (encaissement, bloque P2).
- Rotation inchangée (phase de démarrage, priorité à la livraison).

