---
id: EXP-008
titre: Fabrique d'outils pour assistants IA
categorie: Outils pour assistants IA
en_clair: On publie, à la chaîne, de petits outils utiles que les assistants IA (Claude, Cursor…) installent depuis le registre officiel. C'est le seul canal où des gens viennent sans qu'on les appelle : notre 1er outil a fait 80 téléchargements en 2 jours.
deja_fait: Le 15/11 : chaîne de publication automatique prête. 3 outils en ligne : versions de dépendances (13/11), gitignore-check (15/11, dit si git ignore un fichier) et dockerignore-check (15/11 au soir, dit quels fichiers Docker embarque vraiment).
resultat: 3 outils. 132 téléchargements au 15/11 à 21 h 45 (outil n°1 : 121, inchangé depuis 19 h 40 ; outil n°2 : 11 en 2 h ; outil n°3 : sorti à 21 h 40). Objectif : 10 outils et 500 téléchargements au 22/11.
bloque_par: rien.
prochaine_etape: Chaque passage publie un nouvel outil utile, testé, ou améliore celui qui marche le mieux.
on_arrete_si: Le 22/11, moins de 150 téléchargements au total sur tous les outils sortis depuis le 15/11.
statut: active
modele_revenu: autre
hypothese: Le registre MCP envoie des téléchargements à tout outil utile dans les heures qui suivent sa sortie. Avec 10 outils variés, on trouve en une semaine les 1 ou 2 sujets qui attirent un vrai public, et on concentre l'effort dessus.
metrique: téléchargements par outil et au total (image ghcr.io + fichier .mcpb)
seuil_succes: ≥ 500 téléchargements au total et ≥ 1 outil au-dessus de 100 le 22/11
seuil_echec: < 150 téléchargements au total le 22/11
valeur_actuelle: 132 (3 outils, 15/11 21:45)
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
| 1 | version-range-mcp | Quelle version une contrainte installe (8 gestionnaires) | 13/11 | 80 (15/11 matin) ; 121 (15/11 19:40) |
| 2 | gitignore-check | Ce fichier est-il ignoré par git, et par quelle ligne du .gitignore ? | 15/11 | 1 (15/11 19:40) ; 11 (15/11 21:45 : 6 image + 5 fichier) |
| 3 | dockerignore-check | Quels fichiers `docker build` envoie vraiment, et quelle ligne du .dockerignore décide ? | 15/11 | 0 (15/11 21:45, à la sortie) |

## Journal de bord
- 2026-11-15 21:45 opérateur : outil n°3 dockerignore-check publié (chaîne automatique, 1er essai réussi). Comparé au vrai code de Docker sur 42 000 cas : 0 écart. Aucun outil équivalent au registre.
- 2026-11-15 propriétaire : lancement, chaîne de publication générique, EXP-006 et EXP-001 arrêtées.
- 2026-11-15 19:40 opérateur : outil n°2 gitignore-check publié par la chaîne automatique (1er essai réussi). Testé contre le vrai git : environ 80 000 cas, 0 écart.
