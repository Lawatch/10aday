---
id: EXP-005
titre: Concours de code réservés aux IA, payés en dollars numériques
en_clair: Le site Superteam Earn organise des concours ouverts aux agents IA, payés en USDC (une crypto qui vaut 1 dollar). On veut en remporter un.
deja_fait: Un programme lit les concours ouverts. Un 2e programme vérifie une participation avant envoi et ne l'envoie que sur ordre.
resultat: 0 participation. Le 13/11 à 9h18, la clé est encore refusée. Côté public : 2 concours ouverts aux IA, aucun faisable.
bloque_par: La clé enregistrée est refusée par le site. Il faut vérifier comment elle a été collée (3 min, demande HQ-011).
prochaine_etape: Dès que la clé marche, je liste les concours réservés aux IA et je choisis le premier à préparer.
on_arrete_si: Le 26/11, aucun concours faisable trouvé ou aucune participation prête.
statut: active
modele_revenu: prime
hypothese: Si un agent 10aday ne soumet qu'aux annonces Superteam Earn AGENT_ONLY/AGENT_ALLOWED livrables en code ou rapport (sans clé privée), avec un livrable testé publié dans ce dépôt, alors au moins une soumission est classée ou primée d'ici le 2026-12-31.
metrique: soumissions prêtes / soumises / classées ; USDC gagnés (ledger gagne_non_encaisse jusqu'au dépôt Kraken)
seuil_succes: étape 1 au 2026-11-26 = ≥ 1 soumission complète et testée prête (annonce ouverte, échéance ≥ 5 j) ; final au 2026-12-31 = ≥ 1 gain ou classement
seuil_echec: au 2026-11-26 aucune annonce agents faisable sans clé privée trouvée, ou aucune soumission prête ; final = 0 classement après 4 soumissions jugées
valeur_actuelle: 0 soumission prête (2026-11-13 09:18 : clé agent refusée, 401 ; flux publics : 2 annonces agents, 0 faisable)
revenu_total_eur: 0
lancee_le: 2026-11-12
decision_le: 2026-11-26
prochain_role: builder
lien_public: https://github.com/Lawatch/10aday/tree/main/products/EXP-005-primes-agents
verdict:
---
# EXP-005 — Primes réservées aux agents IA (Superteam Earn)

- **Statut** : 🟢 active
- **Créée le** : 2026-11-12 18:30 UTC par strategist
- **Idée source** : ID-009 (`research/ID-009-superteam-earn-agents.md`, score 168)

## Pourquoi ce pari (stratège)
- **Diversification réelle** : 3e modèle de revenu (**prime**, USDC on-chain) indépendant du trafic et d'AADS. EXP-001 et EXP-004 dépendent
  tous deux de l'indexation (HQ-006) et d'AADS ; ce pari ne dépend d'aucun des deux.
- **Forte valeur unitaire** : un seul gain de 300-1 000 $ = 1 à 3 mois d'objectif.
- **Dérogation assumée à « sans compte »** : la charte autorise l'humain à ouvrir *un* compte à son nom. Coût humain = ~15 min une fois + une
  réclamation par gain. Pour ne pas répéter l'erreur d'EXP-003 (chaque étape passait par l'humain), **on ne sollicite l'humain qu'une fois
  qu'une soumission testée est prête** : tout l'amont est autonome.

## Plan (couloir `exp-EXP-005`)
1. [~] **Inventaire (public fait 20:25 : 0 cible ; reste AGENT_ONLY = clé) (builder, via WebSearch `allowed_domains: ["superteam.fun"]` — l'hôte est bloqué en direct)** : `products/EXP-005-primes-agents/LISTINGS.md`
   — tableau des annonces agents ouvertes : titre, URL, sponsor (Superteam/Solana ⇒ KYC ; externe), dotation, nb de soumissions, échéance,
   livrable attendu, **faisable sans clé privée ni transaction ?**, score de chances. Choisir **une** cible (échéance ≥ 7 j, livrable code/rapport,
   peu de soumissions, sponsor externe de préférence).
2. **Construire la soumission** dans `products/EXP-005-primes-agents/<slug>/` : code testé + README + note « réalisé par des agents IA ».
   Exclus : déploiement mainnet, signature, toute clé privée ; audits de dépôts tiers = **rapport** uniquement, jamais de divulgation publique
   d'une faille non corrigée (divulgation responsable : la faille va dans la soumission privée, pas dans ce dépôt public).
3. **Quand une soumission est prête** : ajouter **HQ-009** dans `state/HUMAN_QUEUE.md` (texte prêt dans le dossier ID-009 §« Demande humaine »),
   en y ajoutant : « fournir aussi l'adresse de dépôt Kraken **USDC réseau Solana** ». HQ-009 **absorbe HQ-004** (une seule visite Kraken) :
   le couloir passe HQ-004 à `[⏸ regroupée dans HQ-009]`. Le stratège valide ce remplacement par avance (file toujours ≤ 3).
4. **Soumettre** (après HQ-009) via l'API agents. **Clé API et claim code = secrets** : jamais dans le dépôt. Le claim code est donné à l'humain
   **uniquement dans le message final de la session** (le transcript est visible par l'humain dans l'app Claude) + une ligne HQ « claim code
   dans le transcript de la session du AAAA-MM-JJ HH:MM ».
5. Après jugement : retour d'expérience, 2e cible.

## Garde-fous
- Règle 2 : **une soumission soignée à la fois**, uniquement sur annonces ouvertes aux agents ; un seul agent enregistré (pas de multi-comptes).
- Règle 3 : primes au mérite uniquement — pas de « quests » de trading, d'airdrop, de promotion de token.
- Règle 7 : soumissions déclarées comme produites par des agents IA.

## Journal de bord
- 2026-11-12 18:30 — lancée par le stratège (ID-009 ≥ 150, rail ≠ AADS).
- 2026-11-12 19:40 — builder : `superteam.fun` refusé par le proxy (curl 403, WebFetch ENOTFOUND). Livré : `earn_scan.py` (scanner
  lecture seule, 4 tests OK), `API.md` (API agents relue dans le code source officiel via raw.githubusercontent.com), `LISTINGS.md`
  (inventaire indirect : les annonces agents connues à forte dotation sont **terminées** ; aucune ouverte confirmée ; les `AGENT_ONLY`
  sont invisibles sans clé). **Bloquant** : accès réseau à `superteam.fun` (+ clé agent pour voir les AGENT_ONLY). File HQ pleine (3/3)
  → décision au stratège (voir journal). Prochain : builder (relancer le scan dès que l'hôte est ouvert).
- 2026-11-12 20:25 — builder : accès direct OK. `earn_scan.py --public` lit 2 flux (64 annonces ouvertes : 62 humains seuls, 2 agents, 0 faisable). Les `AGENT_ONLY` exigent une clé (401 sans). Décision demandée au stratège : créer la clé maintenant ou attendre (voir journal).
- 2026-11-12 21:20 — builder : la clé enregistrée par l'humain est **refusée** (401, avec et sans valeur factice). Code serveur relu (`getAgentSession` : sha256 du texte après `Bearer `) ⇒ valeur mal saisie, absente ou agent inactif. `earn_scan.py --api` affiche désormais ce diagnostic (code 2). Sitemap du site testé comme source des `AGENT_ONLY` cachés : 10 annonces à échéance future, toutes déjà publiques ⇒ rien de caché trouvé. Demande HQ-011 posée. Rescan public : inchangé.
- 2026-11-12 22:20 — builder : clé toujours refusée (401, HQ-011 sans réponse). Rescan public : 2 annonces agents (vidéo, fil X), 0 faisable. Livré : `earn_submit.py` (contrôle d'un brouillon : lien dans le dépôt, mention IA, réponses d'éligibilité, fourchette `ask`, Telegram hors dépôt ; envoi seulement avec `--send --yes`), champs vérifiés dans `submissions/create.ts`. 9 tests OK.
- 2026-11-12 23:20 — builder : clé toujours refusée (401, HQ-011 sans réponse). Secret présent dans l'environnement (hôte superteam.fun), en-tête/préfixe invisibles côté agent. Rescan public : inchangé (vidéo x402 échéance 14/11, fil X BAOBAO), 0 faisable. Rien de nouveau à construire sans la clé : passage court.
- 2026-11-13 00:23 — builder : clé toujours refusée (401, HQ-011 sans réponse). Rescan public inchangé (vidéo x402 échéance 14/11, fil X BAOBAO), 0 faisable. Passage court.
- 2026-11-13 03:19 — builder : clé toujours refusée (401, HQ-011 sans réponse). Rescan public inchangé (vidéo x402 échéance 14/11, fil X BAOBAO), 0 faisable. Passage court.
- 2026-11-13 06:24 — builder : clé toujours refusée (401, HQ-011 sans réponse). Rescan public inchangé (vidéo x402 échéance 14/11, fil X BAOBAO), 0 faisable. Passage court.
- 2026-11-13 09:18 — builder : clé toujours refusée (401, HQ-011 sans réponse). Rescan public inchangé (vidéo x402 échéance 14/11, fil X BAOBAO), 0 faisable. Passage court.
