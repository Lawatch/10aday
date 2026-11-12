# Guide d'écriture — OBLIGATOIRE pour tout ce que tu écris

Le lecteur est **l'humain** : il n'est pas développeur web ni expert SEO, il lit sur son téléphone, en 30 secondes.
S'il ne comprend pas une phrase du premier coup, elle est ratée.

## Les 8 règles
1. **Français courant.** Écris comme tu parlerais à un ami intelligent qui ne connaît pas le sujet.
2. **Phrases courtes.** Une idée par phrase. 20 mots maximum. Pas de parenthèses imbriquées, pas de points-virgules en cascade.
3. **Du concret.** Dis ce qui existe vraiment et ce qu'une personne verrait : « 5 pages de calcul en ligne », pas « surface SEO élargie ».
4. **Des chiffres avec leur unité et leur date.** « 0 visiteur au 12/11 », « 3 € gagnés », « 15 min de ton temps ».
5. **Zéro jargon interne.** Interdit sans explication : slot, rail, palier P1, HQ-007, cluster, longue traîne, SEO on-page, pilier,
   AGENT_ONLY, ICE, couloir, lane, flux, pivot, monétiser, scalable, funnel, signal qualitatif…
   Si un terme technique est indispensable, explique-le en 5 mots la première fois : « Google (pour qu'il trouve nos pages) ».
6. **Pas de remplissage.** Pas de « il convient de noter », « dans une optique de », « robuste », « levier », « synergie »,
   pas de gras partout, pas d'emoji décoratif.
7. **Dis ce qui ne marche pas, simplement.** « Personne n'est encore venu sur le site », pas « signal P1 non observé à ce stade ».
8. **Termine par une action claire.** Qui fait quoi ensuite, en une phrase.

## Avant / après
| ❌ Avant | ✅ Après |
|---|---|
| « Arbitrer le 3e slot (dossier ID-009 à 168), nettoyer la file humaine (4 ouvertes > 3). » | « J'ai choisi la 3e piste à tester : gagner des concours réservés aux IA. J'ai trié tes demandes en attente. » |
| « 0 visite sur les pages EXP-001 (GoatCounter TOTAL site = 6, dont 5 sur l'accueil) » | « 6 visites sur tout le site, dont 5 sur l'accueil. Aucune sur les calculateurs. » |
| « Élargir la surface SEO longue traîne du cluster contraintes de version » | « J'ai ajouté 2 pages qui répondent à des questions précises que les développeurs tapent dans Google. » |
| « Le pari est bloqué à l'étape 1 : superteam.fun refusé par le proxy (CONNECT 403) » | « Bloqué : nos agents n'ont pas accès au site des concours. Il faut l'autoriser (2 min, voir ta liste de demandes). » |

## Formats imposés
- **Journal** : 4 lignes courtes (voir `journal/_TEMPLATE.md`). Les détails techniques vont dans les fichiers du produit, pas dans le journal.
- **En-tête des expériences** : les champs `en_clair`, `deja_fait`, `resultat`, `prochaine_etape`, `bloque_par` sont lus par l'humain
  dans le tableau de bord → 1 phrase chacun, règles ci-dessus.
- **Demandes à l'humain** (`state/HUMAN_QUEUE.md`) : titre = verbe d'action + durée, ex. « Inscrire le site sur Google (10 min) ».
  Puis : pourquoi en 1 phrase, et les étapes numérotées, cliquables, sans jargon.
- **Le reste** (code, notes de recherche, docs techniques) peut être technique, mais reste clair.
