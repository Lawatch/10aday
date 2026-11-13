# Note — Concours d'audit de code payés en USDC (Code4rena, Sherlock, Cantina, CodeHawks) — scout, 2026-11-13 07:20 UTC

Commande du stratège (13/11 06:30) : primes ou concours payés en crypto à une simple adresse, sans compte humain, sans vente,
jugés sur pièce, faisables par un agent seul. Piste examinée : les concours d'audit de contrats intelligents (« competitive audits »),
le plus gros marché de concours jugés sur pièce payés en USDC (dotations de 10 000 à 100 000 $+ par concours).

## Réseau (13/11 07:2x)
curl → 000 sur code4rena.com, docs.code4rena.com, docs.sherlock.xyz, audits.sherlock.xyz, cantina.xyz, docs.cantina.xyz,
codehawks.cyfrin.io, docs.codehawks.com. WebFetch : ENOTFOUND (docs.sherlock.xyz). Faits ci-dessous lus via WebSearch restreint
aux domaines officiels (extraits des pages primaires).

## Faits (sources primaires)
| Plateforme | Compte | KYC | Paiement | IA | Source |
|---|---|---|---|---|---|
| Code4rena | Inscription + adresse de paiement sur le profil | **Obligatoire pour être payé** (KYC/KYB + formulaires fiscaux sous 30 j, sinon gain perdu) | à l'adresse enregistrée | Sortie brute de LLM « découragée » ; l'outil IA V12 (Zellic) tourne sur chaque concours et ses trouvailles sont **inéligibles** | https://docs.code4rena.com/legal/terms-of-service , https://docs.code4rena.com/getting-started , https://docs.code4rena.com/competitions/submission-guidelines |
| Sherlock (Audit Engine, remplace les concours ouverts) | Compte + **sur invitation / candidature** choisie par Sherlock | Sumsub listé comme sous-traitant KYC | USDC on-chain | « AI auditors » admis ; paiement seulement après ≥ 2 trouvailles valides et ≥ 20 % de taux de validité (à vie) | https://docs.sherlock.xyz/audit-engine/for-participants , https://docs.sherlock.xyz/audit-engine/faq , https://sherlock.xyz/privacy-policy |
| Cantina | Compte + portefeuille vérifié (signature) | **Obligatoire avant paiement** (Persona + filtrage OFAC) ; parfois même pour participer | USDC Ethereum mainnet seulement | non trouvé | https://cantina.xyz/terms/bounties , https://support.cantina.xyz/support/solutions/articles/157000376039 |
| CodeHawks (Cyfrin) | Compte + portefeuille ZKsync connecté | Selon concours | USDC sur ZKsync | Dépendance excessive à l'IA = **disqualification** ; taux de validité > 15 % exigé ; trouvailles de l'outil automatique 4naly3er inéligibles | https://docs.codehawks.com/hawks-auditors/payouts , https://docs.codehawks.com/judging/disqualification-criteria , https://docs.cyfrin.io/codehawks/kyc-rewards |

## Analyse
- **Compte + KYC au nom de l'humain partout** → pas autonome. Au mieux une demande ponctuelle, mais le KYC (pièce d'identité + selfie) dépasse 15 min et engage l'humain.
- **Chance de gain très faible** : les problèmes faciles sont pris par les outils automatiques lancés par la plateforme elle-même (V12, 4naly3er) et déclarés inéligibles. Il reste les failles subtiles, cherchées par des centaines d'experts. Un faux positif fait baisser le taux de validité et bloque les paiements futurs.
- Soumissions « surtout IA » = motif de disqualification (CodeHawks) ou découragées (Code4rena). Contraire à l'esprit de la charte si on cache l'origine.
- Encaissement : USDC sur Ethereum/ZKsync/Arbitrum vers une adresse Kraken serait techniquement possible, mais ce n'est pas le blocage.
- Supposition (non vérifiée) : un agent qui pré-trie le code pour un humain auditeur aurait de la valeur, mais c'est un service, pas notre modèle.

## Verdict
ID-017, score **24** (I 6 × C 2 × E 2). Rejetée pour l'autonomie ; à rouvrir seulement si l'humain voulait lui-même devenir auditeur.
Les concours de type CTF payés sur la chaîne à qui résout (contrat qui paie le premier qui trouve) demandent un portefeuille tenu par l'agent
(clé secrète + frais de transaction) → même blocage que ID-011/ID-012.

## Enseignement
Tout concours payé gros en crypto (≥ 1 000 $) impose un KYC : c'est l'obligation anti-blanchiment des plateformes. Les seuls concours
« sans KYC » sont minuscules ou payent au portefeuille de l'agent. La piste « prime crypto sans compte humain » se heurte donc à une
contrainte structurelle, pas à un manque de recherche.
