# Note — Économie réelle d'AADS : combien de trafic pour 1 € encaissé, pour 10 €/jour ? (scout, 2026-11-12 15:20 UTC)

Objet : EXP-001 et EXP-004 (et tout 3e slot « trafic-pub ») reposent sur **une seule** régie, AADS. Avant d'investir plus de passages,
calibrer l'ordre de grandeur. Faits sourcés (sources primaires aads.com / help.aads.com, via WebSearch `allowed_domains`, domaines bloqués en WebFetch)
séparés des calculs (marqués **estimation**).

## Faits (sources primaires)
| Fait | Source |
|---|---|
| CPM moyen du réseau : **0,04 $** (« AADS in numbers » ; ~2 000 éditeurs actifs) | https://aads.com/about-us/ , https://aads.com/advertise/ |
| Catalogue, catégorie « All Traffic » : CPM 0,00000050 ₿ (**0,04 $**), 4 943 blocs | https://aads.com/catalog/ |
| Page d'accueil (instantané) : Premium Crypto 1,05 $, Crypto 0,37 $, Business & Finance 0,26 $, All Traffic **0,01 $** | https://aads.com/ (extrait WebSearch) |
| Le CPM « attendu » affiché à la création d'un bloc est une moyenne réseau, « peut différer fortement » ; pas de paiement fixe : enchères au jour | https://help.aads.com/en/article/how-the-aads-network-functions-and-operates-1grwr0c/ , https://aads.com/ad-units/new/ |
| Un bloc neuf est en catégorie **« Unknown »**, non ciblée par les campagnes CPD, jusqu'à classement par robot (~24 h après du trafic) | https://help.aads.com/en/article/managing-ad-units-categories-and-color-configuration-1phcq5k/ |
| Paiement **BTC on-chain uniquement, minimum 0,001 BTC** ; Lightning sans minimum | https://help.aads.com/en/article/how-to-withdraw-your-earnings-a-guide-for-publishers-xlagq8/ , https://aads.com/terms-of-service/ |
| Lightning : **uniquement Lightning Address / LNURL-pay** ; configuration avec **mot de passe du compte AADS + confirmation par e-mail** (donc compte enregistré, pas le compte anonyme) ; blocage 2-3 j après changement | https://help.aads.com/en/article/how-to-withdraw-funds-using-the-lightning-network-a-step-by-step-guide-1g8cz2o/ , https://aads.com/blog/effortlessly-withdraw-bitcoin-from-a-ads-using-lightning-network/ |
| Aucun paiement en USDT/USDC trouvé (BTC seulement) | mêmes sources |

## Calculs (estimations — cours implicite du catalogue : 0,0000005 ₿ = 0,04 $ ⇒ 1 ₿ ≈ 80 000 $ ; 1 $ ≈ 0,86 €)
| Question | CPM 0,04 $ (moyenne réseau) | CPM 0,26 $ (Business & Finance, optimiste) |
|---|---|---|
| Impressions pour atteindre le **seuil on-chain 0,001 ₿ (≈ 70 €)** | **2 000 000** | ≈ 310 000 |
| … à 100 pages vues/jour (ordre de grandeur réaliste à 3 mois) | ≈ 55 ans | ≈ 8,5 ans |
| … à 1 000 pages vues/jour | ≈ 5,5 ans | ≈ 10 mois |
| Impressions/jour pour **10 €/jour** | **≈ 290 000 /jour** (≈ 8,7 M/mois) | ≈ 45 000 /jour |
| Impressions pour **1 € (P2)**, si paiement Lightning possible | ≈ 29 000 | ≈ 4 500 |

Hypothèses défavorables non comptées : filtrage obligatoire Gambling/Investments/Risky/NSFW (AADS prévient que ça baisse le revenu),
commission éventuelle, un seul bloc par page, trafic FR non-crypto probablement **sous** la moyenne (« All Traffic » 0,01-0,04 $).

## Conclusions pour le stratège
1. **AADS ne peut pas être le moteur de 10 €/jour** à notre échelle : il faudrait ~300 000 pages vues/jour (un site média moyen). C'est au mieux
   un **moyen de prouver P2** (premiers sats), pas P3/P4.
2. **En on-chain vers Kraken, P2 est pratiquement inatteignable** (2 M d'impressions avant le 1er versement). La seule voie réaliste vers un 1er
   encaissement AADS est **Lightning**, qui exige : (a) un compte AADS **enregistré** (e-mail + mot de passe : action humaine), (b) une **Lightning
   Address statique**, que Kraken ne fournit pas → portefeuille Lightning de l'humain (ex. custodial type Wallet of Satoshi) puis virement manuel
   vers Kraken. C'est une **décision humaine** (écart à « tout sur Kraken ») ; texte de demande prêt ci-dessous, à déposer par le stratège s'il le juge utile.
3. **Conséquence portefeuille** : la valeur d'EXP-001/EXP-004 est le **flux** (visites), qui garde sa valeur si l'humain autorise plus tard une
   régie à CPM élevé (les régies grand public type AdSense paient en fiat avec compte — interdit aujourd'hui). Ne pas évaluer ces expériences sur
   les sats, mais sur les visites ; et **ne pas lancer de 3e slot « trafic-pub AADS »** de plus.
4. Le critère du 3e slot (rail ≠ AADS ou canal ≠ moteurs) est d'autant plus justifié : **un rail à revenu unitaire élevé** (prime, concours)
   vaut mieux que du volume publicitaire à 0,04 $ CPM.

## Demande humaine prête (à déposer par le stratège seulement s'il la juge prioritaire — pas avant que le site ait du trafic)
> **HQ — Recevoir les gains AADS par Lightning (≈ 10 min, une fois)** : AADS paie en on-chain seulement à partir de 0,001 BTC (≈ 70 €, soit ~2 M
> d'affichages à notre CPM : des années). En Lightning il n'y a pas de minimum, mais AADS exige une *Lightning Address* (Kraken n'en fournit pas)
> et un compte AADS enregistré. Si vous acceptez : (1) installer un portefeuille Lightning qui fournit une Lightning Address ; (2) créer le compte
> éditeur AADS avec votre e-mail, créer le bloc (catégories exclues : Gambling, NSFW, Investments, Risky projects), y saisir la Lightning Address ;
> (3) donner aux agents **uniquement** le code HTML du bloc (pas d'identifiants). Vous transférez ensuite vers Kraken quand vous voulez.
