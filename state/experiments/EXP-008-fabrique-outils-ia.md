---
id: EXP-008
titre: Fabrique d'outils pour assistants IA
categorie: Outils pour assistants IA
en_clair: On publie, à la chaîne, de petits outils utiles que les assistants IA (Claude, Cursor…) installent depuis le registre officiel. C'est le seul canal où des gens viennent sans qu'on les appelle : notre 1er outil a fait 80 téléchargements en 2 jours.
deja_fait: 6 outils en ligne : versions de dépendances (13/11), gitignore-check (15/11), dockerignore-check (15/11), gitattributes-check (16/11), editorconfig-check (16/11) et npm-pack-check (16/11 à 6 h 35 : dit quels fichiers « npm publish » envoie vraiment, et repère les fuites comme un fichier .env publié par erreur).
resultat: 6 outils. 205 téléchargements au 16/11 à 6 h 20 (+40 en 3 h). Outil n°1 : 124 ; n°2 : 31 ; n°3 : 16 ; n°4 : 16 ; n°5 : 18 en 3 h. Objectif : 10 outils et 500 téléchargements au 22/11.
bloque_par: rien.
prochaine_etape: Chaque passage publie un nouvel outil utile, testé, ou améliore celui qui marche le mieux.
on_arrete_si: Le 22/11, moins de 150 téléchargements au total sur tous les outils sortis depuis le 15/11.
statut: active
modele_revenu: autre
hypothese: Le registre MCP envoie des téléchargements à tout outil utile dans les heures qui suivent sa sortie. Avec 10 outils variés, on trouve en une semaine les 1 ou 2 sujets qui attirent un vrai public, et on concentre l'effort dessus.
metrique: téléchargements par outil et au total (image ghcr.io + fichier .mcpb)
seuil_succes: ≥ 500 téléchargements au total et ≥ 1 outil au-dessus de 100 le 22/11
seuil_echec: < 150 téléchargements au total le 22/11
valeur_actuelle: 205 (5 outils mesurés, 16/11 06:20)
revenu_total_eur: 0
lancee_le: 2026-11-15
decision_le: 2026-11-22
poids: 4
lien_public: https://registry.modelcontextprotocol.io/v0/servers?search=io.github.Lawatch
verdict:
---

# EXP-008 — Fabrique d'outils pour assistants IA

## Pourquoi (décision du propriétaire, 15/11)
- Tout ce qui attend Google ou un humain est mort : 0 visiteur en 4 jours. Le registre MCP, lui, a envoyé 80 téléchargements en 2 jours à un seul outil, sans rien demander à personne.
- On passe donc d'« un outil, puis on attend » à **une production** : un outil utile par passage, chacun mesuré, on garde les gagnants.
- Argent : rien pour l'instant. Une base d'outils utilisés est la condition pour toute monétisation future (outil payant à l'appel, en crypto, dès qu'une adresse de réception existe).

## Comment produire (opérateur)
1. Choisir un besoin réel des développeurs qui utilisent un assistant IA, **absent ou mal servi** au registre (vérifier : `curl -s "https://registry.modelcontextprotocol.io/v0/servers?search=<mot>"`). Idées : conversion de formats (cron ↔ texte, unités, fuseaux), validation (JSON Schema, regex, YAML de CI), calculs fiables que les IA ratent (dates, pourcentages, sémantique de versions), lecture de fichiers de verrouillage, licences des dépendances.
2. Le construire dans `products/mcp/<nom>/` selon `products/mcp/README.md`. Sans dépendance, testé contre un vrai outil de référence.
3. Pousser : la chaîne publie toute seule. Vérifier en 5 min que l'outil apparaît au registre.
4. Noter l'outil et ses premiers chiffres dans `products/mcp/MESURES.md` et dans le tableau ci-dessous.

## Outils
| # | Nom | Sujet | Sorti le | Téléchargements (date) |
|---|---|---|---|---|
| 1 | version-range-mcp | Quelle version une contrainte installe (8 gestionnaires) | 13/11 | 80 (15/11 matin) ; 121 (15/11 19:40) ; 124 (16/11 00:30) ; 124 (16/11 03:20) ; 124 (16/11 06:20) |
| 2 | gitignore-check | Ce fichier est-il ignoré par git, et par quelle ligne du .gitignore ? | 15/11 | 1 (15/11 19:40) ; 11 (15/11 21:45 : 6 image + 5 fichier) ; 12 (16/11 00:30 : 6 + 6) ; 14 (16/11 03:20 : 7 + 7) ; 31 (16/11 06:20 : 18 + 13) |
| 3 | dockerignore-check | Quels fichiers `docker build` envoie vraiment, et quelle ligne du .dockerignore décide ? | 15/11 | 0 (15/11 21:45, à la sortie) ; 11 (16/11 00:30 : 6 image + 5 fichier) ; 13 (16/11 03:20 : 7 + 6) ; 16 (16/11 06:20 : 10 + 6) |
| 4 | gitattributes-check | Quels attributs git s'appliquent à un fichier (fins de ligne, binaire, LFS, linguist), et quelle ligne décide ? | 16/11 | 0 (16/11 00:50, à la sortie) ; 14 (16/11 03:20 : 7 + 7) ; 16 (16/11 06:20 : 9 + 7) |
| 5 | editorconfig-check | Quels réglages EditorConfig (indentation, fins de ligne, encodage) s'appliquent à un fichier, et quelle ligne décide ? | 16/11 | 0 (16/11 03:30, à la sortie) ; 18 (16/11 06:20 : 10 image + 8 fichier) |
| 6 | npm-pack-check | Quels fichiers `npm publish` envoie vraiment, quelle règle décide, et les fuites à corriger (.env, clés) | 16/11 | 0 (16/11 06:35, à la sortie) |

## Journal de bord
- 2026-11-16 06:35 opérateur : outil n°6 npm-pack-check publié. Il reprend le code même de npm 10 (règles de « files », .npmignore, .gitignore) et la même bibliothèque de motifs. Comparé à npm sur environ 23 000 projets tirés au hasard : 0 écart ; et au vrai « npm pack » sur 300 projets : 0 écart. Aucun outil sur ce sujet au registre.
- 2026-11-16 03:30 opérateur : outil n°5 editorconfig-check publié. Comparé au moteur de référence d'EditorConfig (celui de Prettier) sur environ 225 000 cas : 0 écart. Au registre, un seul outil voisin, qui ne fait que compter les sections. Avant : gitignore-check 1.0.1, aligné sur git 2.56 (la chaîne l'a vérifié).
- 2026-11-16 00:50 opérateur : outil n°4 gitattributes-check publié. Comparé au vrai `git check-attr` sur environ 77 000 cas : 0 écart. Aucun outil équivalent au registre (recherche « gitattributes » : 0 résultat).
- 2026-11-15 21:45 opérateur : outil n°3 dockerignore-check publié (chaîne automatique, 1er essai réussi). Comparé au vrai code de Docker sur 42 000 cas : 0 écart. Aucun outil équivalent au registre.
- 2026-11-15 propriétaire : lancement, chaîne de publication générique, EXP-006 et EXP-001 arrêtées.
- 2026-11-15 19:40 opérateur : outil n°2 gitignore-check publié par la chaîne automatique (1er essai réussi). Testé contre le vrai git : environ 80 000 cas, 0 écart.
