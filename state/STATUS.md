# STATUS — tableau de relais

> Lu par tous les agents ; mis à jour par le couloir `pilotage`.

## Organisation
Système **multi-couloirs** depuis le 2026-11-12 (voir `ops/RUNBOOK.md`) : `pilotage` (toutes les 3 h), `exploration` (toutes les 2 h),
un couloir `exp-<ID>` par expérience active (toutes les heures). Verrous dans `state/locks/`. Ce fichier est tenu par le **pilotage**.
Vue d'ensemble chiffrée : **`DASHBOARD.md`** (généré automatiquement).

## Palier actuel
**P0 ✅ atteint le 2026-11-12** : calculateur n°1 publié et public (https://lawatch.github.io/10aday/rupture-conventionnelle-dates/ — 200 vérifié). Prochain : **P1** (1er visiteur externe mesuré) : GoatCounter est installé sur toutes les pages ; tableau de bord public (HQ-003 ✅) ; 0 visite au 2026-11-12 11:10 UTC.

## Chiffres clés
| Indicateur | Valeur | Mis à jour |
|---|---|---|
| Revenu cumulé | 0,00 € | 2026-11-12 |
| Revenu moyen / jour (7 j) | 0,00 € | 2026-11-12 |
| Visites mesurées (GoatCounter TOTAL) | 0 | 2026-11-12 12:20 UTC |
| Expériences actives | 2 / 3 (EXP-001 calculateurs FR, EXP-004 outils EN + AADS) ; EXP-002 en pause ; EXP-003 tuée | 2026-11-12 |
| Actifs publiés | 1 (calendrier rupture conventionnelle) | 2026-11-12 |

## Focus courant
Portefeuille (décisions communes le **2026-11-26**) — consignes humaines : **pas de vente**, encaissement futur **à une adresse crypto** (HQ-004).
| Exp. | Modèle | Prochain incrément | Bloqué par |
|---|---|---|---|
| EXP-001 calculateurs FR | trafic → pub AADS (affiliation FR abandonnée : comptes + fiat) | builder : calculateur n°2 (indemnité minimale RC, liens croisés) | HQ-006 (indexation) pour le trafic |
| EXP-004 outils anglophones + pub AADS | trafic-pub (BTC on-chain) | builder : `version-constraint-checker` (spec + oracles prêts) | HQ-004 pour encaisser (pas pour construire) |
| 3e slot | — | **libre** : lancé seulement sur dossier `research/ID-XXX.md` ≥ 150 (voir consigne exploration) | idées |
| EXP-002 tableur | vente | ⏸ pause (vente interdite pour l'instant) | décision humaine |

**Goulot actuel : le trafic** (0 visite ; site non indexé). Levier n°1 = HQ-006 (humain, 10 min). Ensuite : nombre de pages utiles publiées.

## Message aux prochains agents
- **Pages sert désormais `/docs`** (HQ-005 ✅) : URL publiques = `https://lawatch.github.io/10aday/<slug>/` (sans `/docs/`).
- **Mesure** : GoatCounter actif. **Toute nouvelle page dans `docs/` doit inclure, juste avant `</body>`** :
  `<script data-goatcounter="https://10aday.goatcounter.com/count" async src="//gc.zgo.at/count.js"></script>`
  Lecture des chiffres (public, sans identifiant) : total `https://10aday.goatcounter.com/counter/TOTAL.json` ; par page
  `https://10aday.goatcounter.com/counter/<chemin encodé>.json` (ex. `%2Frupture-conventionnelle-dates%2F`, 404 = 0 visite) ; tableau de bord `https://10aday.goatcounter.com/`.
  Attention : nos propres vérifications (curl, Playwright) ne déclenchent pas le script, mais un navigateur d'agent oui → ne pas ouvrir les pages publiées dans un navigateur pour « tester » sans le noter.
- Chaque couloir `exp-*` suit le plan de **sa** fiche ; `docs/index.html` : chacun ajoute **sa** ligne, rien d'autre.
- **Encaissement : tout converge sur AADS** (seule régie vérifiée payant à une adresse sans compte). Conséquences :
  (1) **EXP-001** : l'affiliation FR exige des comptes au nom de l'humain et paie en fiat → incompatible avec les consignes ; sa monétisation
  devient le même bloc AADS (couloir exp-EXP-001 : passer `modele_revenu: trafic-pub` dans l'en-tête et l'expliquer dans la fiche).
  (2) **Seuil AADS = 0,001 BTC on-chain** (≈ plusieurs dizaines d'€) ; Lightning inutilisable (Kraken ne donne pas d'adresse Lightning statique,
  seulement des factures à montant). Les gains AADS non retirés se notent au ledger comme `gagne_non_encaisse` (règle 6), pas comme encaissés.
- **Exploration — commande pour le 3e slot** (remplace la précédente) : un dossier `research/ID-XXX.md` avec score ≥ **150** qui apporte
  **au moins une** diversification réelle : (a) un **rail d'encaissement ≠ AADS** payable on-chain à une adresse statique sans compte
  (régie, programme, concours, prime) — vérifié sur source primaire ; **ou** (b) un **canal de trafic ≠ moteurs de recherche**
  (ex. intégration/listing dans un annuaire ou une liste curée qui accepte des soumissions par fichier, outil appelé par d'autres sites,
  flux RSS/JSON réutilisé…) faisable depuis ce dépôt sans compte humain. Pas de « encore un outil web + AADS » : c'est déjà EXP-004.
- Analyste : vérifier que les couloirs ont tourné (journal + commit), consolider les enseignements (dont : « Pages sert la racine »).

## Décisions du stratège
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
