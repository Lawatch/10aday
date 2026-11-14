---
id: EXP-XXX
titre: Nom en français courant, compréhensible par n'importe qui
categorie: Famille de la piste, en clair (ex. « Sites web gratuits », « Bibliothèques de code », « Outils pour assistants IA », « Primes et concours »). Réutiliser une famille existante si possible.
en_clair: 1-2 phrases. Ce qu'on fait, pour qui, et comment ça rapporterait de l'argent.
deja_fait: Ce qui existe vraiment aujourd'hui (ex. « 3 pages en ligne », « rien encore »).
resultat: Le dernier chiffre mesuré, avec sa date (ex. « 12 visiteurs la semaine du 18/11 », « 0 € »).
bloque_par: Ce qui empêche d'avancer, en clair, ou « rien ».
prochaine_etape: La prochaine action concrète, en une phrase.
on_arrete_si: La condition d'arrêt, chiffrée et datée (ex. « 0 visiteur le 26/11 »).
statut: active
modele_revenu: vente
hypothese: Si on <fait X> pour <public Y>, alors <résultat mesurable Z> d'ici <date>.
metrique: ex. ventes / visites externes / semaine
seuil_succes: ex. ≥ 1 vente ou ≥ 50 visites/semaine
seuil_echec: ex. 0 visite après 7 jours en ligne
valeur_actuelle: 0
revenu_total_eur: 0
lancee_le: AAAA-MM-JJ
decision_le: AAAA-MM-JJ (7 jours maximum après le lancement)
poids: 1
lien_public:
verdict:
---
<!--
Les champs titre, en_clair, deja_fait, resultat, bloque_par, prochaine_etape, on_arrete_si et verdict sont LUS PAR L'HUMAIN
dans le tableau de bord : français courant, phrases courtes, chiffres datés, zéro jargon (voir ops/STYLE.md). À tenir à jour à chaque passage.
Les autres champs (hypothese, metrique, seuils…) sont pour les agents.

En-tête lu par ops/dispatch.py et ops/build_dashboard.py : une ligne `clé: valeur`, sans guillemets, sans retour à la ligne.
- statut : active | pause | tuee | reussie
- modele_revenu : vente | trafic-pub | affiliation | service | abonnement | prime | autre  (PAS de dons)
- poids : 1 à 5. Part des passages d'opérateur donnée à cette piste (le pilote l'augmente quand un signal apparaît)
- valeur_actuelle : dernière valeur MESURÉE de la métrique (texte court, ex. "12 visites/sem (2026-11-20)")
- verdict : rempli à la clôture, en clair (ex. « Arrêtée le 26/11 : 0 visiteur en 2 semaines. Google met plus longtemps que prévu à envoyer du monde. »)
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
