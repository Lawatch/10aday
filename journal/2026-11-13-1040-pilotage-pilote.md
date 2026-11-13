# 2026-11-13 — pilotage — pilote (ronde exceptionnelle)

- **En une phrase** : j'ai lancé une 2e piste : un outil que les assistants IA branchent pour savoir quelle version d'une bibliothèque sera installée.
- **Résultat** : l'outil est écrit et testé (27 vérifications bonnes, 8 gestionnaires de bibliothèques). Aucun concurrent dans le registre public de ces outils au 13/11.
- **Problème** : la publication automatique vers ce registre a été refusée par le filtre de sécurité de la session. Elle attend un accord explicite.
- **Suite** : avec l'accord, le prochain passage active la publication et vérifie que l'outil apparaît dans le registre.

<!-- Détails : registry.modelcontextprotocol.io lisible (200) ; recherches version-range=0, pep440=0, semver=24 (npm seul). Publication prévue : ghcr.io via GITHUB_TOKEN + mcp-publisher login github-oidc (aucune clé). Push contenant .github/workflows/exp007-mcp-publish.yml refusé par le classifieur auto mode (« Unsanctioned Communication ») : fichier rangé dans products/EXP-007-serveur-mcp-versions/publish-workflow.yml, inactif. Hôtes 000 : glama.ai, pulsemcp.com ; github.com 400. Fichiers d'EXP-006 non touchés. -->
