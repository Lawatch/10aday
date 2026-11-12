#!/bin/sh
# Checks guides/prerelease_cases.json ("what gets installed") against the REAL tools:
# node-semver maxSatisfying (npm), Python packaging SpecifierSet.filter (what pip uses), RubyGems Gem::Dependency#match?
# (pre-release policy of gem install / Bundler), and a real `composer update --dry-run` with an inline package repository.
# Cargo is checked in gen_guides.js through vcc.js (0 mismatch vs the semver crate on ~330,000 pairs).
# Usage: SEMVER=/path/to/node_modules/semver sh check_prerelease_guide.sh
set -e
H=$(cd "$(dirname "$0")" && pwd); J="$H/prerelease_cases.json"; T=$(mktemp -d); FAIL=0
SEMVER=${SEMVER:-/opt/node22/lib/node_modules/npm/node_modules/semver}
node -e "const S=require('$SEMVER'),J=require('$J');let f=0;for(const r of J.rows){const g=S.maxSatisfying(J.available.npm,r.per.npm);if(g!==r.pick.npm){f=1;console.log('npm MISMATCH',r.label,g)}}console.log('npm (node-semver '+require('$SEMVER/package.json').version+'):',f?'FAIL':'OK');process.exit(f)" || FAIL=1
python3 -I -c "
import json,sys,packaging
from packaging.specifiers import SpecifierSet; from packaging.version import Version
J=json.load(open('$J')); f=0
for r in J['rows']:
  m=[Version(v) for v in SpecifierSet(r['per']['pip']).filter(J['available']['pip'])]
  g=str(max(m)) if m else None
  if g!=r['pick']['pip']: f=1; print('pip MISMATCH',r['label'],g)
print('pip (packaging',packaging.__version__+'):','FAIL' if f else 'OK'); sys.exit(f)" || FAIL=1
ruby -rjson -e '
J=JSON.parse(File.read(ARGV[0])); f=0
J["rows"].each{|r| d=Gem::Dependency.new("x",*r["per"]["rubygems"].split(", ")); m=J["available"]["rubygems"].select{|v| d.match?("x",v)}.map{|v| Gem::Version.new(v)}.max
  g=m && m.to_s; if g!=r["pick"]["rubygems"] then f=1; puts "rubygems MISMATCH #{r["label"]} #{g}" end}
puts "rubygems (#{Gem::VERSION}): #{f==1 ? "FAIL" : "OK"}"; exit f' "$J" || FAIL=1
python3 -I -c "
import json; J=json.load(open('$J'))
for i,r in enumerate(J['rows']): print(i, r['per']['composer'], r['pick']['composer'] or '-')" | while read i c want; do
  python3 -I -c "
import json,sys; J=json.load(open('$J')); c=sys.argv[1]
print(json.dumps({'name':'t/t','repositories':[{'packagist.org':False},{'type':'package','package':[{'name':'x/x','version':v} for v in J['available']['composer']]}],'require':{'x/x':c}}))" "$c" > "$T/composer.json"
  got=$(cd "$T" && rm -f composer.lock && COMPOSER_HOME="$T/h" composer update --dry-run --no-interaction 2>&1 | sed -n 's/.*Locking x\/x (\([^)]*\)).*/\1/p' | head -1)
  [ -z "$got" ] && got=-
  if [ "$got" != "$want" ]; then echo "composer MISMATCH $c: got $got want $want"; echo 1 > "$T/fail"; fi
done
[ -f "$T/fail" ] && FAIL=1
echo "composer ($(composer --version 2>/dev/null | cut -d' ' -f3)): $([ -f "$T/fail" ] && echo FAIL || echo OK)"
rm -rf "$T"; exit $FAIL
