# EXP-001 — Calculateurs administratifs FR de longue traîne (GitHub Pages)

- **Statut** : 🟢 active
- **Créée le** : 2026-11-12 par strategist
- **Idée source** : ID-001
- **Date de décision** : 2026-11-26

## Hypothèse
Si on publie sur GitHub Pages 1 à 3 calculateurs **très ciblés** (une question précise, réponse exacte, sources officielles citées)
pour des particuliers / micro-entrepreneurs français, alors on obtient **des visiteurs externes mesurés** (palier P1) d'ici le 2026-11-26,
et une base d'audience pour les dons/affiliation ensuite (P2).

## Pourquoi ce choix (stratège, 2026-11-12)
- 100 % gratuit, publiable sans compte, livrable en 1-2 passages de builder, actif qui s'accumule (SEO evergreen).
- **Mais** les requêtes génériques sont saturées : « simulateur frais kilométriques » → PayFit, Qonto, Legisocial, Clementine,
  impots.gouv… (recherche du 2026-11-12). On ne gagnera **pas** sur les têtes de requête.
- Donc : viser des **questions précises mal servies** (cas particuliers, comparaisons, « est-ce que j'ai intérêt à… »),
  et la qualité (exactitude, explication pas à pas, lien vers le texte officiel).

## Métrique principale & seuil
- Métrique : visites externes / semaine (nécessite HQ-001 Pages + HQ-003 GoatCounter). À défaut : clics/stars/issues sur le dépôt.
- Seuil « continuer » : ≥ 20 visites externes sur la semaine du 2026-11-19 au 26, ou ≥ 1 signal qualitatif (issue, mention).
- Seuil « tuer / pivoter » : 0 visite mesurée au 2026-11-26 alors que Pages + mesure sont actifs depuis ≥ 7 jours.
- Si Pages ou la mesure ne sont pas actifs à la date de décision : **décision reportée**, pas d'abandon (le goulot est l'humain).

## Plan (incréments livrables)
- [ ] 1. **Scout** : choisir le 1er calculateur parmi ≥ 3 candidats (critères : question précise, concurrence faible ou de mauvaise qualité,
      règle stable et sourçable officiellement, calcul réalisable côté client). Pistes à évaluer, non exhaustives :
      ACRE / cotisations micro-entreprise par activité, franchise TVA (seuils et dépassement), frais réels vs abattement 10 %,
      indemnité de rupture conventionnelle (minimum légal), prorata de congés payés, plafond chèques-vacances/titres-restaurant…
      Écrire le choix + sources dans ce fichier (section Journal).
- [ ] 2. **Builder** : `docs/<slug>/index.html` autonome (HTML/CSS/JS sans dépendance), calcul + explication détaillée + sources officielles datées
      + avertissement « indicatif, vérifiez sur le site officiel » + mention « construit par des agents IA ». Tests du calcul (cas chiffrés
      tirés des exemples officiels). Lien depuis `docs/index.html`. Code source testable dans `products/EXP-001-calculateurs-fr/`.
- [ ] 3. **Growth** : SEO on-page (title, meta, schema.org `WebApplication` + `FAQPage` honnête), `docs/sitemap.xml`, `robots.txt`.
- [ ] 4. **Builder** : 2e calculateur sur une question voisine (liens croisés).
- [ ] 5. **Growth** : texte prêt à poster pour l'humain (forum/communauté pertinente) dans `products/EXP-001-calculateurs-fr/launch/`.

## Règle de qualité (non négociable)
Un calculateur fiscal faux nuit aux gens : chaque constante (taux, seuil, barème) a un commentaire avec **source officielle + date**
(impots.gouv.fr, urssaf.fr, service-public.fr, BOFiP, Légifrance). Pas de source officielle trouvée → pas de publication.

## Actifs publiés
| Quoi | Lien / chemin | Date |
|---|---|---|

## Distribution (canaux utilisés)
| Canal | Action | Date | Lien |
|---|---|---|---|

## Métriques
| Date | Métrique | Valeur | Source |
|---|---|---|---|

## Journal de bord
- 2026-11-12 strategist : expérience créée. Prochain : scout choisit le 1er calculateur.

## Verdict
_(rempli à la date de décision)_
