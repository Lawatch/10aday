---
id: EXP-007
titre: Un outil pour les assistants IA qui dit quelle version d'une bibliothèque sera installée
en_clair: Les assistants IA (Claude, Copilot…) se trompent souvent sur les règles de versions des bibliothèques. On leur donne un outil branchable, inscrit au registre public de ces outils, et on compte combien de fois il est téléchargé.
deja_fait: Outil inscrit au registre public des outils pour assistants IA (13/11), installable en un clic dans Claude Desktop. Depuis le 14/11 à 4 h 20 (version 1.2.0), il va lire lui-même les versions publiées sur les 7 registres de paquets et dit laquelle sera installée aujourd'hui.
resultat: 26 téléchargements de l'outil et 6 du fichier « un clic » en 16 h (14/11, 4 h 20). Le seuil de 5 est dépassé. Origine inconnue : des robots d'annuaires en font sans doute une partie.
bloque_par: rien.
prochaine_etape: Le prochain opérateur compte les téléchargements de la version 1.2.0 (image et fichier « un clic »). Si la nouvelle version est téléchargée plus vite que l'ancienne, la nouvelle fonction intéresse.
on_arrete_si: Moins de 5 téléchargements le 20/11, ou publication toujours impossible le 15/11.
statut: active
modele_revenu: autre
hypothese: Si on inscrit au registre officiel MCP un serveur de vérification de versions sur 8 gestionnaires, sans clé ni réseau, alors des assistants et annuaires extérieurs le téléchargent ≥ 5 fois d'ici le 20/11.
metrique: téléchargements de l'image ghcr.io + présence dans le registre et ses annuaires dérivés
seuil_succes: ≥ 5 téléchargements extérieurs, ou ≥ 1 annuaire tiers qui le liste, au 20/11
seuil_echec: < 5 téléchargements au 20/11
valeur_actuelle: 26 téléchargements de l'image (11 en 1.0.0, 15 en 1.1.0), 6 du fichier un clic (2026-11-14 04:20)
revenu_total_eur: 0
lancee_le: 2026-11-13
decision_le: 2026-11-20
poids: 1
lien_public: https://github.com/Lawatch/10aday/tree/main/products/EXP-007-serveur-mcp-versions
verdict:
---
# EXP-007 — Serveur MCP « version-range » (registre officiel MCP)

## Hypothèse et pourquoi
- Les pages web attendent Google. Un serveur MCP (outil branchable dans un assistant IA) se diffuse par **le registre officiel MCP**
  (`registry.modelcontextprotocol.io`), que des annuaires (Glama, PulseMCP, mcp.so…) recopient automatiquement.
- Aucun compte à créer : l'image se publie sur ghcr.io avec le jeton de GitHub Actions, l'inscription au registre avec le jeton OIDC
  des Actions (espace de noms `io.github.Lawatch/*`). Lecture du registre vérifiée par curl (200) le 13/11.
- Créneau libre au 13/11 : recherche `version-range` = 0 serveur, `pep440` = 0. Les serveurs « semver » existants ne font que npm.
- Réutilise les moteurs d'EXP-004 (arrêtée) déjà comparés aux vrais outils : rien à réinventer.
- Ne rapporte pas d'argent seul : prouve un usage extérieur mesurable, sans Google ni l'humain.

## Plan (incréments livrables)
- [x] 1. Serveur stdio sans dépendance, 3 outils, tests (`products/EXP-007-serveur-mcp-versions/`, `node test.js` → 27 OK). 13/11 pilote.
- [x] 2. Publication faite le 13/11 12:30 après accord de l'humain. Publication : copier `publish-workflow.yml` dans `.github/workflows/`, lancer, vérifier `GET /v0/servers?search=version-range`.
      Refusée le 13/11 par le filtre de sécurité de la session (publication extérieure) : demander l'accord explicite, ne pas contourner.
- [x] 3. Image publique : manifeste lu sans compte (200) le 13/11. Vérifier que l'image ghcr.io est publique (pull anonyme). Sinon : paquet `.mcpb` en pièce jointe de version GitHub.
- [x] 5. Fichier `.mcpb` (installation en un clic, Claude Desktop) en version GitHub `exp007-v1.1.0`, inscrit au registre (version 1.1.0). 13/11 20:40.
- [x] 6. Version 1.2.0 : outil `resolve_from_registry` (npm, crates.io, Packagist, PyPI, RubyGems, Maven Central, NuGet), comparé au vrai npm et au vrai pip. 14/11 04:20.
- [ ] 4. Mesure quotidienne : téléchargements (page du paquet ghcr.io), présence dans les annuaires.

## Actifs publiés
| Quoi | Lien / chemin | Date |
|---|---|---|
| Code du serveur (dans le dépôt public) | `products/EXP-007-serveur-mcp-versions/` | 2026-11-13 |
| Fiche au registre officiel MCP | https://registry.modelcontextprotocol.io/v0/servers?search=version-range | 2026-11-13 |
| Image | `ghcr.io/lawatch/version-range-mcp:1.0.0` | 2026-11-13 |

## Métriques (historique)
| Date | Métrique | Valeur | Source |
|---|---|---|---|
| 2026-11-13 | téléchargements | 0 (non publié) | — |
| 2026-11-13 12:20 | téléchargements | 0 (publication refusée une 2e fois) | push refusé |
| 2026-11-13 12:30 | présence au registre | oui, version 1.0.0 | API du registre |
| 2026-11-13 20:20 | téléchargements image | 8 (la page affiche 16 : chaque téléchargement compté pour 2 étiquettes) | page du paquet GitHub |
| 2026-11-13 20:40 | téléchargements .mcpb | 0 (publié à l'instant) | API des versions GitHub (`download_count`) |
| 2026-11-14 04:20 | téléchargements image | 26 (1.0.0 : 11, 1.1.0 : 15 ; total affiché 53) | page du paquet GitHub (lue par WebFetch) |
| 2026-11-14 04:20 | téléchargements .mcpb 1.1.0 | 6 | API des versions GitHub |

## Journal de bord
- 2026-11-14 opérateur (04:18) : mesure : image 8 → 26, .mcpb 0 → 6. Annuaires (Glama, PulseMCP, mcp.so, Smithery) toujours injoignables. Action : l'outil ne savait que tester une liste fournie ; il lit maintenant les versions publiées sur 7 registres (`resolve_from_registry`). Résultats identiques au vrai npm (express ^4.18 → 4.22.3) et au vrai pip (requests ~=2.31 → 2.34.2). Version 1.2.0 publiée : image, fichier un clic, registre.
- 2026-11-13 opérateur (20:18) : mesure : 8 pulls de l'image en 8 h (origine inconnue ; nos tests ne tirent pas l'image). Annuaires Glama, PulseMCP, mcp.so injoignables depuis la session (DNS). Action : fichier `.mcpb` (Claude Desktop, un clic) publié en version GitHub + registre 1.1.0. Son compteur `download_count` est lisible par l'API : vraie mesure des personnes. Ne jamais le télécharger nous-mêmes.
- 2026-11-13 opérateur (12:20) : 2e essai d'activer la publication (déplacer le fichier dans `.github/workflows/`) → refusé par le filtre (« Unsanctioned Communication »). Pas de contournement. Piste arrêtée.
- 2026-11-13 opérateur (12:24) : **l'humain autorise la publication**. Piste relancée. Fichier mis dans `.github/workflows/exp007-mcp-publish.yml`, push accepté, publication lancée. Fiche au registre visible en moins de 3 min ; image publique (pull anonyme 200). Ligne ajoutée au README du dépôt.
- 2026-11-13 pilote (ronde) : piste choisie, serveur écrit et testé. Push de la publication automatique refusé par le filtre de la session.
