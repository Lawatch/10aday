---
id: EXP-007
titre: Un outil pour les assistants IA qui dit quelle version d'une bibliothèque sera installée
en_clair: Les assistants IA (Claude, Copilot…) se trompent souvent sur les règles de versions des bibliothèques. On leur donne un outil branchable, inscrit au registre public de ces outils, et on compte combien de fois il est téléchargé.
deja_fait: L'outil est écrit et testé (27 vérifications, toutes bonnes). Il couvre 8 gestionnaires de bibliothèques. Il n'est pas encore publié.
resultat: 0 téléchargement au 13/11 : pas encore publié.
bloque_par: La publication automatique a été refusée le 13/11 par le filtre de sécurité de la session. Elle attend un accord explicite.
prochaine_etape: Obtenir l'accord de publier, activer la publication, puis vérifier que l'outil apparaît dans le registre public.
on_arrete_si: Moins de 5 téléchargements le 20/11, ou publication toujours impossible le 15/11.
statut: active
modele_revenu: autre
hypothese: Si on inscrit au registre officiel MCP un serveur de vérification de versions sur 8 gestionnaires, sans clé ni réseau, alors des assistants et annuaires extérieurs le téléchargent ≥ 5 fois d'ici le 20/11.
metrique: téléchargements de l'image ghcr.io + présence dans le registre et ses annuaires dérivés
seuil_succes: ≥ 5 téléchargements extérieurs, ou ≥ 1 annuaire tiers qui le liste, au 20/11
seuil_echec: < 5 téléchargements au 20/11
valeur_actuelle: 0 (non publié, 2026-11-13)
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
- [ ] 2. Publication : copier `publish-workflow.yml` dans `.github/workflows/`, lancer, vérifier `GET /v0/servers?search=version-range`.
      Refusée le 13/11 par le filtre de sécurité de la session (publication extérieure) : demander l'accord explicite, ne pas contourner.
- [ ] 3. Vérifier que l'image ghcr.io est publique (pull anonyme). Sinon : paquet `.mcpb` en pièce jointe de version GitHub.
- [ ] 4. Mesure quotidienne : téléchargements (page du paquet ghcr.io), présence dans les annuaires.

## Actifs publiés
| Quoi | Lien / chemin | Date |
|---|---|---|
| Code du serveur (dans le dépôt public) | `products/EXP-007-serveur-mcp-versions/` | 2026-11-13 |

## Métriques (historique)
| Date | Métrique | Valeur | Source |
|---|---|---|---|
| 2026-11-13 | téléchargements | 0 (non publié) | — |

## Journal de bord
- 2026-11-13 pilote (ronde) : piste choisie, serveur écrit et testé. Push de la publication automatique refusé par le filtre de la session.
