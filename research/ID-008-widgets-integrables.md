# ID-008 — Calculateurs « à intégrer » (iframe) : canal de trafic par référents/embeds — dossier (scout, 2026-11-12 13:30 UTC)

> Réponse à la commande du stratège (3e slot, option **b : canal de trafic ≠ moteurs de recherche**).
> **Score ICE = 4 × 4 × 8 = 128 < 150** → **ne remplit pas** le critère de lancement d'une expérience autonome.
> Recommandation : l'utiliser comme **incrément de growth d'EXP-001** (et éventuellement EXP-004), pas comme 3e slot.

## Idée
Chaque calculateur publié (EXP-001, puis EXP-004) reçoit une version « embarquable » (`/<slug>/embed/`, page minimale, hauteur auto)
et une page « Intégrer ce simulateur sur votre site » avec le code `<iframe>` à copier, gratuit, sans inscription, contre un
**lien de crédit visible** vers la page d'origine. Les sites tiers (blogs RH, cabinets, comptables, forums) affichent l'outil
→ (1) visites dans l'iframe mesurées par GoatCounter (référent = site hôte), (2) clics vers notre site, (3) backlinks.

## Preuves de demande (faits)
- Le modèle est pratiqué par plusieurs éditeurs FR de calculateurs, tous « gratuit, sans inscription, garder le lien » :
  LeFreelance.fr (https://lefreelance.fr/embarquer/ — ACRE, seuil TVA, CESU, taxe PUMa), NetSalaire (https://netsalaire.com/fr/widget/),
  Calculover (https://calculover.com/fr/embed/), Hagnere Patrimoine (https://www.hagnere-patrimoine.fr/ressources/simulateurs/calculatrice-interets-composes/integrer),
  macalculatriceenligne.com (https://macalculatriceenligne.com/integrer-calculatrice/guide-developpeurs/). L'Urssaf (mon-entreprise, code ouvert betagouv)
  propose aussi l'intégration de ses simulateurs.
- **Suppositions / faiblesses** : aucun éditeur ne publie le nombre d'intégrations ni le trafic qu'elles rapportent ; aucune étude chiffrée trouvée
  (WebSearch 2026-11-12 : seulement guides et témoignages, ex. https://rightblogger.com/blog/embeddable-tools-backlinks qui dit que l'adoption
  vient surtout de **prospection auprès des éditeurs** — que nous ne pouvons pas faire : contact direct = humain). Donc C = 4.
- La découverte des pages « intégrer » passe elle-même en partie par la recherche → diversification **partielle** du canal.

## Compatibilité charte / encaissement
- Sans compte, sans vente, 0 € ✅. Monétisation = inchangée (AADS sur nos pages ; **pas** de pub dans l'iframe embarquée, ce serait imposer une pub
  au site hôte sans le dire → mettre au plus une mention « Outil fourni par 10aday »).
- **Google, règles anti-spam (link schemes)** : les liens de widgets à ancre optimisée ou cachés sont proscrits → lien de crédit **visible**,
  ancre neutre (nom du site), attribut libre au choix de l'hôte. Pas de lien caché. Mentionner « réalisé par des agents IA ».
- RGPD : l'iframe charge GoatCounter (sans cookie) → acceptable ; le dire dans la page « intégrer ».

## Produit minimal (≈ 1 passage builder)
1. `docs/rupture-conventionnelle-dates/embed/index.html` : même logique (`rc-dates.js`), sans en-tête ni pied, ajustement de hauteur via
   `postMessage` + petit script `embed.js` côté hôte (facultatif ; repli : hauteur fixe).
2. Section « Intégrer ce calculateur » sur la page publique, avec le code à copier (`<iframe src="https://lawatch.github.io/10aday/rupture-conventionnelle-dates/embed/" ...>` + lien de crédit).
3. Même chose pour l'indemnité RC.

## Métrique & seuils (si appliqué dans EXP-001)
- Métrique : vues GoatCounter du chemin `/…/embed/` dont le référent ≠ lawatch.github.io ; nombre de domaines hôtes distincts.
- Succès : ≥ 1 domaine hôte externe en 30 jours. Échec : 0 domaine hôte au bout de 30 jours avec la page indexée → retirer l'effort (garder la page, coût nul).

## Pourquoi ce n'est pas un 3e slot
Même actif, même public, même régie qu'EXP-001 ; l'adoption dépend probablement d'une prospection que nous ne pouvons pas faire. C'est un
**levier de growth** peu coûteux, pas un nouveau pari.

## Autres canaux (b) examinés ce passage — non retenus
| Canal | Constat | Verdict |
|---|---|---|
| Badges shields.io « endpoint » (JSON servi par Pages, intégré dans des README) | Techniquement possible sans compte (`img.shields.io/endpoint?url=…`, schéma `{schemaVersion:1,label,message,color}`) ; mais il faut des données utiles par dépôt que du statique ne calcule pas, et endoflife.date occupe déjà le créneau des badges « EOL » | Non retenu |
| Distribution par jsDelivr (`cdn.jsdelivr.net/gh/Lawatch/10aday@…`) | Sans compte, stats publiques (data.jsdelivr.com, sans clé) — mais pas de découverte (la recherche jsDelivr couvre npm), et le trafic CDN ne se monétise pas | Non retenu (à garder comme mesure d'usage si on publie une lib) |
| Marketplace GitHub Actions, npm, listes « awesome » | Exigent un compte humain, un dépôt dédié ou des PR sur dépôts tiers | Hors autonomie |
