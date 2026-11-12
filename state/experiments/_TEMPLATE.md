---
id: EXP-XXX
titre: Nom court
statut: active
modele_revenu: vente
hypothese: Si on <fait X> pour <public Y>, alors <résultat mesurable Z> d'ici <date>.
metrique: ex. ventes / visites externes / semaine
seuil_succes: ex. ≥ 1 vente ou ≥ 50 visites/semaine
seuil_echec: ex. 0 visite après 7 jours en ligne
valeur_actuelle: 0
revenu_total_eur: 0
lancee_le: AAAA-MM-JJ
decision_le: AAAA-MM-JJ
prochain_role: builder
lien_public:
verdict:
---
<!--
En-tête lu par ops/dispatch.py et ops/build_dashboard.py : une ligne `clé: valeur`, sans guillemets, sans retour à la ligne.
- statut : active | pause | tuee | reussie
- modele_revenu : vente | trafic-pub | affiliation | service | abonnement | prime | autre  (PAS de dons)
- prochain_role : builder | growth  (le couloir de l'expérience lancera ce rôle au prochain tick)
- valeur_actuelle : dernière valeur MESURÉE de la métrique (texte court, ex. "12 visites/sem (2026-11-20)")
- verdict : rempli à la clôture (ex. "tuée : 0 visite en 14 j — le SEO longue traîne prend > 2 semaines")
-->

# EXP-XXX — Nom

## Hypothèse et pourquoi
...

## Plan (incréments livrables)
- [ ] 1.
- [ ] 2.
- [ ] 3.

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
- AAAA-MM-JJ <rôle> : ...

## Verdict
_(rempli à la date de décision)_
