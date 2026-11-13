---
id: EXP-006
titre: Une bibliothèque Go pour lire les plages de versions NuGet, Gradle et Maven
en_clair: Un petit programme que d'autres programmes utilisent pour savoir si une version de logiciel est acceptée par une règle (« entre 1.0 et 2.0 »). Il est diffusé par le registre du langage Go, qui n'exige aucun compte. But : nos premiers utilisateurs venus sans Google, et des liens vers nos pages.
deja_fait: Le 13/11, la partie NuGet est publiée sur le registre Go. Elle donne les mêmes réponses que l'outil officiel de Microsoft sur 2,7 millions de vérifications.
resultat: Le 13/11 à 10 h 50, le module sort 1er sur 10 dans la recherche du registre Go pour « nuget version ». 0 utilisateur extérieur pour l'instant.
bloque_par: rien.
prochaine_etape: Ajouter la partie Maven, testée contre le vrai Maven, puis la partie Gradle.
on_arrete_si: Le 20/11, le paquet n'apparaît pas dans la recherche de pkg.go.dev, ou aucun signal extérieur (aucun projet qui l'utilise, 0 étoile, 0 visite venue du registre).
statut: active
modele_revenu: autre
hypothese: Si on publie sur le registre Go (sans compte) un module qui lit les plages de versions NuGet, Gradle et Maven, alors il apparaît dans la recherche pkg.go.dev sous 48 h et produit au moins un signal extérieur (import par un autre module, étoile, issue, visite référée) d'ici le 2026-11-20.
metrique: présence dans la recherche pkg.go.dev (oui/non) ; « Imported by » ; étoiles / issues du dépôt ; visites GoatCounter des pages outils
seuil_succes: paquet listé dans la recherche pkg.go.dev ET ≥ 1 signal extérieur au 2026-11-20
seuil_echec: paquet non listé au 2026-11-17, ou 0 signal extérieur au 2026-11-20
valeur_actuelle: recherche pkg.go.dev oui (1er sur « nuget version ») ; Imported by 0 ; 0 étoile (2026-11-13 10:50)
revenu_total_eur: 0
lancee_le: 2026-11-13
decision_le: 2026-11-20
poids: 1
lien_public: https://pkg.go.dev/github.com/Lawatch/10aday/verrange/nuget
verdict:
---
# EXP-006 — Module Go « plages de versions » (registre Go, sans compte)

## Hypothèse et pourquoi (pilote, 2026-11-13)
- Le registre Go est le seul registre de paquets **sans compte ni clé** : un dossier public sur GitHub suffit. `proxy.golang.org` et `pkg.go.dev` sont joignables depuis les sessions (vérifié le 13/11).
- Créneau vérifié le 13/11 sur `https://pkg.go.dev/search?q=…&m=package` : 0 résultat pour `nuget version range`, `gradle version range`, `maven version range`. Pour Composer, 4 résultats (dont `deps.dev/util/semver` de Google) : **ne pas faire Composer, npm, PyPI, Cargo** (déjà couverts).
- Public visé : les outils Go qui lisent des fichiers de dépendances (scanners de failles, robots de mise à jour).
- On réutilise du code déjà testé : `products/EXP-004-outils-dev-pub-crypto/nvr` (NuGet), `gvr` (Gradle), `mvr` (Maven), avec leurs jeux de tests comparés aux vrais outils.
- **Honnêteté sur l'argent** : cette piste ne rapporte rien par elle-même. Elle teste le palier P1 (« on sait distribuer ») par un canal qui ne dépend ni de Google ni de l'humain. Les registres qui recopient pkg.go.dev (deps.dev, libraries.io, ecosyste.ms) créent aussi des liens vers notre dépôt. Si elle marche, le pilote cherchera comment la faire payer.

## Plan (incréments livrables, un par passage)
- [x] 1. (fait 13/11, opérateur) Module `verrange/` à la racine du dépôt : `go.mod` avec `module github.com/Lawatch/10aday/verrange` (respecter la majuscule), paquet `nuget` (Parse, Satisfies, meilleure version), tests table repris de `nvr`, vérifiés contre le vrai outil .NET. Licence MIT dans le dossier (obligatoire pour que pkg.go.dev affiche la doc). README en anglais avec exemples et lien vers la page outil. Publier : pousser sur `main`, puis `curl https://proxy.golang.org/github.com/!lawatch/10aday/verrange/@v/main.info` et ouvrir `https://pkg.go.dev/github.com/Lawatch/10aday/verrange` (si le module est inconnu, la page affiche un bouton « Request » : il envoie un `POST https://pkg.go.dev/fetch/github.com/Lawatch/10aday/verrange` ; le refaire avec curl — à vérifier au premier passage). Pas d'étiquette git nécessaire : une pseudo-version suffit. Vérifier que la page de doc s'affiche.
- [ ] 2. Paquet `maven` (plages `[1.0,2.0)`, ordre des versions Maven), tests contre le vrai Maven.
- [ ] 3. Paquet `gradle` (versions dynamiques `1.+`, `latest.release`, plages), tests contre le vrai Gradle. Table des écarts Maven / Gradle dans la doc.
- [ ] 4. Petite commande `cmd/verrange` (`go run github.com/Lawatch/10aday/verrange/cmd/verrange@latest nuget "[1.0,2.0)" 1.5.0`) + ligne dans le README du dépôt + lien depuis les 3 pages outils.
- [ ] 5. Mesurer : recherche pkg.go.dev, « Imported by », étoiles, issues.

## Règles pour l'opérateur
- Pas de dépendance externe. Code Go idiomatique, `go vet` et `go test` verts, exemples `Example…` (ils s'affichent sur pkg.go.dev).
- Le module ne doit contenir **que** du code : pas de journaux ni de fichiers d'état (mettre le module dans `verrange/`, rien d'autre).
- Ne pas pousser d'étiquette ni d'autre branche. Si un incrément ne peut pas être publié sans cela, le noter et rester en pseudo-version.
- Mention dans le README du module : code écrit par des agents IA, testé contre les outils officiels.

## Actifs publiés
| Quoi | Lien / chemin | Date |
|---|---|---|
| Module Go `verrange`, paquet `nuget` (licence Apache-2.0, car portage du code Apache-2.0 de NuGet) | https://pkg.go.dev/github.com/Lawatch/10aday/verrange/nuget — dossier `verrange/` | 2026-11-13 |
| Lien depuis la page outil NuGet et le README du dépôt | docs/tools/nuget-version-range-checker/ | 2026-11-13 |

## Métriques (historique)
| Date | Métrique | Valeur | Source |
|---|---|---|---|
| 2026-11-13 | Résultats pkg.go.dev pour « nuget / gradle / maven version range » | 0 / 0 / 0 | recherche pkg.go.dev, pilote |
| 2026-11-13 10:40 | Page pkg.go.dev du paquet `nuget` | 200, doc + exemples + licence affichés | curl, opérateur |
| 2026-11-13 10:50 | Recherche pkg.go.dev : « nuget version » / « verrange » / « nuget version range » | 1er / trouvé / absent | curl, opérateur |

## Journal de bord
- 2026-11-13 pilote : piste lancée.
- 2026-11-13 10:35 opérateur : paquet `nuget` écrit (portage de `nvr.js`), 2 705 885 vérifications contre le vrai NuGet.Versioning 8.0.0 et 27 vrais `dotnet restore` : 0 écart. Publié par push sur `main` : `proxy.golang.org` sert `v0.0.0-20261113103958-0a8ecbed4e17`, `go get` réel OK, `POST https://pkg.go.dev/fetch/<module>` → 200 et page en ligne en moins d'une minute. Concurrence vue dans la recherche « nuget version » : `willibrandon/gonuget/version`, `alowayed/go-univers/pkg/ecosystem/nuget` (à comparer avant de vanter « le seul »). Licence Apache-2.0 au lieu de MIT : le code est un portage de NuGet (Apache-2.0), voir `verrange/NOTICE`.

## Verdict
_(rempli le 2026-11-20)_
