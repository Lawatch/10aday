---
id: EXP-006
titre: Une bibliothèque Go pour lire les plages de versions NuGet, Gradle et Maven
categorie: Bibliothèques de code
en_clair: Un petit programme que d'autres programmes utilisent pour savoir si une version de logiciel est acceptée par une règle (« entre 1.0 et 2.0 »). Il est diffusé par le registre du langage Go, qui n'exige aucun compte. But : nos premiers utilisateurs venus sans Google, et des liens vers nos pages.
deja_fait: Les trois parties sont en ligne sur le registre Go (NuGet, Gradle, Maven), testées contre les vrais outils. Depuis le 14/11 à 12 h 20, une commande s'utilise en une ligne, sans rien installer d'autre que Go.
resultat: 1er dans la recherche du registre Go sur ses 3 sujets. Au 15/11 à 16 h 20 : 0 projet qui l'utilise, 0 étoile, 17 visites sur le site. Rien n'a bougé depuis le 14/11.
bloque_par: rien.
prochaine_etape: aucune. La bibliothèque reste en ligne.
on_arrete_si: Le 20/11, le paquet n'apparaît pas dans la recherche de pkg.go.dev, ou aucun signal extérieur (aucun projet qui l'utilise, 0 étoile, 0 visite venue du registre).
statut: tuee
modele_revenu: autre
hypothese: Si on publie sur le registre Go (sans compte) un module qui lit les plages de versions NuGet, Gradle et Maven, alors il apparaît dans la recherche pkg.go.dev sous 48 h et produit au moins un signal extérieur (import par un autre module, étoile, issue, visite référée) d'ici le 2026-11-20.
metrique: présence dans la recherche pkg.go.dev (oui/non) ; « Imported by » ; étoiles / issues du dépôt ; visites GoatCounter des pages outils
seuil_succes: paquet listé dans la recherche pkg.go.dev ET ≥ 1 signal extérieur au 2026-11-20
seuil_echec: paquet non listé au 2026-11-17, ou 0 signal extérieur au 2026-11-20
valeur_actuelle: recherche pkg.go.dev oui (1er sur les 3 sujets) ; Imported by 0 sur les 3 paquets et la commande ; 0 étoile ; site 17 visites (2026-11-15 16:20)
revenu_total_eur: 0
lancee_le: 2026-11-13
decision_le: 2026-11-20
poids: 1
lien_public: https://pkg.go.dev/github.com/Lawatch/10aday/verrange/nuget
verdict: Arrêtée le 15/11 par le propriétaire : publiée, 1re dans la recherche du registre Go, mais 0 utilisateur en 2 jours. Rien de plus à construire, on ne paie plus des passages pour recompter.
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
- [x] 2. (fait 14/11 00:25, opérateur) Paquet `maven` (plages `[1.0,2.0)`, ordre des versions Maven), tests contre le vrai Maven.
- [x] 3. (fait 13/11 16:45, opérateur, avant Maven : créneau plus libre) Paquet `gradle` (versions dynamiques `1.+`, `latest.release`, plages), tests contre le vrai Gradle. Table des écarts Maven / Gradle dans la doc.
- [x] 4. (fait 14/11 12:20, opérateur) Petite commande `cmd/verrange` (`go run github.com/Lawatch/10aday/verrange/cmd/verrange@latest nuget "[1.0,2.0)" 1.5.0`) + ligne dans le README du dépôt + lien depuis les 3 pages outils.
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
| Paquet `gradle` du module | https://pkg.go.dev/github.com/Lawatch/10aday/verrange/gradle — `verrange/gradle/` | 2026-11-13 |
| Lien depuis la page outil Gradle (signalée à Bing) et le README | docs/tools/gradle-dynamic-version-checker/ | 2026-11-13 |
| Paquet `maven` du module | https://pkg.go.dev/github.com/Lawatch/10aday/verrange/maven — `verrange/maven/` | 2026-11-14 |
| Lien + correction de la FAQ `[1.0]` sur la page outil Maven (signalée à Bing) | docs/tools/maven-version-range-checker/ | 2026-11-14 |
| Commande `verrange` (`go run …/cmd/verrange@latest`), lien depuis les 3 pages outils (signalées à Bing) et les 2 README | https://pkg.go.dev/github.com/Lawatch/10aday/verrange/cmd/verrange — `verrange/cmd/verrange/` | 2026-11-14 |

## Métriques (historique)
| Date | Métrique | Valeur | Source |
|---|---|---|---|
| 2026-11-13 | Résultats pkg.go.dev pour « nuget / gradle / maven version range » | 0 / 0 / 0 | recherche pkg.go.dev, pilote |
| 2026-11-13 10:40 | Page pkg.go.dev du paquet `nuget` | 200, doc + exemples + licence affichés | curl, opérateur |
| 2026-11-13 10:50 | Recherche pkg.go.dev : « nuget version » / « verrange » / « nuget version range » | 1er / trouvé / absent | curl, opérateur |
| 2026-11-13 16:36 | Imported by / étoiles / issues / visites site (TOTAL) | 0 / 0 / 0 / 16 | pkg.go.dev, api.github.com, GoatCounter |
| 2026-11-13 16:50 | Recherche pkg.go.dev : « nuget version » / « gradle dynamic version » / « gradle version » | 1er / 1er (seul) / absent du top 10 | curl, opérateur |
| 2026-11-14 00:18 | Imported by / étoiles / issues / visites site (TOTAL) | 0 / 0 / 0 / 16 | pkg.go.dev, api.github.com, GoatCounter |
| 2026-11-14 00:28 | Recherche pkg.go.dev : « maven range » / « maven resolver version » / « maven version » | 1er (seul) / 2e / absent du top 4 | curl, opérateur |
| 2026-11-14 12:20 | Imported by / étoiles / issues / visites site (TOTAL) | 0 / 0 / 0 / 17 | pkg.go.dev, api.github.com, GoatCounter |
| 2026-11-14 12:35 | Recherche pkg.go.dev : « nuget version range » / « maven version range » / « gradle version range » | 1er + 2e (commande) / 1er / 1er (commande) | curl, opérateur |
| 2026-11-15 00:20 | Imported by / étoiles / issues / visites site (TOTAL) / recherche (3 requêtes) | 0 / 0 / 0 / 17 / 1ers inchangés | pkg.go.dev, api.github.com, GoatCounter |
| 2026-11-15 16:20 | Imported by (4 paquets) / étoiles / copies / issues / visites site (TOTAL) / recherche (3 requêtes) | 0 / 0 / 0 / 0 / 17 / 1ers inchangés | pkg.go.dev, api.github.com, GoatCounter |

## Journal de bord
- 2026-11-13 pilote : piste lancée.
- 2026-11-13 10:35 opérateur : paquet `nuget` écrit (portage de `nvr.js`), 2 705 885 vérifications contre le vrai NuGet.Versioning 8.0.0 et 27 vrais `dotnet restore` : 0 écart. Publié par push sur `main` : `proxy.golang.org` sert `v0.0.0-20261113103958-0a8ecbed4e17`, `go get` réel OK, `POST https://pkg.go.dev/fetch/<module>` → 200 et page en ligne en moins d'une minute. Concurrence vue dans la recherche « nuget version » : `willibrandon/gonuget/version`, `alowayed/go-univers/pkg/ecosystem/nuget` (à comparer avant de vanter « le seul »). Licence Apache-2.0 au lieu de MIT : le code est un portage de NuGet (Apache-2.0), voir `verrange/NOTICE`.
- 2026-11-13 16:45 opérateur : choix de Gradle avant Maven. La recherche « maven version » sur pkg.go.dev montre déjà 6 paquets (dont `masahiro331/go-mvn-version` et `deps.dev/util/resolve/maven`) ; « gradle version » : aucun ne lit les versions dynamiques. Paquet `gradle` = portage de `gvr.js` en Go. 6 725 337 vérifications contre les classes de Gradle 8.14.3 (40 graines) : 0 écart. Deux corrections trouvées par l'oracle : Gradle ne coupe les versions qu'aux chiffres ASCII, et `1.0-sp1` < `1.0` (les mots ne priment qu'entre eux). 35 vrais builds Gradle (8 nouveaux cas dans `gvr/real_gradle/cases.txt`) : 35/35. Publié : `v0.0.0-20261113164100-2a5671a2a36c`, `go get` réel OK, page pkg.go.dev 200 en moins d'une minute.
- 2026-11-14 00:25 opérateur : paquet `maven` = portage de `mvr.js` (Maven Resolver 1.9.24, l'ordre que `mvn` utilise pour les intervalles, pas `ComparableVersion` que portent les concurrents). 8 456 138 vérifications contre les vraies classes : 0 écart après 2 corrections trouvées par l'oracle (chiffres non latins `١.٠` = `1.0` ; `İ` → 2 caractères en Java). 33 vrais `mvn dependency:list` (14 versions publiées) : 33/33 après une 3e correction : `[3.0]` et `1.7` ne lisent pas la liste publiée, Maven demande ce texte exact (`[3.0]` échoue si seul `3.0.RELEASE` existe). La FAQ de notre page Maven disait le contraire : corrigée. Publié : `v0.0.0-20261114002548-e5df3959d24b`, `go get` réel OK, page pkg.go.dev 200 en ~1 min 30.
- 2026-11-14 12:20 opérateur : commande `cmd/verrange` (`verrange <nuget|maven|gradle> <plage> [versions…]`, versions aussi par l'entrée standard). Affiche oui/non par version puis `pick:` = ce que l'outil choisirait (repli NuGet et texte exact Maven expliqués). 16 cas de test, essai réel sur la liste JUnit de Maven Central (`4.+` → 4.13.2). Publié : `v0.0.0-20261114122208-732dba737c6f`, `go run …@latest` réel OK depuis un cache vide, page pkg.go.dev 200 en ~1 min. Effet de bord : « nuget version range » et « gradle version range », absents avant, sortent maintenant 1ers. 3 pages outils signalées à IndexNow (200).
- 2026-11-15 00:20 opérateur : mesure seule. Tout est à 0, rien n'a bougé en 12 h. Recherche pkg.go.dev toujours 1ers. deps.dev et ecosyste.ms injoignables (curl et web-fetch : hôte hors réseau), donc impossible de voir si les miroirs recopient le module. Rien ajouté : aucune action seule ne ferait venir un importeur avant le 20/11.
- 2026-11-15 16:20 opérateur : mesure seule, comme demandé par le pilote. Tout reste à 0 (4 paquets « No known importers », 0 étoile, 0 copie, 17 visites). Toujours 1ers sur les 3 recherches. Rien ajouté.

## Verdict
_(rempli le 2026-11-20)_
