# Note scout — 2026-11-12 23:20 UTC : moteurs hors Google, et paiement par requête x402

## A. Qui d'autre que Google peut nous amener des visiteurs, sans compte humain ?
Contexte : IndexNow marche depuis le 12/11 20:55 (Bing, Yandex, Seznam, Naver). Google attend HQ-006.

| Moteur | Ce qu'il utilise | Comment il trouve nos pages | Source | Fiabilité |
|---|---|---|---|---|
| Bing (+ Yahoo) | index Bing | IndexNow (fait) | doc IndexNow | forte |
| ChatGPT recherche | Bing en 2024 ; tests 2025 → résultats proches de Google | dépend | seroundtable 11/2024 ; ppc.land 2025 ; practicalecommerce | **contradictoire** |
| DuckDuckGo | « Bing » selon des blogs SEO | — | aucune source primaire trouvée | non vérifiée |
| Qwant / Ecosia (France) | index propre EUSP/« Staan » depuis 08/2025, Bing comble les trous | **exploration seule** : le robot QwantBot lit `sitemap.xml` et `robots.txt` ; aucun formulaire officiel de soumission trouvé | help.qwant.com ; techcrunch 06/08/2025 ; heise | moyenne |

Constat 23:20 : `site:lawatch.github.io` ne renvoie rien dans la recherche web de session (attendu : < 1 jour après IndexNow).

**Conséquence pratique** : le seul geste qui sert *aussi* Qwant/Ecosia (objectif affiché : 30 % des recherches françaises fin 2026)
est le `robots.txt` racine avec ligne `Sitemap:` (dossier ID-010, 3 min humaines). Qwant n'a pas d'équivalent à IndexNow documenté.
→ argument de plus pour ID-010, utile surtout à EXP-001 (calculateurs français).

## B. x402 : faire payer une requête en USDC à une adresse fixe, sans compte vendeur
- Principe : le serveur répond « 402 paiement requis » ; l'agent client paie p. ex. 0,01 $ en USDC sur Base à une adresse `payTo` **fixe** ; le serveur vérifie puis répond.
  Sources : docs.stripe.com/payments/machine/x402 ; coinbase.com/developer-platform/discover/launches/x402 ; docs.cdp.coinbase.com/x402/support/faq.
- Encaissement : Kraken accepte l'USDC sur le réseau Base (support.kraken.com, « Cryptocurrencies available on Kraken »). Adresse statique → compatible grille.
- **Bloquants** :
  1. C'est une **vente** (paiement par appel) → suspendue par l'humain (charte, 12/11).
  2. Il faut un petit **serveur** (ex. Cloudflare Worker) devant le site : GitHub Pages est statique → compte humain chez l'hébergeur. L'option « sans serveur » (Coinbase Business Checkouts) exige un compte Coinbase Business.
  3. Clients = agents IA équipés d'un portefeuille : demande réelle non chiffrée.
- Verdict : backlog suspendu (ID-013, score 16). À rouvrir seulement si l'humain lève « pas de vente » ET accepte un compte d'hébergement gratuit.

## Pour le prochain scout
Ne pas refaire A ni B. Pistes non encore regardées : formats que d'autres sites **republient tout seuls** (flux RSS/JSON d'actualités de barèmes FR,
fichiers `.ics` d'échéances officielles abonnables) — canal « abonnement » sans moteur.
