# Backlog d'idées

Score **ICE** (1-10 chacun) : **I**mpact (potentiel €/jour à terme) × **C**onfiance (preuves de demande) × **E**ase (facilité avec nos contraintes : 0 €, pas de compte, IA).
Score = I × C × E (max 1000). Toujours citer les sources des preuves.

## Actives
- ID-001 → **EXP-001** (lancée le 2026-11-12, affiliation). Voir `state/experiments/EXP-001-calculateurs-fr.md`.
- ID-006 → **EXP-004** (lancée le 2026-11-12, trafic-pub payée en BTC via A-ADS). Voir `state/experiments/EXP-004-outils-dev-pub-crypto.md`.
- En pause : ID-002 → EXP-002 (vente suspendue par l'humain). Tuée : ID-004 → EXP-003 (Stripe + PR au nom de l'humain).

_(voir `state/experiments/`)_

## Candidates
| ID | Idée | Revenu | I | C | E | Score | Sources / notes |
|---|---|---|---|---|---|---|---|
| ID-001 | Suite d'outils web gratuits ultra-ciblés (ex : calculateurs fiscaux/administratifs FR — micro-entreprise, frais kilométriques, TVA…) sur GitHub Pages, SEO longue traîne | Affiliation / pub / version pro | 6 | 5 | 8 | 240 | **Lancée → EXP-001.** 2026-11-12 : têtes de requête saturées (« simulateur frais kilométriques » : PayFit, Qonto, Legisocial…) → viser la longue traîne. 2026-11-12 scout : 1er outil = calendrier de rupture conventionnelle ; n°2 = indemnité minimale RC (lien croisé) |
| ID-002 | Packs de templates/checklists numériques (Notion, tableurs, modèles de docs) vendus à petit prix | Vente (Gumroad/Lemon Squeezy) | 6 | 6 | 7 | 252 | **Lancée → EXP-002** (tableur micro-entrepreneur). Preuve : tableurs équivalents vendus 19 € (Gumroad) et 24,90 € (Payhip), WebSearch 2026-11-12 |
| ID-003 | Outil/bibliothèque open source qui résout un irritant développeur fréquent | Version pro / services (dons exclus) | 4 | 4 | 7 | 112 | Graine — chercher les issues/questions récurrentes. Reporté : modèle de revenu flou (pas de dons) — scout à revaloriser avec un mécanisme payant concret |
| ID-004 | Bounties open source légitimes (Algora, IssueHunt, programmes de bug bounty OSS) | Prime ponctuelle | 5 | 5 | 1 | 25 | **Suspendue** (EXP-003 tuée le 2026-11-12 : paiement Stripe, PR au nom de l'humain). À rouvrir seulement pour des primes payées en crypto sans compte. Ancien : lancée → EXP-003 (3e modèle de revenu, diversification). PR sous le compte de l'humain + Stripe : demande humaine quand une bounty est prête |
| ID-006 | Petits outils web **anglophones** de longue traîne (public mondial tech) avec bloc pub **A-ADS** payé à une adresse BTC sans compte | Trafic → pub crypto | 5 | 4 | 7 | 140 | **Lancée → EXP-004** (stratège, 2026-11-12). A-ADS sans compte d'après des revues tierces (influencermarketinghub, ucompares) — à vérifier sur a-ads.com 2026-11-12 15:20 scout : **économie calibrée** (`research/NOTE-economie-aads.md`) : CPM moyen réseau 0,04 $ (source aads.com) ⇒ ~290 000 pages vues/jour pour 10 €/j et ~2 M d'affichages avant le 1er paiement on-chain (0,001 ₿). AADS = preuve de P2 (via Lightning, décision humaine), pas moteur. **Ne plus lancer d'autre slot « outil + AADS ».** |
| ID-007 | **Primes Lightning (bounties en sats)** sur tableaux ouverts (Lightning Bounties, bounty.ninja/Nostr+Cashu, Sattest) : les agents préparent la solution dans ce dépôt, l'humain réclame | Prime ponctuelle (crypto) | 3 | 3 | 2 | 18 | 2026-11-12 scout : plateformes réelles mais (1) Lightning Bounties = PR GitHub sur dépôt tiers (compte humain) ; (2) bounty.ninja/Nostr = publier sur relais Nostr (hors réseau de session, websocket) ; (3) paiement Lightning ≠ adresse statique Kraken (dépôt Lightning Kraken = facture à montant généré par l'humain à chaque fois). Hôtes injoignables depuis les sessions (ENOTFOUND). À rouvrir seulement si l'humain accepte ~5 min/prime. Sources : https://www.lightningbounties.com/ , https://bounty.ninja/ , https://github.com/bitgane/sattest , https://support.kraken.com/articles/multiple-networks-and-methods-on-kraken |
| ID-008 | **Calculateurs « à intégrer »** (iframe gratuit + lien de crédit visible) sur les sites tiers : canal référents/embeds ≠ moteurs | Trafic → pub AADS (sur nos pages) | 4 | 4 | 8 | 128 | 2026-11-12 13:30 scout : dossier `research/ID-008-widgets-integrables.md`. Pratique courante (LeFreelance, NetSalaire, Calculover, Hagnere) mais aucune donnée d'adoption ; adoption surtout par prospection (humain). **< 150 → pas un 3e slot** ; à proposer comme incrément growth d'EXP-001 |
| ID-005 | Site de contenu de niche evergreen (guides pratiques comparatifs) | Affiliation | 7 | 4 | 5 | 140 | Graine — long à faire monter, nécessite programme d'affiliation |

## Rejetées
| Idée | Raison |
|---|---|
| Trading / crypto spéculatif | Interdit par la charte (règle 3) |
| Fermes de contenu / spam SEO | Interdit (règles 1-2) et pénalisé par les moteurs |
| Tout modèle basé sur les dons (Ko-fi tips, Sponsors, Patreon) | Exclu par l'humain le 2026-11-12 |
| Vente via une plateforme (Gumroad, Lemon Squeezy, boutique…) | **Suspendue** par l'humain le 2026-11-12 (« pas de vente pour le moment ») — ID-002 et EXP-002 en attente |
| Versement libératoire vs barème (calculateur) | 2026-11-12 scout : concurrence forte (Urssaf officiel, Abby, sum.money…) + règles annuelles. Réévaluer seulement sur un angle très précis. |
| Frais réels vs abattement 10 % (calculateur) | 2026-11-12 scout : concurrence forte (Selexium, moicombien, swapn…). |
| Franchise TVA / date de dépassement (calculateur) | 2026-11-12 scout : règle instable (réforme PLF 2026, seuils contradictoires selon les sources) → risque d'erreur trop élevé pour l'instant. |
| Affiliation d'échangeurs crypto sans KYC (SideShift 0,5 % via `affiliateId`, ChangeNOW 0,4 %, Changelly, Trocador) | 2026-11-12 scout : techniquement payable sans compte humain (SideShift crée un compte anonyme par navigateur ; gains crédités en **jeton XAI**/USDT puis retrait vers une adresse — https://docs.sideshift.ai/api-intro/monetization/ , https://help.sideshift.ai/en/articles/6003432-which-token-are-my-earned-fees-accrued-in ). **Rejeté** : (a) inciter un public UE/FR vers des prestataires crypto non enregistrés PSAN/MiCA = risque juridique (l'AMF demande de ne passer que par sa liste blanche : https://www.amf-france.org/fr/actualites-publications/actualites/lamf-alerte-les-epargnants-sur-limportance-de-consulter-la-liste-blanche-des-prestataires-de ) ; (b) le revenu dépend du volume d'échanges = pousse à la spéculation (esprit règle 3) ; (c) gains dans un jeton maison. |
| Minage navigateur (Monero dans la page, type ex-Coinhive) | Consomme le CPU des visiteurs ; même « opt-in », image de cryptojacking, revenus quasi nuls, bloqué par les antivirus/navigateurs → règle 1 (honnêteté). |
| Brave Creators (BAT) | Exige un compte + KYC via un dépositaire (Uphold/Gemini) au nom de l'humain ; revenus = pourboires (dons exclus). |
| Récompenses Stacker News / Hive (publier pour gagner des sats) | Revenus = votes/zaps assimilables à des pourboires ; publication IA sur plateforme tierce = risque spam (règle 2) ; hôtes hors réseau de session. |
| Autres régies crypto « sans compte » (Coinzilla, Bitmedia, HypeLab, Cointraffic, Adshares) | 2026-11-12 13:30 scout, sources primaires : toutes exigent un **compte éditeur** (Coinzilla : compte + min. 50 € https://coinzilla.com/faq-publishers/ ; Bitmedia : demande éditeur depuis un compte, min. 0,01 BTC https://bitmedia.io/become-a-publisher ; HypeLab : seuil 50 $, mensuel https://www.hypelab.com/terms-and-conditions ; Adshares : compte sur un adserver https://docs.adshares.net/adserver/how-to-use-advertising-ecosystem.html ). Les mentions « sans KYC » des revues concernent les **annonceurs**. → **AADS reste le seul rail pub sans compte.** |
