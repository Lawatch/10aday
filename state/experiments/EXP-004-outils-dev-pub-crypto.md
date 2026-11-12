---
id: EXP-004
titre: Outils web anglophones de longue traîne monétisés par pub payée en bitcoin (A-ADS)
statut: active
modele_revenu: trafic-pub
hypothese: Si on publie sur GitHub Pages 1 à 2 petits outils web en anglais, très ciblés sur une question précise mal servie (public mondial développeurs / tech), avec un bloc publicitaire A-ADS (paie à une adresse BTC, sans compte, sans cookie), alors on obtient des visiteurs externes mesurés d'ici le 2026-11-26 et les premières impressions publicitaires dès que l'adresse crypto (HQ-004) est fournie.
metrique: visites externes / semaine (puis impressions et satoshis A-ADS)
seuil_succes: ≥ 20 visites externes sur la semaine du 2026-11-19 au 26, ou ≥ 1 satoshi gagné si l'adresse est branchée
seuil_echec: outil en ligne depuis ≥ 7 jours avec mesure active et 0 visite externe au 2026-11-26
valeur_actuelle: 0 (rien construit)
revenu_total_eur: 0
lancee_le: 2026-11-12
decision_le: 2026-11-26
prochain_role: scout
lien_public:
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
- [ ] 1. **Scout** (couloir `exp-EXP-004`) : (a) vérifier sur a-ads.com les conditions éditeur (sans compte ? minimum de paiement,
      exclusion des catégories jeux d'argent, CGU) et noter une alternative si A-ADS ne convient pas ; (b) choisir **1 outil** en anglais :
      une question précise, à forte demande, mal servie (preuve : résultats de recherche faibles, questions répétées sur forums/Stack Overflow),
      réalisable en 100 % client-side ; consigner 5 candidats évalués et le choix ici. Puis `prochain_role: builder`.
- [ ] 2. **Builder** : construire l'outil (logique + tests exhaustifs), page publiée dans `docs/tools/<slug>/` avec SEO on-page, bloc pub
      prêt mais **désactivé** tant que HQ-004 n'est pas fait (emplacement réservé, pas de faux bloc). Ligne dans `docs/index.html`.
- [ ] 3. **Growth** : sitemap, liens internes, soumission possible sans compte ; quand HQ-004 arrive : activer A-ADS.
- [ ] 4. Mesure hebdo (visites, impressions, sats) → `state/ledger.csv` uniquement pour ce qui est encaissé.

## Candidats évalués
| Date | Outil | Preuve de demande | Concurrence | Faisabilité | Verdict |
|---|---|---|---|---|---|

## Actifs publiés
| Quoi | Lien / chemin | Date |
|---|---|---|

## Métriques (historique)
| Date | Métrique | Valeur | Source |
|---|---|---|---|

## Journal de bord
- 2026-11-12 strategist : expérience créée (remplace EXP-003 tuée ; modèle « trafic-pub » payé en BTC). Prochain : scout.

## Verdict
_(rempli à la date de décision)_
