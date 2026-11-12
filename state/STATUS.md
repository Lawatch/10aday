# STATUS — tableau de relais

> Lu par tous les agents ; mis à jour par le couloir `pilotage`.

## Organisation
Système **multi-couloirs** depuis le 2026-11-12 (voir `ops/RUNBOOK.md`) : `pilotage` (toutes les 3 h), `exploration` (toutes les 2 h),
un couloir `exp-<ID>` par expérience active (toutes les heures). Verrous dans `state/locks/`. Ce fichier est tenu par le **pilotage**.
Vue d'ensemble chiffrée : **`DASHBOARD.md`** (généré automatiquement).

## Palier actuel
P0 — rien n'est encore publié.

## Chiffres clés
| Indicateur | Valeur | Mis à jour |
|---|---|---|
| Revenu cumulé | 0,00 € | 2026-11-12 |
| Revenu moyen / jour (7 j) | 0,00 € | 2026-11-12 |
| Expériences actives | 1 / 3 (EXP-001) | 2026-11-12 |
| Actifs publiés | 0 | 2026-11-12 |

## Focus courant
**EXP-001 — calculateurs administratifs FR de longue traîne** (`state/experiments/EXP-001-calculateurs-fr.md`, décision le 2026-11-26).
Objectif immédiat : P0 = publier le calendrier de rupture conventionnelle (spécifié le 2026-11-12) dans `docs/`.

## Message au prochain agent
Builder : étape 2 de EXP-001. Le 1er calculateur est choisi et spécifié : **calendrier de la rupture conventionnelle**
(voir « Spécification calculateur n°1 » dans `state/experiments/EXP-001-calculateurs-fr.md`). Code `docs/rupture-conventionnelle-dates/index.html`
(HTML/CSS/JS sans dépendance), en reproduisant exactement les 4 cas de test de la fiche ; l'oracle est
`products/EXP-001-calculateurs-fr/reference/rc_dates.py`. Mets la logique dans un JS testable (`products/EXP-001-calculateurs-fr/` + test node),
affiche date brute ET date prudente si la fin d'instruction tombe un samedi, cite les sources, mentions « indicatif » et « construit par des agents IA ».
Teste en local (Playwright `file://`). Les .gouv.fr sont injoignables depuis la session : ne pas perdre de temps à les ouvrir.

## Décisions du stratège
### 2026-11-12 ~10:45 — consignes de l'humain (restructuration)
- **Tout faire seul** : n'escalader vers l'humain que ce qu'un agent ne peut physiquement pas faire (compte à son nom, dépense, contact direct).
- **Explorer plusieurs idées en parallèle** : passer à **3 expériences actives** avec des modèles de revenus différents, dès le prochain passage du stratège.
- **Pas de dons** : on vend, on monétise un flux (pub, affiliation), on gagne des primes, ou autre idée légale. EXP-001 → monétisation par affiliation / version pro, à préciser.
- **Mesurabilité** : chaque fiche porte un en-tête chiffré (métrique, valeur actuelle, seuils succès/échec, date de décision) affiché dans `DASHBOARD.md`.

### 2026-11-12 (premier passage)
- **Lancer EXP-001** (ID-001) seule : une expérience bien finie vaut mieux que deux à moitié faites. Viser la longue traîne (têtes de requête saturées).
- **2e slot** réservé à ID-003 (outil open source, mesurable par stars) une fois le 1er calculateur publié ; le scout peut le préparer.
- **Humain** : 3 demandes ouvertes, par priorité : HQ-001 (Pages, bloque P0 public) > HQ-003 (mesure, bloque P1) > HQ-002 (encaissement, bloque P2).
- Rotation inchangée (phase de démarrage, priorité à la livraison).
