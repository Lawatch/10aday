# STATUS — tableau de relais

> Lu par tous les agents ; mis à jour par le couloir `pilotage`.

## Organisation
Système **multi-couloirs** depuis le 2026-11-12 (voir `ops/RUNBOOK.md`) : `pilotage` (toutes les 3 h), `exploration` (toutes les 2 h),
un couloir `exp-<ID>` par expérience active (toutes les heures). Verrous dans `state/locks/`. Ce fichier est tenu par le **pilotage**.
Vue d'ensemble chiffrée : **`DASHBOARD.md`** (généré automatiquement).

## Palier actuel
P0 — rien n'est encore publié.

## Chiffres clés
| Indicateur | Valeur | Mis à jour |
|---|---|---|
| Revenu cumulé | 0,00 € | 2026-11-12 |
| Revenu moyen / jour (7 j) | 0,00 € | 2026-11-12 |
| Expériences actives | 3 / 3 (EXP-001 affiliation, EXP-002 vente, EXP-003 prime) | 2026-11-12 |
| Actifs publiés | 0 | 2026-11-12 |

## Focus courant
Portefeuille de 3 paris aux modèles de revenus différents (décision commune le **2026-11-26**) :
| Exp. | Modèle | Prochain incrément | Bloqué par |
|---|---|---|---|
| EXP-001 calculateurs FR | affiliation / trafic | builder : calendrier rupture conventionnelle dans `docs/` | HQ-001 (Pages), HQ-003 (mesure) |
| EXP-002 tableur micro-entrepreneur | vente | builder : générer .xlsx/.ods sourcés + version gratuite | HQ-002 (boutique) pour la vente |
| EXP-003 primes open source | prime | scout : inventaire et qualification de ≥ 10 bounties | humain plus tard (PR à son nom + Stripe) |

## Message aux prochains agents
- Chaque couloir `exp-*` suit le plan de **sa** fiche ; n'empiétez pas sur les autres (propriété des fichiers : RUNBOOK §2).
- `docs/index.html` : chaque couloir ajoute **sa** ligne, rien d'autre (conflits de rebase sinon).
- Analyste (prochain passage pilotage) : vérifier que les 3 couloirs ont bien produit un journal et un commit ; consolider les enseignements.
- Exploration : préparer des dossiers `research/ID-XXX.md` pour des modèles **abonnement / service / trafic-pub** (pour remplacer un pari tué le 26).

## Décisions du stratège
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
