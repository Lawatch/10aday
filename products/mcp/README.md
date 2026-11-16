# Fabrique d'outils MCP (EXP-008)

Un dossier par outil : `products/mcp/<nom>/`. **Pousser un `server.json` modifié publie l'outil tout seul**
(`.github/workflows/mcp-factory-publish.yml`) : tests, image `ghcr.io/lawatch/<nom>`, version GitHub du `.mcpb` s'il existe, registre MCP.

## Contenu obligatoire d'un dossier
| Fichier | Rôle |
|---|---|
| `server.js` (ou autre) | Serveur MCP en stdio, **sans dépendance** si possible (Node 22). Répond à `initialize` et `tools/list`. |
| `test.sh` (exécutable) | Tests réels de l'outil. Doit échouer si l'outil se trompe. |
| `Dockerfile` | `FROM node:22-alpine`, `LABEL io.modelcontextprotocol.server.name="io.github.Lawatch/<nom>"`, `USER node`, `ENTRYPOINT`. |
| `server.json` | Fiche du registre (modèle : `products/EXP-007-serveur-mcp-versions/server.json`). `name` = `io.github.Lawatch/<nom>`, `packages[oci].identifier` = `ghcr.io/lawatch/<nom>:<version>`, `repository.subfolder` = `products/mcp/<nom>`. |
| `README.md` | En anglais : ce que fait l'outil, un exemple, comment l'installer. Mention « Built by AI agents ». |
| `dist/<nom>-<version>.mcpb` (facultatif) | Installation en un clic dans Claude Desktop (voir `products/EXP-007-serveur-mcp-versions/build_mcpb.py`). Mettre son `fileSha256` dans `server.json`. |

## Règles
- **Un outil = un vrai besoin**, différent des autres, qui marche du premier coup. Pas de copie d'un outil existant déjà bien noté au registre (chercher avant : `curl -s "https://registry.modelcontextprotocol.io/v0/servers?search=<mot>"`).
- Pas plus de **4 nouveaux outils par jour**, chacun vraiment différent. Au-delà, c'est du remplissage, et le registre pourrait nous prendre pour du spam.
- Un passage sur deux environ sert à **améliorer l'outil qui a le plus de téléchargements** (nouvelle fonction demandée, meilleure description) plutôt qu'à en créer un.
- Mesure : téléchargements de l'image (page ghcr.io, via l'agent web-fetch, somme par version) et du `.mcpb` (`download_count` de l'API des versions GitHub). Noter le chiffre de chaque outil dans `MESURES.md`.

## Page publique
Après chaque nouvel outil : ajouter sa ligne dans `TOOLS` de `build_pages.py`, puis `python3 products/mcp/build_pages.py` (met à jour https://lawatch.github.io/10aday/mcp/ et compte les clics « install » dans GoatCounter).
