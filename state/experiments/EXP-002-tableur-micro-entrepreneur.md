---
id: EXP-002
titre: Tableur de gestion pour auto-entrepreneurs, à vendre
categorie: Produits à vendre
en_clair: Un tableur pour suivre son chiffre d'affaires et ses cotisations, vendu quelques euros.
deja_fait: Rien : mise en pause avant de commencer.
resultat: —
bloque_par: Tu as décidé : pas de vente pour l'instant.
prochaine_etape: Rien, tant que la vente n'est pas autorisée.
on_arrete_si: —
statut: pause
modele_revenu: vente
hypothese: Un tableur Excel + LibreOffice soigné (livre des recettes obligatoire, seuils, cotisations Urssaf estimées, paramètres sourcés) vendu ~12 € trouve au moins 1 acheteur d'ici le 2026-11-26, une fois une boutique ouverte.
metrique: ventes (et téléchargements de la version gratuite)
seuil_succes: ≥ 1 vente au 2026-11-26, ou ≥ 10 téléchargements de la version gratuite si la boutique n'est pas encore ouverte
seuil_echec: 0 vente après 10 jours en boutique avec la page de présentation publiée et liée depuis EXP-001
valeur_actuelle: 0 (produit non construit)
revenu_total_eur: 0
lancee_le: 2026-11-12
decision_le: 2026-11-26
prochain_role: builder
lien_public:
verdict: En pause depuis le 12/11 : pas de vente pour l'instant (ta décision).
---
# EXP-002 — Tableur de gestion micro-entrepreneur (vente)

- **Statut** : 🟡 en pause (pas de vente pour le moment — décision humaine du 2026-11-12)
- **Créée le** : 2026-11-12 par strategist
- **Idée source** : ID-002 (packs de templates vendus à petit prix)

## Hypothèse et pourquoi (stratège, 2026-11-12)
- **Modèle de revenu différent d'EXP-001** (vente directe d'un produit numérique, pas de dépendance au volume de trafic pub/affiliation).
- **Demande prouvée** : des tableurs équivalents se vendent déjà — « comptabilité auto entreprise sur Excel » à 19 € sur Gumroad
  (https://datapreneurfr.gumroad.com/l/comptabilite-auto-entreprise-sur-excel), « Livre de recettes automatisé 2026 » à 24,90 € sur Payhip
  (https://payhip.com/b/8seNu), services équivalents sur ComeUp. Le **livre des recettes est obligatoire** pour tout micro-entrepreneur
  (besoin permanent, public de ~2,5 M de personnes).
- **Concurrence gratuite** forte (creerentreprise.fr, legalnest) → notre angle : version **gratuite honnête** (livre des recettes seul,
  aimant à trafic, publiée sur `docs/`) + version **complète payante** (~12 €) : tableau de bord, seuils (micro + franchise TVA) avec alertes,
  cotisations estimées par activité, versement libératoire, échéancier déclarations, paramètres **sourcés et modifiables** (onglet « Paramètres »
  avec source officielle + date pour chaque taux), formats **.xlsx ET .ods** (LibreOffice, souvent oublié par la concurrence).
- Synergie : même public que les calculateurs d'EXP-001 (liens croisés), mais le pari de revenu est indépendant.
- Goulot connu : **HQ-002** (boutique). Le produit doit être **prêt à mettre en ligne** avant que l'humain ouvre la boutique.

## Règle de qualité (non négociable)
Taux et seuils changent chaque année : chaque constante dans l'onglet « Paramètres » porte **source officielle + date** (urssaf.fr,
autoentrepreneur.urssaf.fr, impots.gouv.fr, BOFiP, service-public.fr — via WebSearch restreint aux domaines si les sites sont bloqués).
Point instable (seuils de franchise TVA 2026, cf. `state/ideas.md` Rejetées) : afficher la valeur en vigueur selon la source la plus récente
**et** un avertissement ; l'utilisateur peut la modifier. Mention « estimation indicative, ne remplace pas un expert-comptable ».

## Plan (incréments livrables)
- [ ] 1. **Builder** : générer le tableur par script (Python `openpyxl` → .xlsx ; conversion .ods via LibreOffice headless si disponible,
      sinon `odfpy`) dans `products/EXP-002-tableur-micro-entrepreneur/` (script générateur + fichiers produits). Onglets : Paramètres (sourcés),
      Recettes (livre conforme : date, référence, client, nature, montant, mode de règlement), Achats (si activité de vente), Tableau de bord,
      Déclarations. Tester les formules (recalcul LibreOffice headless ou vérif. des valeurs) sur un jeu de données d'exemple.
- [ ] 2. **Builder** : version gratuite (livre des recettes seul) + page `docs/tableur-micro-entrepreneur/index.html` (présentation honnête,
      captures, téléchargement gratuit, bouton « version complète » désactivé tant que la boutique n'existe pas). Ligne dans `docs/index.html`.
- [ ] 3. **Growth** : fiche produit prête à copier-coller pour la boutique (`products/EXP-002-tableur-micro-entrepreneur/launch/fiche-boutique.md` :
      titre, description, prix, visuels), SEO de la page, liens croisés avec EXP-001.
- [ ] 4. Mise en vente dès que HQ-002 est fait (l'humain colle la fiche) ; mesurer ventes + téléchargements.

## Actifs publiés
| Quoi | Lien / chemin | Date |
|---|---|---|

## Distribution (canaux utilisés)
| Canal | Action | Date | Lien |
|---|---|---|---|

## Métriques (historique)
| Date | Métrique | Valeur | Source |
|---|---|---|---|

## Journal de bord
- 2026-11-12 strategist : expérience créée (2e slot, modèle « vente »). Prochain : builder, incrément 1.

## Verdict
_(rempli à la date de décision)_
