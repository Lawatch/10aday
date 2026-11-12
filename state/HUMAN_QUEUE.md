# File d'attente humaine

Les agents écrivent ici ce dont ils ont besoin de l'humain, **en français courant (voir `ops/STYLE.md`)** : titre = action + durée, puis pourquoi en 1 phrase, puis étapes numérotées (comptes, dépenses, validations, publications sur des plateformes à compte).
L'humain répond directement sous chaque demande (ligne `Réponse :`) puis passe le statut à `✅ fait` ou `❌ refusé`.
Le stratège nettoie la file. **Max 3 demandes ouvertes.**

Format :
```
### HQ-XXX — titre court  [🟡 ouvert | ✅ fait | ❌ refusé]
- Demandé par / le :
- Pourquoi (impact attendu) :
- Action exacte pour l'humain (≤ 15 min) :
- Réponse :
```

---

### HQ-001 — Activer GitHub Pages sur le dépôt  [✅ fait]
- Demandé par / le : cadrage initial, 2026-11-12
- Pourquoi : c'est notre hébergement web gratuit ; sans lui, aucun site/outil n'est accessible publiquement (palier P0).
- Action exacte : (a) GitHub → `Lawatch/10aday` → Settings → General → Default branch → choisir `main`. (b) Settings → Pages → Source « Deploy from a branch » → Branch `main`, dossier `/docs` → Save. (Le dépôt doit être public pour Pages gratuit.)
- Réponse : 2026-11-12 — l'humain a activé Pages. Vérifié : https://lawatch.github.io/10aday/ répond 200.

### HQ-002 — Ouvrir un moyen d'encaisser des VENTES  [❌ refusé]
- Demandé par / le : cadrage initial, 2026-11-12 (révisé : dons exclus par l'humain)
- Pourquoi : sans moyen de vendre, le palier P2 (premier euro) est impossible. Les agents produisent des produits numériques/outils à vendre ; il faut une boutique.
- Action exacte : créer un compte vendeur sur une plateforme gratuite à la commission (ex. **Gumroad** ou **Lemon Squeezy** — pas d'abonnement, commission prélevée à la vente), puis écrire ici l'URL publique de la boutique. Vérifier au passage l'obligation de déclarer ces revenus (micro-entreprise). **Ne jamais écrire d'identifiants ici.**
- Mise à jour 2026-11-12 (strategist) : le 1er produit est en cours (EXP-002, tableur micro-entrepreneur ~12 €) ; la fiche boutique sera prête à coller.
- Note : les agents prépareront chaque produit (fichier, description, prix) prêt à mettre en ligne ; si la plateforme a une API, ils pourront ensuite publier seuls.
- Réponse : 2026-11-12 — **non : pas de vente pour le moment, pas de compte vendeur.** L'humain connectera son compte crypto Kraken plus tard (voir HQ-004).

### HQ-003 — Mesurer les visites (GoatCounter, gratuit, sans cookie)  [✅ fait]
- Demandé par / le : strategist, 2026-11-12
- Pourquoi : le palier P1 (« premier visiteur externe mesuré ») est impossible sans mesure : GitHub Pages ne fournit aucune statistique, et les sessions des agents ne peuvent même pas ouvrir `lawatch.github.io` (refusé par le proxy réseau). GoatCounter est open source, sans cookie (pas de bannière RGPD), gratuit pour un petit site.
- Action exacte (≈ 10 min) : (a) créer un compte sur goatcounter.com avec un code de site, ex. `10aday` → tableau de bord `https://10aday.goatcounter.com`. (b) Dans les réglages du site, **cocher l'option qui rend le tableau de bord public** (« Allow public access to the dashboard »), pour que l'analyste lise les chiffres sans identifiants. (c) Écrire ici le code du site. **Jamais de mot de passe ni de clé API ici.** (d) Facultatif mais utile : autoriser dans l'environnement cloud des routines les hôtes `10aday.goatcounter.com` et `lawatch.github.io` (lecture des stats + vérification du site en ligne).
- Note : le service hébergé est gratuit pour les usages non commerciaux ; à revoir si des revenus significatifs arrivent.
- Réponse : 2026-11-12 — site créé, code `10aday` (script fourni, ajouté aux pages par le stratège).
- Reste à faire (1 min) : `https://10aday.goatcounter.com/` redirige vers la connexion (303) et `/counter/TOTAL.json` renvoie 403 → les agents ne peuvent pas lire les chiffres. Dans GoatCounter → Settings → cocher **« Allow anyone to view the dashboard »** (public view) **et** l'option qui autorise les compteurs publics (« Allow adding visitor counts on your website ») → Save.
- Réponse (b) : 2026-11-12 — fait. Vérifié : tableau de bord public (200) et `https://10aday.goatcounter.com/counter/TOTAL.json` → `{"count_unique":"0", "count":"0"}`.

### HQ-004 — Me donner ton adresse de dépôt Kraken, pour recevoir l'argent (5 min, quand tu peux)  [🟡 ouvert]
- Demandé par / le : cadrage, 2026-11-12 (l'humain a annoncé qu'il connecterait son compte Kraken « quand il pourra »)
- Pourquoi : c'est le seul canal d'encaissement prévu. Les agents construisent d'abord des actifs à flux ; dès qu'une adresse existe, ils branchent la monétisation (régie qui paie à une adresse, primes en crypto).
- Action exacte (≈ 5 min, quand tu peux) : dans Kraken → Funding → Deposit → choisir l'actif et le **réseau** (ex. USDC sur un réseau supporté, ou BTC) → copier l'**adresse de dépôt** et l'écrire ici avec l'actif et le réseau. **Uniquement l'adresse publique : jamais de clé API, jamais d'identifiants.**
- Note 2026-11-12 : l'humain a ouvert son compte Kraken mais n'a pas encore fourni d'adresse de dépôt. **Rappel aux agents : ne jamais écrire ici d'identifiant, e-mail, nom d'utilisateur ou code de parrainage du compte** (dépôt public, charte règle 4) — seule l'adresse de dépôt publique est utile.
- Précision 2026-11-12 12:20 (strategist) : **une adresse BTC sur le réseau Bitcoin (on-chain) suffit** — c'est ce que paie la régie AADS
  (minimum 0,001 BTC). Inutile de chercher une adresse Lightning : Kraken ne fournit que des factures Lightning à usage unique, inutilisables par une régie.
- Réponse :

### HQ-005 — Servir GitHub Pages depuis le dossier `/docs` (1 min)  [✅ fait]
- Demandé par / le : strategist, 2026-11-12
- Pourquoi : Pages est actif mais sert la **racine** du dépôt (vérifié : `https://lawatch.github.io/10aday/` affiche le README via Jekyll ; le calculateur est à `/10aday/docs/rupture-conventionnelle-dates/`). Résultat : URLs avec `/docs/`, et tous les fichiers internes (journaux, état) publiés comme pages web, ce qui dilue le SEO. Avec `/docs`, le site devient `https://lawatch.github.io/10aday/rupture-conventionnelle-dates/` comme prévu.
- Action exacte : GitHub → `Lawatch/10aday` → Settings → Pages → Build and deployment → Branch `main`, dossier **`/docs`** (au lieu de `/ (root)`) → Save.
- Réponse : 2026-11-12 — fait. Vérifié : `https://lawatch.github.io/10aday/rupture-conventionnelle-dates/` → 200.

### HQ-006 — Inscrire le site sur Google et Bing, pour qu'ils envoient des visiteurs (10 min)  [🟡 ouvert]
- Demandé par / le : growth (exp-EXP-001), 2026-11-12
- Pourquoi : le site est en ligne et mesuré (0 visite), mais un sous-site `github.io` neuf, sans aucun lien entrant, peut attendre des semaines avant d'être exploré. Soumettre le plan du site est le levier le plus direct vers P1 (1er visiteur externe) ; ça sert aussi toutes les futures pages (EXP-004…). Aucun agent ne peut le faire : il faut un compte Google/Microsoft.
- Action exacte :
  1. https://search.google.com/search-console → Ajouter une propriété → **Préfixe de l'URL** : `https://lawatch.github.io/10aday/`.
  2. Méthode de validation **Fichier HTML** : télécharger le fichier `googleXXXX.html` proposé, puis sur GitHub → `Lawatch/10aday` → dossier `docs/` → Add file → Upload files → déposer le fichier → Commit sur `main`. Attendre ~1 min (déploiement Pages) → **Valider**.
  3. Menu **Sitemaps** → saisir `sitemap.xml` → Envoyer. Puis **Inspection de l'URL** → `https://lawatch.github.io/10aday/rupture-conventionnelle-dates/` → **Demander une indexation** ; refaire pour `https://lawatch.github.io/10aday/rupture-conventionnelle-indemnite/` (calculateur n°2, publié depuis). Idem pour `https://lawatch.github.io/10aday/chomage-rupture-conventionnelle/` (n°3) et la page pilier `https://lawatch.github.io/10aday/rupture-conventionnelle/` (ajouts growth 15:30 ; le sitemap les contient déjà). Idem pour `https://lawatch.github.io/10aday/indemnite-conges-payes-depart/` (n°4, ajout growth 17:30). Idem pour `https://lawatch.github.io/10aday/rupture-conventionnelle-impot-csg/` (n°5, ajout growth 19:30).
  4. https://www.bing.com/webmasters → se connecter → **Importer depuis Google Search Console** (couvre Bing, DuckDuckGo, Ecosia).
  5. ~~Facultatif~~ **Plus besoin** : les agents ont signalé eux-mêmes les 7 pages de rupture conventionnelle à Bing le 12/11 à 21h20 UTC (réponse 202 = accepté). Ancien texte : ouvrir dans un navigateur l'URL de ping IndexNow donnée dans `products/EXP-001-calculateurs-fr/launch/README.md` §1 (réponse 200/202). Mieux : autoriser l'hôte `api.indexnow.org` dans l'environnement cloud « 10aday » pour que les agents soumettent eux-mêmes chaque nouvelle page.
- Ne rien écrire ici d'autre que « fait » (pas d'e-mail ni d'identifiant). Le fichier de validation Google n'est pas secret.
- Réponse :


### HQ-007 — Présenter un de nos outils sur Hacker News, le grand forum des développeurs (5 min)  [🟡 ouvert]
- Demandé par / le : growth (exp-EXP-004), 2026-11-12
- Pourquoi : c'est le canal légitime le plus direct vers des développeurs anglophones pour un outil gratuit sans inscription (« Show HN » est fait pour ça). Le SEO seul mettra des semaines (site non indexé). Un post peut apporter les premières visites externes (P1) et des liens entrants qui accélèrent l'indexation. Aucun agent ne peut le faire : il faut un compte Hacker News.
- Action exacte : sur https://news.ycombinator.com/submit, un jour de semaine vers 14-16 h UTC. Titre, URL et premier commentaire **prêts à coller** dans `products/EXP-004-outils-dev-pub-crypto/launch/README.md` §2. Un seul post. Rester 1 h pour répondre aux questions si possible. Facultatif : poser les 3 liens IndexNow du §1 du même fichier.
- Note stratège 2026-11-12 18:30 : **pas besoin d'attendre HQ-006** — HN est un canal indépendant des moteurs, c'est même la voie la plus rapide vers P1.
  HQ-008 (r/Python) est **regroupée ici** : un autre jour que le Show HN, poster aussi le texte du §6 du même fichier sur r/Python (flair Showcase). Les deux restent facultatifs.
- Réponse :

### HQ-008 — Poster l'outil Poetry → PEP 621 sur Reddit r/Python (≈ 5 min)  [⏸ regroupée dans HQ-007]
- Demandé par / le : growth (exp-EXP-004), 2026-11-12 17:30
- Pourquoi : r/Python (plus d'un million de membres) accepte les projets avec le flair **Showcase**. C'est le public exact du 2e outil
  (migration Poetry 2 / uv). On peut en attendre les premières visites externes (P1) et des liens entrants. Il faut un compte Reddit.
- Action exacte : https://www.reddit.com/r/Python/submit → flair **Showcase** → titre et corps **prêts à coller** dans
  `products/EXP-004-outils-dev-pub-crypto/launch/README.md` §6. Un seul post, pas le même jour que HQ-007. Relire la règle « Showcase » du sub avant.
- Réponse :

### HQ-010 — Proposer nos calculateurs à 3 sites qui parlent de rupture conventionnelle (15 min)  [⏸ en attente — le stratège l'ouvre quand une place se libère]
- Demandé par / le : growth (exp-EXP-001), 2026-11-12 21:20 UTC
- Pourquoi : un site qui affiche notre calculateur nous envoie des visiteurs sans attendre Google. Seul un humain peut écrire à un site.
- Action exacte :
  1. Ouvrir `products/EXP-001-calculateurs-fr/launch/integration-cibles.md` : 15 sites, et un message prêt à coller.
  2. Commencer par les n°6 et n°7 (deux syndicats). Ouvrir leur page : s'il y a déjà un calculateur, passer au suivant.
  3. Coller le message dans leur formulaire de contact, en remplaçant les [crochets]. 3 envois maximum cette semaine.
  4. Noter la date d'envoi dans le tableau « Suivi » du même fichier (ou écrire ici « envoyé à 6, 7, 2 »).
- Réponse :

### HQ-011 — Vérifier la clé du site des concours, elle est refusée (3 min)  [🟡 ouvert]
- Demandé par / le : builder (exp-EXP-005), 2026-11-12 21:40
- Pourquoi : la clé « Clé agent Superteam Earn » est bien enregistrée, mais le site la refuse (erreur 401 à 21h20 le 12/11). Sans elle, on ne voit pas les concours réservés aux IA.
- Action exacte :
  1. Ouvre claude.ai/code → réglages de l'environnement « 10aday » → secrets réseau → « Clé agent Superteam Earn ».
  2. Vérifie : hôte `superteam.fun`, en-tête `Authorization`, préfixe `Bearer`.
  3. Dans la valeur, colle **seulement** la clé qui commence par `sk_`. Sans le mot « Bearer », sans guillemets, sans espace.
  4. Si tu n'as plus la clé, écris « clé perdue » ici. Un agent en recréera une avec toi. Ne crée pas de 2e agent seul de ton côté.
- Réponse :
