# Runbook — protocole de chaque passage d'agent

Chaque passage est une session **fraîche** : elle ne se souvient de rien. Ce dépôt est la seule mémoire.
Plusieurs agents tournent **en parallèle**, un par **couloir**. Ton couloir et ton rôle sont donnés dans ton prompt.

## Les couloirs
| Couloir | Fréquence | Rôles | Rôle du couloir |
|---|---|---|---|
| `pilotage` | toutes les 3 h | strategist (heures multiples de 6) / analyst | Arbitre le portefeuille, mesure, tue/lance des expériences |
| `exploration` | toutes les 2 h | scout | Trouve et valide de nouvelles idées, prépare les fiches |
| `exp-<ID>` | toutes les heures | builder / growth (champ `prochain_role` de la fiche) | Fait avancer **une** expérience |

Le nombre de couloirs `exp-*` = nombre d'expériences `statut: active` (le stratège vise **3 en parallèle**, plafond 4).
Réglages dans `ops/dispatch.py` (fréquences, plafond de sessions par tick).

## 0. Préparer le dépôt
- Le dépôt est déjà cloné. Travaille sur **`main`** : `git fetch origin main && git checkout main && git pull --rebase origin main`.
- Si un push renvoie 403 : n'insiste pas, arrête-toi (l'absence de journal sera repérée par l'analyste).
- Réseau : les sessions tournent dans l'environnement cloud « 10aday ». Hôtes autorisés en plus des registres de paquets :
  `lawatch.github.io` (site publié), `api.github.com`, `10aday.goatcounter.com` (stats), et les sources officielles
  `www.legifrance.gouv.fr`, `code.travail.gouv.fr`, `travail-emploi.gouv.fr`, `www.service-public.fr`, `entreprendre.service-public.fr`,
  `www.urssaf.fr`, `www.impots.gouv.fr`.
  Ajoutés le 12/11 : `superteam.fun` (concours EXP-005 ; clé API injectée automatiquement par le proxy une fois enregistrée par l'humain,
  envoyer une valeur factice dans `Authorization: Bearer`), `api.indexnow.org` (signaler soi-même chaque nouvelle page à Bing/Yandex). WebSearch/WebFetch fonctionnent en général pour le reste.
  Un hôte indispensable est bloqué ? Ajoute une demande dans `HUMAN_QUEUE.md` avec l'hôte exact et pourquoi.

## 1. Verrou de ton couloir
- Fichier : `state/locks/<couloir>.lock`, contenu : `AAAA-MM-JJTHH:MMZ <rôle>`.
- S'il existe et a **moins de 50 min** : un agent de ton couloir travaille encore → arrête-toi sans rien committer.
- Sinon : crée-le, commit `chore(<couloir>): lock`, push immédiatement. En cas de conflit : `git pull --rebase`, relis, recommence.

## 2. Propriété des fichiers (pour éviter les conflits entre couloirs)
| Fichier | Qui l'écrit |
|---|---|
| `state/experiments/EXP-<ID>-*.md` | le couloir `exp-<ID>` ; le `pilotage` peut changer `statut`, `verdict`, `decision_le` |
| `products/EXP-<ID>-*/`, `docs/<slug-de-l-expérience>/` | le couloir `exp-<ID>` |
| `state/STATUS.md`, `ops/*`, `agents/*`, `CHARTER.md` (durcissement seulement) | `pilotage` (strategist) |
| `state/ledger.csv`, `state/LEARNINGS.md` | `pilotage` (analyst ou strategist) |
| `state/ideas.md`, `research/` | `exploration` (et le strategist pour reclasser) |
| `state/HUMAN_QUEUE.md` | tout le monde peut **ajouter** une demande ; le strategist fait le ménage |
| `docs/index.html` | tout couloir `exp-*` peut y ajouter **sa** ligne dans la liste des projets |
| `journal/AAAA-MM-JJ-HHMM-<couloir>-<rôle>.md` | chacun crée le sien (noms uniques) |
| `DASHBOARD.md`, `dashboard/` | **personne** : générés par le répartiteur (`ops/build_dashboard.py`) |

Un enseignement à partager ? Écris-le dans ton journal (section « Enseignement ») : l'analyste le consolide dans `LEARNINGS.md`.
Si un `git pull --rebase` produit un conflit : résous-le en gardant le travail des deux côtés, jamais en écrasant celui d'un autre.

## 3. S'imprégner (≤ 5 min)
`CHARTER.md` → `state/STATUS.md` (décisions du stratège) → la fiche de ton expérience (si couloir `exp-*`) → `state/LEARNINGS.md`
→ `state/HUMAN_QUEUE.md` (réponses de l'humain ?) → les 2 derniers journaux de ton couloir.

## 4. Travailler
Fais le travail de ton rôle (`agents/<rôle>.md`). Vise **un résultat concret et terminé**. Teste réellement.
Committe au fil de l'eau : `feat(EXP-003): ...`, `research: ...`, `data: ...`.

## 5. Passer le relais (obligatoire, même en cas d'échec)
**Avant d'écrire quoi que ce soit pour l'humain, relis `ops/STYLE.md`.** Le journal fait 4 lignes. Les champs « en clair » de la fiche sont ce que l'humain voit.
1. Crée `journal/AAAA-MM-JJ-HHMM-<couloir>-<rôle>.md` (modèle : `journal/_TEMPLATE.md`).
2. Couloir `exp-*` : mets à jour l'en-tête de la fiche — **les champs lus par l'humain** (`deja_fait`, `resultat`, `bloque_par`, `prochaine_etape`, en français courant), `valeur_actuelle` (dernière mesure réelle), `prochain_role`
   (builder si quelque chose reste à construire, growth si l'actif est prêt mais sans trafic), `lien_public`, et le Journal de bord.
3. Couloir `pilotage` : mets à jour `state/STATUS.md` (décisions, chiffres, palier).
4. Besoin de l'humain → `state/HUMAN_QUEUE.md` (seulement ce qu'un agent ne peut physiquement pas faire).
5. **Supprime** `state/locks/<couloir>.lock`.
6. `git pull --rebase origin main && git push origin main` (jusqu'à 4 essais, attente 2 s, 4 s, 8 s, 16 s).

## Garde-fous
- Respecte `CHARTER.md`. En cas de doute sur une action externe : ne la fais pas, ajoute une demande dans `HUMAN_QUEUE.md`.
- Jamais de `push --force`, jamais de réécriture d'historique.
- Ne touche pas aux fichiers d'un autre couloir (sauf droits listés ci-dessus).
- Budget temps : 30-40 minutes de travail par passage.
