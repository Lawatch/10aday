#!/bin/sh
# Regenerate every oracle fixture in directory $1 (default: .) from $1/inputs.json.
# Needs: node + semver (SEMVER=path), python3 + packaging, ruby, php + composer/semver (COMPOSER_AUTOLOAD=path), cargo-oracle binary (CARGO_ORACLE=path)
D=${1:-.}; H=$(cd "$(dirname "$0")" && pwd)
cd "$D" && node "$H/oracle_npm.js" > npm.json && python3 "$H/oracle_pip.py" > pip.json && ruby "$H/oracle_ruby.rb" > ruby.json \
  && php "$H/oracle_composer.php" "$COMPOSER_AUTOLOAD" > composer.json && "$CARGO_ORACLE" inputs.json | sed 's/semver 1.x/semver 1.0.28/' > cargo.json
