# EXP-004 — Version Constraint Checker

Page publiée : `docs/tools/version-constraint-checker/` → https://lawatch.github.io/10aday/tools/version-constraint-checker/

- `vcc.js` : moteur (npm via node-semver embarqué, Cargo, Composer, pip/PEP 440, RubyGems), réimplémenté en JS.
- `semver.min.js` : node-semver 7.8.5 minifié (ISC, voir `semver.LICENSE`).
- `oracle/` : scripts qui interrogent les **implémentations de référence** (`oracle_npm.js`, `oracle_cargo.rs`, `oracle_composer.php`,
  `oracle_pip.py`, `oracle_ruby.rb`) + fixtures JSON générées à partir de `oracle/inputs.json` (70 contraintes × 46 versions).
  `gen_fuzz.py SEED` produit des jeux aléatoires (400 contraintes × 60 versions) ; `run_oracles.sh DIR` régénère les fixtures d'un dossier.
- `test.js [DIR]` : compare `vcc.js` aux fixtures, et vérifie que la copie publiée dans `docs/` est identique. `node test.js` → doit afficher 100 %.

Mise en place des oracles (dossier scratch, hors dépôt) : `composer require composer/semver` (puis `COMPOSER_AUTOLOAD=.../vendor/autoload.php`) ;
projet cargo avec `semver = "1"` + `serde_json = "1"`, `src/main.rs` = `oracle_cargo.rs` (puis `CARGO_ORACLE=.../target/release/cargo-oracle`) ;
node-semver : `SEMVER=/chemin/vers/node_modules/semver` (défaut : `/opt/node-tools/node_modules/semver`).

Résultat au 2026-11-12 : 9 816/9 816 sur le jeu fixe, et 100 % sur les graines aléatoires 1 à 8 (≈ 330 000 vérifications).

## Outil n°2 : Poetry to PEP 621 converter (`p2p/`)
Page publiée : `docs/tools/poetry-to-pep621/` → https://lawatch.github.io/10aday/tools/poetry-to-pep621/
- `p2p/p2p.js` : contraintes Poetry → PEP 440, `python =` → marqueurs, entrées de dépendances → PEP 508, petit lecteur TOML, conversion complète vers `[project]` et `[dependency-groups]`. La copie dans `docs/` doit rester identique (vérifié par `p2p/test.js`).
- Oracle : `pip install poetry-core packaging`, puis
  `node p2p/oracle/cases.js > /tmp/c.json && python3 p2p/oracle/check.py /tmp/c.json` (418 contraintes × ~200 versions : poetry-core `parse_constraint().allows()` comparé à `packaging.SpecifierSet`) ;
  `node p2p/oracle/deps.js > /tmp/d.json && python3 p2p/oracle/check_deps.py /tmp/d.json` (marqueurs `python =` et dépendances complètes comparés à `Dependency.to_pep_508()`) ;
  `node p2p/test.js` (fichier complet ; le lecteur TOML est comparé à `tomllib`, chaque ligne est validée par `packaging.Requirement`).
- Résultat au 2026-11-12 : 82 008 + 24 075 vérifications, 0 écart. Divergences voulues et signalées à l'utilisateur : label local `+…` dans une comparaison ordonnée (interdit par PEP 440), `python = "3"` (Poetry écrit un marqueur qui ne correspond à aucun interpréteur).

## Outil n°3 : requires-python checker (`rpc/`)
Page publiée : `docs/tools/requires-python-checker/` → https://lawatch.github.io/10aday/tools/requires-python-checker/
- `rpc/rpc.js` : pour un spécificateur `requires-python`, liste les versions de Python acceptées (2.7 à 4.0, patchs .0 à .40) et signale les pièges (`<=3.12`, `==3.10`, `>3.10`, `~=3.10.2`, plafonds, syntaxe Poetry `^`/`~` traduite par `p2p.js`). Le moteur réutilise `vcc.js` (pip) et `p2p.js` ; la page charge les copies publiées des outils n°1 et n°2.
- Oracle : `node rpc/dump.js SEED > f.json && python3 rpc/oracle.py f.json` (≈ 330 spécificateurs × 779 versions = 256 291 vérifications contre `packaging`, 0 écart sur les graines 1 à 8). `node rpc/test.js` : copie publiée identique + cas clés.

## Outil n°4 : Version sorter (`vsort/`)
Page publiée : `docs/tools/version-sorter/` → https://lawatch.github.io/10aday/tools/version-sorter/ (générée par `python3 vsort/gen_page.py` depuis `vsort/page.tpl.html`).
- Moteur : fonctions `canon()` et `compare()` ajoutées à chaque gestionnaire dans `vcc.js` (npm : `semver.compare` ; Cargo : `Version::cmp_precedence` ; Composer : comparateur de `Semver::sort` ; pip : ordre de `packaging.version.Version` ; RubyGems : `Gem::Version#<=>`). `semver.min.js` reconstruit (node-semver 7.8.5 + `compare`, esbuild).
- Oracle : `vsort/oracle/run.sh DIR SEED` (0 = liste fixe de pièges ; besoin de `SEMVER`, `COMPOSER_AUTOLOAD`, `CARGO_SORT_ORACLE`, voir chaque fichier), puis `node vsort/test.js DIR...`. Comparaison de **toutes les paires** de versions.
- Résultat au 2026-11-12 : liste fixe (126 versions) 39 330/39 330 ; graines 1 à 8 : 268 149/268 149. `node vsort/claims.js` vérifie chaque comparaison citée sur la page (165 vérifications).

## Outil n°5 : Maven version range checker (`mvr/`)
Page publiée : `docs/tools/maven-version-range-checker/` → https://lawatch.github.io/10aday/tools/maven-version-range-checker/
- `mvr/mvr.js` : portage ligne à ligne de Maven Resolver 1.9.24 (`GenericVersion`, `GenericVersionRange`, `GenericVersionScheme.parseVersionConstraint`), le code que Maven 3.9.11 utilise pour ordonner les versions et résoudre les intervalles. La page charge une copie identique (`docs/tools/maven-version-range-checker/mvr.js`).
- Oracle Java : `mvr/oracle/Oracle.java`. Préparer les jars (`maven-resolver-util` et `maven-resolver-api` 1.9.24) avec `mvn dependency:copy-dependencies`, compiler `Oracle.java`, puis `MVN_CP="lib/*:cls" node mvr/test_mvr.js 1 2 3 4 5 6 7 8`. Résultat au 2026-11-12 : 2 115 512 vérifications (paires de versions + appartenance aux intervalles), 0 écart.
- Vrai Maven : `mvr/real_mvn/run.sh DIR` crée un dépôt local (8 versions) et lance `mvn dependency:list` pour 17 écritures ; résultats dans `mvr/real_mvn/RESULTS.txt`. `node mvr/check_real.js` : même choix que Maven sur les 17, copie publiée identique.
- Constats du vrai Maven : `[1.0,2.0)` → `2.0-rc1` ; `[1.0,2.0.min)` → `1.9.9` ; `[1.*]` refusé dans un `pom.xml` (caractère `*` interdit), alors que la bibliothèque l'accepte.
