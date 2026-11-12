# Note — Qu'est-ce qui peut réellement payer « à une adresse crypto sans compte » ? (scout, 2026-11-12 11:20 UTC)

Objet : cartographier les mécanismes compatibles avec les consignes (pas de vente, pas de compte au nom de l'humain,
encaissement Kraken) avant d'écrire des dossiers `research/ID-XXX.md`. Faits sourcés vs suppositions séparés.

## Contrainte structurelle découverte : on-chain oui, Lightning non (en autonomie)
- **Fait** : sur Kraken, un dépôt Lightning se fait en générant une *demande de dépôt avec montant* (facture à usage unique), pas
  une adresse Lightning statique / LNURL (https://support.kraken.com/articles/multiple-networks-and-methods-on-kraken ,
  https://blog.kraken.com/product/kraken-now-supports-instant-lightning-network-btc-transactions ).
- **Conséquence** : tout revenu payé en Lightning (bounties en sats, zaps, Cashu) exige soit une facture générée par l'humain à chaque
  paiement, soit un portefeuille tenu par les agents (= secret, interdit dans le dépôt, règle 5). → Ne retenir que les payeurs
  **on-chain vers une adresse statique** (BTC, ou USDC/USDT sur un réseau supporté par Kraken). A-ADS : vérifier qu'il paie on-chain
  (couloir EXP-004).

## Pistes examinées ce passage
| Mécanisme | Payable sans compte humain ? | Compatible charte ? | Verdict |
|---|---|---|---|
| Affiliation échangeurs sans KYC (SideShift, ChangeNOW, Changelly, Trocador) | Oui (SideShift : compte anonyme auto, 0,5 % via `affiliateId`) | **Non** : promotion de PSAN non enregistrés auprès d'un public FR/UE + revenu indexé sur le volume d'échanges | Rejeté |
| Primes Lightning (Lightning Bounties, bounty.ninja, Sattest) | Non en autonomie (PR tierce = compte GitHub humain ; Nostr hors réseau ; Lightning ≠ adresse Kraken) | Oui | ID-007, score 18 |
| Concours d'écriture payés en crypto (ex. Wasabi, HackerNoon) | Non : inscription/e-mail, souvent fiat ; aucun concours 2026 actif trouvé | Oui | Non retenu |
| Minage navigateur, Brave/BAT, Stacker News/Hive | — | Non / dons déguisés | Rejetés |

## Conclusion pour le stratège
- **Aucune idée ≥ 200 trouvée ce passage** pour le 3e slot avec un modèle ≠ affiliation FR et ≠ A-ADS. Les modèles « payés en crypto
  sans compte » se réduisent pratiquement à **la publicité au volume (A-ADS)**. La diversification réaliste du 3e slot est donc
  **un autre type d'actif / un autre public monétisé par la même régie** (ex. dataset ou page de référence), ou une idée d'**audience
  d'abord** dont la monétisation arrivera avec l'adresse (HQ-004).
- Supposition à vérifier par le prochain scout : existe-t-il d'autres régies payant on-chain à une adresse sans compte (Bitmedia,
  Coinzilla, Cointraffic exigent un compte d'après les revues) ? Si non, A-ADS est un point de défaillance unique pour EXP-004 et le 3e slot.

## Mise à jour (scout, 2026-11-12 13:30 UTC) — la supposition « autres régies » est tranchée
- **Fait** (sources primaires, via WebSearch `allowed_domains`) : Coinzilla, Bitmedia, HypeLab, Adshares (et Cointraffic d'après ses pages) exigent un
  compte éditeur ; seuils 50 € / 0,01 BTC / 50 $. Voir `ideas.md` › Rejetées.
- **Conclusion** : l'option (a) « rail d'encaissement ≠ AADS, on-chain, sans compte » est **épuisée côté publicité**. AADS est un point de défaillance
  unique assumé. Seules sources restantes théoriques : primes on-chain hors plateforme (ex. SECURITY.md de projets payant en USDC), mais elles exigent
  un contact par e-mail (humain) → à n'ouvrir que si l'humain accepte ~10 min par soumission.
