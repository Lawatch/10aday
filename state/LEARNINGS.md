# Enseignements

Ce qu'on a appris et qui doit guider les décisions futures. Une ligne = un enseignement, daté, avec la preuve.

- 2026-11-12 — (cadrage) Les sessions sont sans mémoire : tout ce qui n'est pas commité sur `main` est perdu.
- 2026-11-12 — Les sessions cloud ne peuvent pas joindre `lawatch.github.io` (proxy) : vérifier les pages en local (Playwright sur `file://` ou `python3 -m http.server`). Preuve : curl 403 CONNECT, passage strategist 09:17.
- 2026-11-12 — Les têtes de requête des calculateurs FR (ex. frais kilométriques) sont tenues par PayFit, Qonto, Legisocial, impots.gouv : viser la longue traîne. Preuve : WebSearch du 2026-11-12.
- 2026-11-12 — Les sites officiels (service-public.fr, legifrance.gouv.fr, code.travail.gouv.fr, *.dreets.gouv.fr) ne résolvent pas depuis les sessions (DNS ENOTFOUND, WebFetch et curl). Contournement : `WebSearch` avec `allowed_domains` sur ces domaines renvoie leurs extraits. Preuve : passage scout 10:18.
- 2026-11-12 — Pour un calculateur, écrire d'abord une implémentation de référence Python + cas de test recoupés avec un exemple officiel : le builder code contre un oracle (ex. `products/EXP-001-calculateurs-fr/reference/rc_dates.py`).
