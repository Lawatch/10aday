# Runbook — protocole de chaque passage d'agent

Chaque routine lance une session **fraîche** : elle ne se souvient de rien. Ce dépôt est la seule mémoire.
Suis ces étapes dans l'ordre.

## 0. Préparer le dépôt
- Si `Lawatch/10aday` n'est pas dans le répertoire de travail : appelle `add_repo` (owner `Lawatch`, repo `10aday`, access `push`), puis clone-le comme indiqué.
- Travaille sur la branche **`main`** : `git fetch origin main && git checkout main && git pull --rebase origin main`.
  (C'est la branche d'état partagée, l'humain l'a autorisée explicitement pour ce système.)

## 1. Verrou (éviter deux agents en même temps)
- Lis `state/STATUS.md`. Si `Verrou` contient un horodatage de moins de **50 minutes**, un autre agent travaille : écris une ligne dans `journal/` (« passage annulé, verrou actif ») seulement si utile, puis arrête-toi.
- Sinon, écris ton horodatage UTC + ton rôle dans `Verrou`, commit (`chore: lock <rôle>`) et push immédiatement. Si le push échoue sur conflit : `git pull --rebase`, relis le verrou, recommence.

## 2. Choisir son rôle
- Le rôle par défaut est `Prochain rôle` dans `state/STATUS.md` (fixé par la rotation de `ops/schedule.md`).
- Tu peux en changer **si c'est clairement plus utile** (ex : une expérience arrive à sa date de décision → analyste). Justifie-le dans le journal.
- Lis la fiche de ton rôle dans `agents/<rôle>.md`.

## 3. S'imprégner (≤ 5 min)
Lis, dans cet ordre : `CHARTER.md`, `state/STATUS.md`, `state/LEARNINGS.md`, `state/HUMAN_QUEUE.md` (réponses de l'humain ?), les expériences actives dans `state/experiments/`, les 3 derniers fichiers de `journal/`.

## 4. Travailler
Fais le travail de ton rôle. Vise **un résultat concret et terminé** plutôt que trois choses à moitié faites.
Committe au fil de l'eau avec des messages clairs (`feat(EXP-003): ...`, `research: ...`, `data: ...`).

## 5. Passer le relais (obligatoire, même si le passage a échoué)
1. Crée `journal/AAAA-MM-JJ-HHMM-<rôle>.md` (modèle : `journal/_TEMPLATE.md`).
2. Mets à jour `state/STATUS.md` : focus courant, chiffres clés, **message au prochain agent**, `Prochain rôle` (rotation suivante), incrémente `Index de rotation`, **vide le `Verrou`**.
3. Si tu as appris quelque chose de réutilisable → `state/LEARNINGS.md`.
4. Si tu as besoin de l'humain → `state/HUMAN_QUEUE.md`.
5. `git pull --rebase origin main && git push origin main` (réessaie jusqu'à 4 fois avec attente 2s, 4s, 8s, 16s en cas d'erreur réseau).

## Garde-fous
- Respecte `CHARTER.md`. En cas de doute sur une action externe : ne la fais pas, mets-la dans `HUMAN_QUEUE.md`.
- Ne réécris jamais l'historique (`push --force` interdit sur `main`).
- Ne supprime pas le travail d'un autre agent sans le justifier dans le journal.
- Ne modifie `CHARTER.md` que pour ajouter une règle plus stricte ; tout assouplissement passe par l'humain.
- Budget temps : vise 30-40 minutes de travail par passage.
