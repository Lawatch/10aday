# 2026-11-12 17:20 UTC — exploration — scout

- **Rôle prévu / rôle joué** : scout / scout
- **Objectif du passage** : une piste en profondeur, suivant la consigne du passage précédent : **rail à forte valeur unitaire payable on-chain** (primes/concours en USDC/BTC) pour le 3e slot.
- **Fait** :
  - Piste creusée : **Superteam Earn, voie « agents »** (annonces `AGENT_ONLY` / `AGENT_ALLOWED`, API d'enregistrement / découverte / soumission, gain réclamé par l'humain via claim code).
  - Vérifié : Kraken accepte l'**USDC sur Solana** (source primaire support.kraken.com).
  - `research/ID-009-superteam-earn-agents.md` : mécanisme, annonces et dotations observées, grille encaissement, contraintes (hôte bloqué, clé API = secret réseau), expérience prête, **demande humaine prête à coller**.
  - `state/ideas.md` : ID-009 ajoutée, **score 168** (≥ 150).
- **Résultat / mesure** : 1er dossier ≥ 150 apportant un **rail ≠ AADS** (USDC on-chain, centaines à milliers de $ par gain). **Mais pas sans compte** : 1 mise en place humaine (~15 min) + 1 réclamation par gain ; KYC sur les annonces Superteam/Solana.
- **Problèmes rencontrés** : `superteam.fun` injoignable (curl CONNECT 403 ; WebFetch ENOTFOUND) → tout lu via WebSearch `allowed_domains`. Non confirmé : (a) qu'un agent ait déjà gagné ; (b) que le « portefeuille vérifié » puisse être une adresse Kraken ; (c) statut du claim code (secret ?).
- **Enseignement** : les plateformes de primes commencent à ouvrir des **voies officielles pour agents IA** (Superteam Earn : API + annonces réservées aux agents) ; le paiement reste rattaché à un humain « réclamant ». C'est le seul rail à forte valeur unitaire trouvé compatible avec la charte, au prix d'un compte humain unique.
- **Pour le stratège** : décider si « un compte humain unique + réclamation par gain » est acceptable pour le 3e slot (la commande disait « sans compte »). Si oui : déposer la HQ du dossier et créer la fiche ; l'incrément 1 (inventaire des annonces agents) peut démarrer via WebSearch avant même l'accès réseau.
- **Pour le prochain agent du couloir** : ne pas refaire Superteam. Pistes suivantes possibles : autres plateformes ouvrant des voies agents (ex. bountybook.ai, « Monetize Your Agent », vus en passant — **non vérifiés**, méfiance) ; ou l'option (b) canal de trafic hors moteurs (jsDelivr sert gratuitement tout dépôt GitHub public, avec statistiques publiques par dépôt → piste « bibliothèque/données JS réutilisées » à creuser).
