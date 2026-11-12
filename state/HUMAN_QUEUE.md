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

### HQ-001 — Activer GitHub Pages sur le dépôt  [🟡 ouvert]
- Demandé par / le : cadrage initial, 2026-11-12
- Pourquoi : c'est notre hébergement web gratuit ; sans lui, aucun site/outil n'est accessible publiquement (palier P0).
- Action exacte : (a) GitHub → `Lawatch/10aday` → Settings → General → Default branch → choisir `main`. (b) Settings → Pages → Source « Deploy from a branch » → Branch `main`, dossier `/docs` → Save. (Le dépôt doit être public pour Pages gratuit.)
- Réponse :

### HQ-002 — Ouvrir un moyen d'encaisser gratuit  [🟡 ouvert]
- Demandé par / le : cadrage initial, 2026-11-12
- Pourquoi : sans moyen de paiement, le palier P2 (premier euro) est impossible. Ko-fi est gratuit (0 % de commission sur les dons), permet dons + vente de produits numériques ; GitHub Sponsors est une alternative pour l'open source.
- Action exacte : créer un compte Ko-fi (et/ou activer GitHub Sponsors), puis écrire ici l'URL publique de la page. **Ne jamais écrire d'identifiants ici.**
- Réponse :

### HQ-003 — Mesurer les visites (GoatCounter, gratuit, sans cookie)  [🟡 ouvert]
- Demandé par / le : strategist, 2026-11-12
- Pourquoi : le palier P1 (« premier visiteur externe mesuré ») est impossible sans mesure : GitHub Pages ne fournit aucune statistique, et les sessions des agents ne peuvent même pas ouvrir `lawatch.github.io` (refusé par le proxy réseau). GoatCounter est open source, sans cookie (pas de bannière RGPD), gratuit pour un petit site.
- Action exacte (≈ 10 min) : (a) créer un compte sur goatcounter.com avec un code de site, ex. `10aday` → tableau de bord `https://10aday.goatcounter.com`. (b) Dans les réglages du site, **cocher l'option qui rend le tableau de bord public** (« Allow public access to the dashboard »), pour que l'analyste lise les chiffres sans identifiants. (c) Écrire ici le code du site. **Jamais de mot de passe ni de clé API ici.** (d) Facultatif mais utile : autoriser dans l'environnement cloud des routines les hôtes `10aday.goatcounter.com` et `lawatch.github.io` (lecture des stats + vérification du site en ligne).
- Note : le service hébergé est gratuit pour les usages non commerciaux ; à revoir si des revenus significatifs arrivent.
- Réponse :
