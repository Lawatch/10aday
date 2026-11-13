# Runbook — comment se déroule un passage

Chaque passage est une session **fraîche**, sans mémoire. Ce dépôt est la seule mémoire.
Il y a **6 passages par jour** (un toutes les 4 h), **un seul agent à la fois** : 1 pilote par jour, 5 opérateurs.
Peu de passages, donc chaque passage doit compter : un cycle complet, un résultat visible.

## Les deux rôles
| Rôle | Quand | Ce qu'il fait |
|---|---|---|
| `pilote` | 1 fois par jour (08 h UTC) | Mesure tout, arrête ou lance des pistes, règle la machine, réécrit `state/STATUS.md` |
| `operateur` | les 5 autres passages | Prend **une** piste et fait un cycle complet : mesurer → décider → construire → faire connaître → consigner |

Les deux agissent comme le **propriétaire** : ils décident seuls (voir `CHARTER.md`, « Mode propriétaire »).

## 1. Démarrer
- `git fetch origin main && git checkout main && git pull --rebase origin main`.
- Verrou : si `state/locks/run.lock` existe et a moins de 3 h, un autre agent travaille → arrête-toi sans rien écrire.
  Sinon écris-y `AAAA-MM-JJTHH:MMZ <rôle>`, commit `chore: lock`, push.
- Si un push renvoie 403 : arrête-toi.

## 2. Lire (5 min, pas plus)
`CHARTER.md` → `state/STATUS.md` → la fiche de ta piste (`state/experiments/`) → `state/LEARNINGS.md` → les 2 derniers journaux.

## 3. Travailler
Suis ta fiche de rôle (`agents/<rôle>.md`). Teste réellement ce que tu construis. Committe au fil de l'eau.

## 4. Terminer (obligatoire, même en cas d'échec)
1. Mets à jour l'en-tête des fiches touchées (champs lus par l'humain : `deja_fait`, `resultat`, `bloque_par`, `prochaine_etape`, `verdict`).
2. Journal de 4 lignes (`journal/_TEMPLATE.md`), nommé `journal/AAAA-MM-JJ-HHMM-<EXP-00X ou pilotage>-<rôle>.md`.
3. Un enseignement utile aux suivants → une ligne datée dans `state/LEARNINGS.md`.
4. `python3 ops/build_dashboard.py` (met à jour `DASHBOARD.md` et la page de suivi `docs/suivi/`).
5. Supprime `state/locks/run.lock`. `git pull --rebase origin main && git push origin main` (4 essais, attente 2 s, 4 s, 8 s, 16 s).

## Où sont les choses
| Quoi | Où |
|---|---|
| Règles du projet | `CHARTER.md` |
| État et priorités | `state/STATUS.md` (tenu par le pilote, 40 lignes max) |
| Pistes | `state/experiments/EXP-*.md` (l'en-tête alimente le tableau de bord) |
| Idées en réserve | `state/ideas.md`, `research/` |
| Argent réel | `state/ledger.csv` (`type` = `revenu` ou `depense`) |
| Clés et comptes demandés une fois | `state/HUMAN_QUEUE.md` |
| Ce qui est construit / publié | `products/`, `docs/` (GitHub Pages : `https://lawatch.github.io/10aday/`) |

## Réseau
Les sessions tournent dans l'environnement « 10aday ». Sites joignables en direct, en plus des registres de paquets :
`lawatch.github.io`, `api.github.com`, `raw.githubusercontent.com`, `10aday.goatcounter.com`, `api.indexnow.org` (signaler nos pages à Bing),
`superteam.fun` (clé injectée automatiquement par le proxy, envoyer `Authorization: Bearer proxy-injected`), et les sites officiels français
(`www.legifrance.gouv.fr`, `code.travail.gouv.fr`, `travail-emploi.gouv.fr`, `www.service-public.fr`, `entreprendre.service-public.fr`, `www.urssaf.fr`, `www.impots.gouv.fr`).
WebSearch et WebFetch marchent pour le reste. Un site indispensable est bloqué ? Note-le dans `state/HUMAN_QUEUE.md` (demande faite une fois) et avance autrement.

## Garde-fous
- Jamais de `push --force`. Pas de secrets dans le dépôt.
- En cas de doute sur une action extérieure au dépôt : relis les règles absolues de `CHARTER.md`. Si elle les respecte, fais-la. Sinon, ne la fais pas.
