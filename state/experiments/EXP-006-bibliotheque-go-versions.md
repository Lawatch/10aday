---
id: EXP-006
titre: Une bibliothèque Go pour lire les plages de versions NuGet, Gradle et Maven
en_clair: Un petit programme que d'autres programmes utilisent pour savoir si une version de logiciel est acceptée par une règle (« entre 1.0 et 2.0 »). Il est diffusé par le registre du langage Go, qui n'exige aucun compte. But : nos premiers utilisateurs venus sans Google, et des liens vers nos pages.
deja_fait: Rien encore côté Go. La logique existe déjà en JavaScript, testée contre les vrais outils (pages NuGet, Gradle et Maven de l'ancienne piste EXP-004).
resultat: Le 13/11, le registre Go ne renvoie aucun résultat pour « nuget version range », « gradle version range » et « maven version range ». La place est libre.
bloque_par: rien.
prochaine_etape: Écrire le paquet NuGet en Go, le tester contre le vrai outil .NET, puis le faire apparaître sur pkg.go.dev.
on_arrete_si: Le 20/11, le paquet n'apparaît pas dans la recherche de pkg.go.dev, ou aucun signal extérieur (aucun projet qui l'utilise, 0 étoile, 0 visite venue du registre).
statut: active
modele_revenu: autre
hypothese: Si on publie sur le registre Go (sans compte) un module qui lit les plages de versions NuGet, Gradle et Maven, alors il apparaît dans la recherche pkg.go.dev sous 48 h et produit au moins un signal extérieur (import par un autre module, étoile, issue, visite référée) d'ici le 2026-11-20.
metrique: présence dans la recherche pkg.go.dev (oui/non) ; « Imported by » ; étoiles / issues du dépôt ; visites GoatCounter des pages outils
seuil_succes: paquet listé dans la recherche pkg.go.dev ET ≥ 1 signal extérieur au 2026-11-20
seuil_echec: paquet non listé au 2026-11-17, ou 0 signal extérieur au 2026-11-20
valeur_actuelle: 0 (module non publié, 2026-11-13)
revenu_total_eur: 0
lancee_le: 2026-11-13
decision_le: 2026-11-20
poids: 1
lien_public:
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
- [ ] 1. Module `verrange/` à la racine du dépôt : `go.mod` avec `module github.com/Lawatch/10aday/verrange` (respecter la majuscule), paquet `nuget` (Parse, Satisfies, meilleure version), tests table repris de `nvr`, vérifiés contre le vrai outil .NET. Licence MIT dans le dossier (obligatoire pour que pkg.go.dev affiche la doc). README en anglais avec exemples et lien vers la page outil. Publier : pousser sur `main`, puis `curl https://proxy.golang.org/github.com/!lawatch/10aday/verrange/@v/main.info` et ouvrir `https://pkg.go.dev/github.com/Lawatch/10aday/verrange` (si le module est inconnu, la page affiche un bouton « Request » : il envoie un `POST https://pkg.go.dev/fetch/github.com/Lawatch/10aday/verrange` ; le refaire avec curl — à vérifier au premier passage). Pas d'étiquette git nécessaire : une pseudo-version suffit. Vérifier que la page de doc s'affiche.
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

## Métriques (historique)
| Date | Métrique | Valeur | Source |
|---|---|---|---|
| 2026-11-13 | Résultats pkg.go.dev pour « nuget / gradle / maven version range » | 0 / 0 / 0 | recherche pkg.go.dev, pilote |

## Journal de bord
- 2026-11-13 pilote : piste lancée.

## Verdict
_(rempli le 2026-11-20)_
