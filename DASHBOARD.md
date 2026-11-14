# Où en est 10aday — 14/11 à 04h21 (heure UTC)

_Page générée automatiquement à chaque passage d'agent. Ne pas modifier à la main._

## En bref
- **Argent gagné** : 0,00 € au total, 0,00 € par jour en moyenne sur 7 jours. Objectif : 10 € par jour.
- **Pistes en test** : 2. Arrêtées ou en pause : 5. Idées en réserve : 18.
- **Coup de pouce possible (une seule fois, facultatif)** : 0 demande(s) de clé ou de compte. Rien n'en dépend.

## Les pistes en test
### Une bibliothèque Go pour lire les plages de versions NuGet, Gradle et Maven

Un petit programme que d'autres programmes utilisent pour savoir si une version de logiciel est acceptée par une règle (« entre 1.0 et 2.0 »). Il est diffusé par le registre du langage Go, qui n'exige aucun compte. But : nos premiers utilisateurs venus sans Google, et des liens vers nos pages.

- **Déjà fait** : Les trois parties sont en ligne sur le registre Go : NuGet et Gradle le 13/11, Maven le 14/11. Chacune donne les mêmes réponses que le vrai outil, sur 2,7 à 8,5 millions de vérifications.
- **Résultat** : Le 14/11 à 0 h 28, le module sort 1er dans la recherche du registre Go pour « nuget version », « gradle dynamic version » et « maven range ». 0 utilisateur extérieur, 0 étoile, 16 visites sur le site.
- **Bloqué par** : rien.
- **Prochaine étape** : Ajouter une petite commande à lancer en une ligne, puis compter les utilisateurs.
- **Décision le 20/11** (dans 6 jours). On arrête si : Le 20/11, le paquet n'apparaît pas dans la recherche de pkg.go.dev, ou aucun signal extérieur (aucun projet qui l'utilise, 0 étoile, 0 visite venue du registre).
- **Voir** : https://pkg.go.dev/github.com/Lawatch/10aday/verrange/nuget
- _Fiche détaillée : [EXP-006](state/experiments/EXP-006-bibliotheque-go-versions.md)_

### Un outil pour les assistants IA qui dit quelle version d'une bibliothèque sera installée

Les assistants IA (Claude, Copilot…) se trompent souvent sur les règles de versions des bibliothèques. On leur donne un outil branchable, inscrit au registre public de ces outils, et on compte combien de fois il est téléchargé.

- **Déjà fait** : Outil inscrit au registre public des outils pour assistants IA (13/11), installable en un clic dans Claude Desktop. Depuis le 14/11 à 4 h 40 (version 1.2.0), il va lire lui-même les versions publiées sur les 7 registres de paquets et dit laquelle sera installée aujourd'hui.
- **Résultat** : 26 téléchargements de l'outil et 6 du fichier « un clic » en 16 h (14/11, 4 h 20). Le seuil de 5 est dépassé. Origine inconnue : des robots d'annuaires en font sans doute une partie.
- **Bloqué par** : rien.
- **Prochaine étape** : Le prochain opérateur compte les téléchargements de la version 1.2.0 (image et fichier « un clic »). Si la nouvelle version est téléchargée plus vite que l'ancienne, la nouvelle fonction intéresse.
- **Décision le 20/11** (dans 6 jours). On arrête si : Moins de 5 téléchargements le 20/11, ou publication toujours impossible le 15/11.
- **Voir** : https://github.com/Lawatch/10aday/tree/main/products/EXP-007-serveur-mcp-versions
- _Fiche détaillée : [EXP-007](state/experiments/EXP-007-serveur-mcp-versions.md)_

## Pistes en pause ou arrêtées
- **Pages gratuites en ligne : calculateurs de rupture conventionnelle et outils pour développeurs** (En pause) : En veille depuis le 13/11 : 28 pages, 0 visiteur prouvé. Plus aucun passage d'agent dessus. Arrêt définitif le 20/11 si Bing n'envoie personne.
- **Tableur de gestion pour auto-entrepreneurs, à vendre** (En pause) : En pause depuis le 12/11 : pas de vente pour l'instant (ta décision).
- **Primes pour corriger des bugs de logiciels libres** (Arrêtée) : Arrêtée le 12/11 : ces sites paient par virement (compte à créer) et chaque correction aurait dû être envoyée depuis ton compte GitHub. Pas faisable seuls.
- **Petits outils gratuits pour développeurs, avec pub payée en bitcoin** (Arrêtée) : Arrêtée le 13/11. Deux raisons : 0 visiteur, et la pub payée en bitcoin rapporte trop peu (il faudrait 290 000 pages vues par jour pour 10 €). Les 16 pages restent en ligne, surveillées avec les calculateurs. Leur code sert à la nouvelle piste EXP-006.
- **Concours de code réservés aux IA, payés en dollars numériques** (Arrêtée) : Arrêtée le 13/11 par l'humain. Elle dépendait d'une clé et d'un compte qu'il fallait lui demander ; une piste qui ne se mène pas à 100 % sans lui n'est pas gardée.

## Coup de pouce possible (une seule fois, facultatif)
Rien.

_Les étapes détaillées sont dans [state/HUMAN_QUEUE.md](state/HUMAN_QUEUE.md)._

## Ce que les agents ont fait récemment
- **14/11 04h18** · Un outil pour les assistants IA qui dit quelle version d'une bibliothèque sera installée · cycle complet — notre outil pour assistants IA va maintenant chercher lui-même les versions publiées d'une bibliothèque et dit laquelle sera installée aujourd'hui.
- **14/11 00h18** · Une bibliothèque Go pour lire les plages de versions NuGet, Gradle et Maven · cycle complet — j'ai ajouté à notre bibliothèque Go la partie Maven (l'outil de construction le plus courant en Java).
- **13/11 20h18** · Un outil pour les assistants IA qui dit quelle version d'une bibliothèque sera installée · cycle complet — notre outil pour assistants IA s'installe maintenant en un clic dans Claude Desktop, en plus de la version technique.
- **13/11 16h36** · Une bibliothèque Go pour lire les plages de versions NuGet, Gradle et Maven · cycle complet — j'ai ajouté à notre bibliothèque Go la partie qui lit les versions comme Gradle (l'outil de construction des projets Java et Android).
- **13/11 12h24** · Un outil pour les assistants IA qui dit quelle version d'une bibliothèque sera installée · cycle complet — avec ton accord, j'ai publié l'outil qui dit aux assistants IA quelle version d'une bibliothèque sera installée.
- **13/11 12h20** · Un outil pour les assistants IA qui dit quelle version d'une bibliothèque sera installée · cycle complet — j'ai réessayé de publier l'outil pour assistants IA, le filtre de sécurité a refusé une 2e fois, alors j'ai arrêté la piste.
- **13/11 10h40** · pilotage · pilotage — j'ai lancé une 2e piste : un outil que les assistants IA branchent pour savoir quelle version d'une bibliothèque sera installée.
- **13/11 10h35** · Une bibliothèque Go pour lire les plages de versions NuGet, Gradle et Maven · cycle complet — j'ai publié sur le registre du langage Go une petite bibliothèque qui lit les règles de versions NuGet (le gestionnaire de paquets de Microsoft).
- **13/11 10h30** · pilotage · pilotage — j'ai relevé les chiffres, arrêté une piste, mis une autre en veille, lancé une nouvelle piste et réduit le nombre de passages.
- **13/11 09h40** · Pages gratuites en ligne : calculateurs de rupture conventionnelle et outils pour développeurs · faire connaître — j'ai écrit la réponse toute faite pour les forums sur l'indemnité après du temps partiel ou un congé parental, et ajouté ce calculateur à la page qui permet aux autres sites de l'afficher chez eux.
