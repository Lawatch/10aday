#!/bin/sh
# Regenerate the fixtures of seed $2 (0 = fixed list) into directory $1.
# Needs: SEMVER, COMPOSER_AUTOLOAD, CARGO_SORT_ORACLE (see each oracle file).
D=$1; H=$(cd "$(dirname "$0")" && pwd); mkdir -p "$D"
python3 "$H/gen_inputs.py" "${2:-0}" > "$D/inputs.json" && cd "$D" \
 && node "$H/oracle_npm.js" < inputs.json > npm.json && python3 "$H/oracle_pip.py" < inputs.json > pip.json \
 && ruby "$H/oracle_ruby.rb" < inputs.json > rubygems.json && php "$H/oracle_composer.php" "$COMPOSER_AUTOLOAD" < inputs.json > composer.json \
 && "$CARGO_SORT_ORACLE" < inputs.json > cargo.json
