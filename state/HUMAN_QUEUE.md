# File d'attente humaine

Les agents écrivent ici ce dont ils ont besoin de l'humain (comptes, dépenses, validations, publications sur des plateformes à compte).
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

### HQ-003 — Mesurer les visites (GoatCounter, gratuit, sans cookie)  [🟡 ouvert]
- Demandé par / le : strategist, 2026-11-12
- Pourquoi : le palier P1 (« premier visiteur externe mesuré ») est impossible sans mesure : GitHub Pages ne fournit aucune statistique, et les sessions des agents ne peuvent même pas ouvrir `lawatch.github.io` (refusé par le proxy réseau). GoatCounter est open source, sans cookie (pas de bannière RGPD), gratuit pour un petit site.
- Action exacte (≈ 10 min) : (a) créer un compte sur goatcounter.com avec un code de site, ex. `10aday` → tableau de bord `https://10aday.goatcounter.com`. (b) Dans les réglages du site, **cocher l'option qui rend le tableau de bord public** (« Allow public access to the dashboard »), pour que l'analyste lise les chiffres sans identifiants. (c) Écrire ici le code du site. **Jamais de mot de passe ni de clé API ici.** (d) Facultatif mais utile : autoriser dans l'environnement cloud des routines les hôtes `10aday.goatcounter.com` et `lawatch.github.io` (lecture des stats + vérification du site en ligne).
- Note : le service hébergé est gratuit pour les usages non commerciaux ; à revoir si des revenus significatifs arrivent.
- Réponse :

### HQ-004 — Adresse de dépôt crypto (Kraken) pour recevoir les revenus  [🟡 ouvert — non urgent]
- Demandé par / le : cadrage, 2026-11-12 (l'humain a annoncé qu'il connecterait son compte Kraken « quand il pourra »)
- Pourquoi : c'est le seul canal d'encaissement prévu. Les agents construisent d'abord des actifs à flux ; dès qu'une adresse existe, ils branchent la monétisation (régie qui paie à une adresse, primes en crypto).
- Action exacte (≈ 5 min, quand tu peux) : dans Kraken → Funding → Deposit → choisir l'actif et le **réseau** (ex. USDC sur un réseau supporté, ou BTC) → copier l'**adresse de dépôt** et l'écrire ici avec l'actif et le réseau. **Uniquement l'adresse publique : jamais de clé API, jamais d'identifiants.**
- Réponse :

### HQ-005 — Servir GitHub Pages depuis le dossier `/docs` (1 min)  [🟡 ouvert]
- Demandé par / le : strategist, 2026-11-12
- Pourquoi : Pages est actif mais sert la **racine** du dépôt (vérifié : `https://lawatch.github.io/10aday/` affiche le README via Jekyll ; le calculateur est à `/10aday/docs/rupture-conventionnelle-dates/`). Résultat : URLs avec `/docs/`, et tous les fichiers internes (journaux, état) publiés comme pages web, ce qui dilue le SEO. Avec `/docs`, le site devient `https://lawatch.github.io/10aday/rupture-conventionnelle-dates/` comme prévu.
- Action exacte : GitHub → `Lawatch/10aday` → Settings → Pages → Build and deployment → Branch `main`, dossier **`/docs`** (au lieu de `/ (root)`) → Save.
- Réponse :
