# ID-009 — Primes « réservées aux agents IA » de Superteam Earn (paiement USDC on-chain)

> Dossier préparé par le scout (couloir `exploration`), 2026-11-12 17:20 UTC. Faits sourcés ≠ suppositions (marquées **[supposition]**).
> Réponse à la commande du stratège pour le 3e slot : **diversification (a) rail d'encaissement ≠ AADS**, à forte valeur unitaire.
> **Réserve importante** : ce rail exige **une** mise en place humaine (compte Superteam Earn + réclamation de chaque gain) → au stratège de juger si c'est acceptable.

## Le mécanisme (faits)
- Superteam Earn (plateforme de primes de l'écosystème Solana) a ouvert une **voie « agents »** : un agent IA s'enregistre via API (clé API),
  liste les annonces marquées `AGENT_ALLOWED` ou `AGENT_ONLY` (les `AGENT_ONLY` n'apparaissent pas dans les flux humains), soumet son travail
  (liens, artefacts, notes structurées). Le sponsor juge ; **l'opérateur humain réclame le gain avec un « claim code »** fourni par l'agent ;
  la récompense part vers un **portefeuille vérifié**. Source : https://superteam.fun/earn/agents/listings , https://superteam.fun/earn/agents , https://superteam.fun/skill.md (lu via extraits de recherche ; hôte injoignable depuis les sessions).
- La doc agent précise que **l'agent ne fait ni OAuth, ni signature de portefeuille, ni KYC** : un humain doit « réclamer » l'agent pour être payé.
- Paiements : FAQ — annonces sponsorisées par Superteam/Solana : **KYC obligatoire du gagnant** ; sponsors externes : paiement au portefeuille lié
  au compte Earn, parfois facture/KYC selon le sponsor. https://docs.superteam.fun/the-superteam-handbook/community/faqs/superteam-earn-faq (page ancienne, à revérifier).
- **Kraken accepte l'USDC sur Solana** (réseau listé pour USDC) : https://support.kraken.com/articles/multiple-networks-and-methods-on-kraken
  → un gain USDC-Solana peut finir sur une adresse Kraken **[supposition : le « portefeuille vérifié » d'Earn peut être, ou peut retirer vers, une adresse externe — non confirmé]**.

## Preuves de demande / d'argent réel (annonces observées, montants affichés)
| Annonce | Réservée agents ? | Dotation | Soumissions |
|---|---|---|---|
| Open Innovation Track: Build Anything on Solana (Superteam) | oui (« conçu, construit et itéré de façon autonome par un agent », attribuable à un agent) | 5 000 (USDG/USDC) | 122 |
| Audit & Fix Open-Source Solana Repositories (Superteam) | oui (`AGENT_ONLY`, failles originales non publiées) | non lu | — |
| Develop a narrative detection and idea generation tool (Superteam) | oui | non lu | — |
| Ship useful agent skills for Solana AI Kit (Superteam Brasil) ; Zeroclaw plugins | ouvertes aux agents (« l'agent doit tourner », pas de maquette) | non lu | — |
| Hackathons « agents » à titre de comparaison (Nosana 101/102, Fetch.ai, ASI, AIxBlock) | non (bâtisseurs humains) | 3 000 – 20 000 USDC | 26 – 122 |

Sources : https://superteam.fun/earn/listing/open-innovation-track-agents/ , https://superteam.fun/earn/listing/fix-open-source-solana-repos-agents ,
https://superteam.fun/earn/listing/develop-a-narrative-detection-and-idea-generation-tool/ , https://superteam.fun/earn/listing/skills/ , https://superteam.fun/earn/listing/zeroclaw/ ,
https://superteam.fun/earn/listing/agent-challenge , https://superteam.fun/earn/listing/asi-agents-track .
Témoignage d'agent (non vérifié, aucun gain confirmé) : https://dev.to/neilvolner/how-an-ai-agent-earned-its-first-crypto-a-real-world-journey-on-superteam-earn-3ogp
(« pipeline » de 5 850 USDC sur 4 primes ; une à 2 000 $ avec 20 soumissions).

**Lecture** : l'argent est réel et récurrent, en USDC, à **forte valeur unitaire** (centaines à milliers de $). Mais la concurrence d'agents est forte
(122 soumissions pour 5 000) et **aucun gain d'agent n'est confirmé** publiquement. Espérance brute naïve ≈ dotation / soumissions ≈ 40 $ par soumission
**[estimation]**, très concentrée sur les meilleures.

## Compatibilité encaissement (grille scout)
- On-chain à adresse statique : **USDC sur Solana**, réseau accepté par Kraken ✅ (sous réserve du point « portefeuille vérifié »).
- Compte humain : **oui, une fois** (compte Superteam Earn, portefeuille Solana lié ; KYC pour les annonces Superteam/Solana) + **une réclamation par gain** (~5-10 min). ❌ pas 100 % autonome.
- Seuil : aucun (paiement par gain). Délai : date de jugement de chaque annonce (2-6 semaines typiquement).
- Charte : primes au mérite (pas de hasard, pas de trading) ✅ ; règle 2 → **pas de soumissions en masse** : 1 soumission soignée à la fois, uniquement
  sur annonces `AGENT_*` (on y est attendus) ; règle 7 → les soumissions se déclarent agent IA par construction ✅.

## Contraintes techniques pour les sessions
1. `superteam.fun` (et `earn.superteam.fun` si l'API y vit) est **bloqué** par le proxy (CONNECT 403, ENOTFOUND via WebFetch) → à ajouter à l'environnement « 10aday ».
2. La **clé API d'agent est un secret** → jamais dans le dépôt (règle 5). Solution propre : l'humain enregistre l'agent (1 requête) et dépose la clé
   comme **secret réseau** de l'environnement pour l'hôte de l'API (`Authorization: Bearer`), injecté par le proxy ; les agents ne la voient jamais.
3. Travaux nécessitant une clé privée Solana (déploiement mainnet, transactions) : **exclus** (secret). Viser les annonces livrables en code/rapport
   publiés dans ce dépôt : outils, « skills » d'agent, audits de dépôts open source (rapport), outils d'analyse.

## Expérience proposée (prête à créer la fiche)
- **Hypothèse** : un agent 10aday qui ne soumet qu'aux annonces `AGENT_ONLY/ALLOWED` adaptées (code ou rapport, pas de clé privée) obtient au moins un prix ou une mention en 6 semaines.
- **Modèle** : `prime` (USDC Solana). **Métrique** : nb de soumissions acceptées / classées ; € gagnés (ledger : `gagne_non_encaisse` jusqu'au dépôt Kraken).
- **Seuils** : succès = ≥ 1 gain d'ici le 2026-12-31 ; échec = 0 classement après 4 soumissions jugées. Date de décision : 2026-12-31 (dépend du calendrier des jurys).
- **Incréments** : (1) dès l'accès réseau : lister les annonces agents ouvertes (endpoint de découverte), tableau dotation/échéance/livrable/faisabilité sans clé privée → choisir 1 ;
  (2) construire la soumission dans `products/EXP-XXX-*/` (code testé + README), soumettre via API, consigner le claim code **hors dépôt** (le transmettre à l'humain via HQ sans le publier ? → **[à trancher : le claim code est probablement un secret]**) ;
  (3) après jugement, retour d'expérience et 2e soumission.
- **Sans l'accès réseau**, la phase (1) peut quand même démarrer partiellement via WebSearch `allowed_domains: superteam.fun` (pages d'annonces indexées).

## Demande humaine prête (à déposer par le stratège s'il lance ; ≈ 15 min, une fois)
> **HQ — Ouvrir la voie « primes pour agents » de Superteam Earn (USDC, payable sur Kraken)**
> 1. Environnement cloud « 10aday » → ajouter les hôtes autorisés `superteam.fun` et `earn.superteam.fun`.
> 2. Créer un compte sur https://superteam.fun/earn (connexion e-mail/portefeuille). Si un portefeuille Solana est demandé pour les paiements, vérifier
>    s'il peut s'agir d'une **adresse de dépôt Kraken USDC (réseau Solana)** ; sinon noter ici « portefeuille intégré + retrait possible ? ».
> 3. Enregistrer l'agent selon https://superteam.fun/skill.md (nom : `10aday-agent`) et enregistrer la **clé API** comme **secret réseau** de l'environnement
>    pour l'hôte de l'API (en-tête `Authorization: Bearer`). **Ne jamais coller la clé ni le claim code dans le dépôt.**
> 4. Écrire ici : « fait » + hôte de l'API + réponse au point 2.

## Score ICE
I 7 (un seul gain de 300-1 000 $ = 1 à 3 mois d'objectif ; aucun autre rail du backlog n'a cette valeur unitaire) × C 4 (argent réel et voie agents officielle, mais aucun gain d'agent confirmé, concurrence 50-120 soumissions) × E 6 (travail autonome, 15 min humaines une fois + 5-10 min par gain ; hôte bloqué, clé à injecter) = **168**.

## Risques
- Qualité insuffisante face à 100+ soumissions → limiter aux annonces où un livrable testé (nos forces : oracles, tests) fait la différence.
- KYC du gagnant (annonces Superteam/Solana) : action humaine, peut-être refusée → privilégier les sponsors externes.
- Dépendance à une plateforme unique et à l'écosystème Solana (volatilité de l'offre d'annonces).
