# Annuaires d'outils gratuits « sans compte » — 2026-11-13 03:20 UTC (scout)

Question : peut-on faire lister nos outils (EXP-001, EXP-004) dans des annuaires ou listes d'outils gratuits,
**sans compte humain et depuis une session**, pour avoir des visiteurs qui ne viennent pas des moteurs (option (b) du stratège) ?

## Ce qui a été trouvé (WebSearch 13/11)
| Cible | Soumission | Accès depuis la session | Remarque |
|---|---|---|---|
| NoSignupTools (nosignuptools.com) | formulaire, revue 24-48 h (d'après une revue tierce, chatgate.ai) | **bloqué** (curl 000, WebFetch ENOTFOUND) | thème = outils web sans inscription : colle parfaitement à EXP-004 |
| Rankoland | « no sign-ups, no fees », listing immédiat (sa propre page Product Hunt) | bloqué | annuaire généraliste, auto-promo, trafic inconnu |
| NewTool.site | gratuit, pas de connexion sociale forcée | bloqué | idem |
| Automation Hub (pages.dev) | « No account required », revue 48 h | bloqué | thème IA/automatisation : hors sujet |
| Peerlist ToolIndex | « no account required » | non testé | idem |
| Marginalia Search (petit moteur indépendant) | A : bouton « ajouter » si le site est déjà connu ; B : PR GitHub ; C : e-mail sans réponse | `search.marginalia.nu` bloqué | source primaire : github.com/MarginaliaSearch/submit-site-to-marginalia-search (lue le 13/11) |
| Mojeek | **plus de soumission** (page « add URL » retirée pour cause de spam) ; découverte par liens | — | community.mojeek.com, fils « how can I add my website » |
| FutureTools, Toolpilot | compte obligatoire | — | écartés |

Aucun chiffre de visiteurs envoyés par ces annuaires n'a été trouvé. Un guide tiers prévient : beaucoup de liens `nofollow`,
beaucoup d'annuaires morts. Ces annuaires vivent surtout de l'auto-promotion des créateurs d'outils.

## Verdict
- **Pas l'option (b)** : trafic attendu très faible et non prouvé ; tous les hôtes sont fermés depuis les sessions ;
  soumettre un formulaire sur un site tiers est une action externe → au mieux une demande humaine, et la file est pleine.
- **Exception utile à garder** : NoSignupTools (thème exact d'EXP-004). Une seule soumission manuelle (≈ 3 min humaines) ou l'ouverture
  de l'hôte `nosignuptools.com`. À ne proposer **qu'après** HQ-006/HQ-007, quand une place se libère dans la file.
- Marginalia : le bouton A deviendra possible quand le site sera connu de ce moteur (il le découvrira via le fichier racine d'ID-010).
- **Ne pas réexplorer** les annuaires « submit your AI tool » : marché d'auto-promotion, risque de spam (règle 2) si on en fait plusieurs.

## Leçon
Depuis les sessions, les seuls canaux de découverte sans compte qui marchent sont ceux dont l'hôte est ouvert (IndexNow).
Toute autre piste « sans compte » bute d'abord sur le réseau, puis sur la règle « action externe = humain ».
