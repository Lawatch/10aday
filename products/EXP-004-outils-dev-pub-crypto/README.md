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
