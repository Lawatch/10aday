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
