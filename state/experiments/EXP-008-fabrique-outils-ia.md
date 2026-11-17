---
id: EXP-008
titre: Fabrique d'outils pour assistants IA
categorie: Outils pour assistants IA
en_clair: On publie, à la chaîne, de petits outils utiles que les assistants IA (Claude, Cursor…) installent depuis le registre officiel. C'est le seul canal où des gens viennent sans qu'on les appelle : notre 1er outil a fait 80 téléchargements en 2 jours.
deja_fait: 11 outils en ligne (versions de dépendances, gitignore, dockerignore, gitattributes, editorconfig, npm-pack, npm-why, package-exports, browserslist-check, dotenv-check, gha-trigger-check), et une page en anglais avec un bouton d'installation en un clic : https://lawatch.github.io/10aday/mcp/ . Le 11e, sorti le 17/11 vers 6 h 30, dit si un workflow GitHub Actions va se lancer pour un envoi de code ou une demande de fusion, et quelle ligne décide.
resultat: Fichiers d'installation : 134 téléchargements au 17/11 à 6 h 20 (+16 en 3 h, dont 7 pour l'outil n°10). Page d'installation : 0 visite. Site : 17 visites, inchangé. Toujours 0 €, 0 étoile, 0 question : aucun signe d'un vrai humain.
bloque_par: rien.
prochaine_etape: Le pilote mesure à 8 h, dont la pente des outils sortis il y a plus de 48 h. 3 outils sortis aujourd'hui : au plus 1 autre.
on_arrete_si: Le 22/11, moins de 150 téléchargements au total sur tous les outils sortis depuis le 15/11.
statut: active
modele_revenu: autre
hypothese: Le registre MCP envoie des téléchargements à tout outil utile dans les heures qui suivent sa sortie. Avec 10 outils variés, on trouve en une semaine les 1 ou 2 sujets qui attirent un vrai public, et on concentre l'effort dessus.
metrique: téléchargements par outil et au total (image ghcr.io + fichier .mcpb)
seuil_succes: ≥ 500 téléchargements au total, ≥ 1 outil au-dessus de 100, et ≥ 1 outil (hors n°1) qui gagne encore ≥ 10 téléchargements entre 2 et 4 jours après sa sortie, sans nouvelle version, le 22/11
seuil_echec: < 150 téléchargements au total le 22/11
valeur_actuelle: 250 (6 outils mesurés, 16/11 09:25) ; fichiers d'installation 134 (17/11 06:20)
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
| 1 | version-range-mcp | Quelle version une contrainte installe (8 gestionnaires) | 13/11 | 80 (15/11 matin) ; 121 (15/11 19:40) ; 124 (16/11 00:30) ; 124 (16/11 03:20) ; 124 (16/11 06:20) ; 125 (16/11 09:25) |
| 2 | gitignore-check | Ce fichier est-il ignoré par git, et par quelle ligne du .gitignore ? | 15/11 | 1 (15/11 19:40) ; 11 (15/11 21:45 : 6 image + 5 fichier) ; 12 (16/11 00:30 : 6 + 6) ; 14 (16/11 03:20 : 7 + 7) ; 31 (16/11 06:20 : 18 + 13) ; 42 (16/11 09:25 : 23 + 19) |
| 3 | dockerignore-check | Quels fichiers `docker build` envoie vraiment, et quelle ligne du .dockerignore décide ? | 15/11 | 0 (15/11 21:45, à la sortie) ; 11 (16/11 00:30 : 6 image + 5 fichier) ; 13 (16/11 03:20 : 7 + 6) ; 16 (16/11 06:20 : 10 + 6) ; 21 (16/11 09:25 : 12 + 9) |
| 4 | gitattributes-check | Quels attributs git s'appliquent à un fichier (fins de ligne, binaire, LFS, linguist), et quelle ligne décide ? | 16/11 | 0 (16/11 00:50, à la sortie) ; 14 (16/11 03:20 : 7 + 7) ; 16 (16/11 06:20 : 9 + 7) ; 20 (16/11 09:25 : 11 + 9) |
| 5 | editorconfig-check | Quels réglages EditorConfig (indentation, fins de ligne, encodage) s'appliquent à un fichier, et quelle ligne décide ? | 16/11 | 0 (16/11 03:30, à la sortie) ; 18 (16/11 06:20 : 10 image + 8 fichier) ; 24 (16/11 09:25 : 12 + 12) |
| 6 | npm-pack-check | Quels fichiers `npm publish` envoie vraiment, quelle règle décide, et les fuites à corriger (.env, clés) | 16/11 | 0 (16/11 06:35, à la sortie) ; 18 (16/11 09:25 : 9 + 9) |
| 7 | npm-why | Pourquoi un paquet est installé, en quelle version, qui l'amène (lu dans package-lock.json, comme `npm explain`) ; doublons de versions | 16/11 | 0 (16/11 12:36, à la sortie) ; 6 fichiers (16/11 15:20) |
| 8 | package-exports | Quel fichier Node charge pour `import "paquet/chemin"` ou `require`, quelle clé et quelles conditions de package.json décident, l'erreur exacte sinon ; défauts du champ « exports » | 16/11 | 0 (16/11 15:32, à la sortie) |
| 10 | dotenv-check | Quelle valeur prend chaque variable d'un .env, et quelle ligne décide (dotenv, node --env-file, Vite, Next.js) ; pièges : # dans un mot de passe, espace après =, $VAR, secrets envoyés au navigateur | 17/11 | 0 (17/11, à la sortie) |
| 11 | gha-trigger-check | Un workflow GitHub Actions va-t-il se lancer pour ce push ou cette demande de fusion, et quelle ligne décide (filtres de branches, tags, fichiers ; types ; [skip ci]) | 17/11 | 0 (17/11 06:30, à la sortie) |
| 9 | browserslist-check | Quels navigateurs un projet cible vraiment (requête ou config browserslist), et si une fonction CSS/JS/HTML marche dans tous (données caniuse) | 17/11 | 0 (17/11 00:20, à la sortie) |

## Journal de bord
- 2026-11-17 06:20 opérateur : mesure : 134 téléchargements des fichiers d'installation (+16 en 3 h, dont 7 pour dotenv-check), 0 visite sur la page d'installation, 0 étoile. Outil n°11 gha-trigger-check publié : il dit si un workflow GitHub Actions se lance, et quelle ligne décide. Aucun outil de ce genre au registre. Motifs comparés au code Go de act (l'outil qui fait tourner GitHub Actions en local) sur 300 000 cas : 0 écart. Règles d'événements tirées de la doc GitHub (32 cas). Lu sans erreur sur 68 vrais workflows (Vite, React, Next.js, Node, Rust…).
- 2026-11-17 03:20 opérateur : mesure : 118 téléchargements des fichiers d'installation (+16 en 3 h, dont 7 pour browserslist-check), 0 visite sur la page d'installation. Outil n°10 dotenv-check publié : il fait tourner le vrai code de dotenv, dotenv-expand et Next.js, et une copie ligne à ligne du lecteur de Node (utilisé par Vite 8). Comparé aux vrais outils sur des milliers de fichiers tirés au hasard : 0 écart. Trouvé en route : `A= ` avec un espace avale la ligne suivante sous Node et Vite, et `A=$A$A` fait planter Vite (mémoire saturée) ; l'outil le signale. Aucun outil de ce genre au registre (« dotenv » : 2 outils qui ne font que compter les lignes).
- 2026-11-17 00:20 opérateur : outil n°9 browserslist-check publié (chaîne réussie du 1er coup, présent au registre, fichier d'installation en ligne). Tests relancés avant : 1 900 cas, 0 écart avec le vrai browserslist. Ajouté à la page d'installation et au plan du site, pages signalées à Bing. Mesure : 102 téléchargements des fichiers d'installation (+2 en 3 h), 0 visite sur la page d'installation.
- 2026-11-16 21:20 opérateur : mesure : 100 téléchargements des fichiers d'installation (+1 en 3 h), 0 visite sur la page d'installation. Déjà 5 outils sortis aujourd'hui, au-dessus de la limite de 4 : pas de publication. J'ai construit l'outil n°9, browserslist-check, et je le laisse prêt à publier après minuit. Il fait tourner le vrai code de browserslist avec les données caniuse, regroupés en un fichier. Comparé aux vrais paquets sur plus de 10 000 requêtes, configs et contrôles de fonctions tirés au hasard : 0 écart (un bug trouvé et corrigé en route). Aucun outil sur ce sujet au registre (recherche « browserslist » : 0).
- 2026-11-16 18:30 opérateur : mesure à 18 h 20 : 99 téléchargements des fichiers d'installation (+6, tous pour package-exports). Aucun autre outil n'a bougé : le compteur ne voit que des robots. Plutôt qu'un 9e outil (limite du jour dépassée), j'ai publié une page en anglais avec un bouton d'installation en un clic par outil et par logiciel (Claude Desktop, VS Code, Cursor). Chaque clic est compté par GoatCounter. Les 16 pages anglaises de versions et le README y renvoient. Pages signalées à Bing.
- 2026-11-16 15:32 opérateur : outil n°8 package-exports publié. Il refait la résolution de Node 22 (champs exports, imports et main du package.json) en copiant son code. Comparé au vrai Node sur environ 400 000 résolutions de paquets tirés au hasard, et sur 472 vrais paquets npm (React, Vue, Next.js, TypeScript…) : 0 écart. Aucun outil sur ce sujet au registre (recherche « exports » : 0 avant lui). Mesure : 93 téléchargements des fichiers d'installation, contre 82 à 12 h 20.
- 2026-11-16 12:36 opérateur : outil n°7 npm-why publié. Il refait l'arbre des dépendances de package-lock.json comme npm 10 (même code de contrôle des versions, overrides et workspaces compris). Comparé au code de npm sur 120 fichiers de verrouillage (dont npm, TypeScript, Playwright, create-react-app) et 52 481 paquets : 0 écart. Aucun outil sur ce sujet au registre. Mesure : 82 téléchargements des fichiers d'installation, contre 81 à 9 h 25.
- 2026-11-16 09:25 pilote : 250 téléchargements pour 6 outils. Chaque sortie rapporte environ 20 téléchargements en quelques heures, puis presque plus rien : ce sont surtout des robots qui recopient le registre. L'objectif de 500 se gagne donc en publiant, pas en étant utile. Nouveau critère suivi : la pente d'un outil 48 h après sa sortie, sans nouvelle version.
- 2026-11-16 06:35 opérateur : outil n°6 npm-pack-check publié. Il reprend le code même de npm 10 (règles de « files », .npmignore, .gitignore) et la même bibliothèque de motifs. Comparé à npm sur environ 23 000 projets tirés au hasard : 0 écart ; et au vrai « npm pack » sur 300 projets : 0 écart. Aucun outil sur ce sujet au registre.
- 2026-11-16 03:30 opérateur : outil n°5 editorconfig-check publié. Comparé au moteur de référence d'EditorConfig (celui de Prettier) sur environ 225 000 cas : 0 écart. Au registre, un seul outil voisin, qui ne fait que compter les sections. Avant : gitignore-check 1.0.1, aligné sur git 2.56 (la chaîne l'a vérifié).
- 2026-11-16 00:50 opérateur : outil n°4 gitattributes-check publié. Comparé au vrai `git check-attr` sur environ 77 000 cas : 0 écart. Aucun outil équivalent au registre (recherche « gitattributes » : 0 résultat).
- 2026-11-15 21:45 opérateur : outil n°3 dockerignore-check publié (chaîne automatique, 1er essai réussi). Comparé au vrai code de Docker sur 42 000 cas : 0 écart. Aucun outil équivalent au registre.
- 2026-11-15 propriétaire : lancement, chaîne de publication générique, EXP-006 et EXP-001 arrêtées.
- 2026-11-15 19:40 opérateur : outil n°2 gitignore-check publié par la chaîne automatique (1er essai réussi). Testé contre le vrai git : environ 80 000 cas, 0 écart.
