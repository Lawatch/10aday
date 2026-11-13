#!/bin/bash
# Real Gradle resolution: builds a local Maven repository of empty artifacts for each case in cases.txt,
# resolves each declaration with gradle --offline and writes "selector|versions|chosen" to RESULTS.txt.
set -e
cd "$(dirname "$0")"
W=$(mktemp -d); REPO=$W/repo; i=0; DEPS=""
while IFS='|' read -r sel vers; do
  [[ -z "$sel" || "$sel" == \#* ]] && continue
  i=$((i+1)); a="case$i"; d=$REPO/t/$a; mkdir -p $d
  meta="<metadata><groupId>t</groupId><artifactId>$a</artifactId><versioning><versions>"
  IFS=',' read -ra VS <<< "$vers"
  for v in "${VS[@]}"; do
    mkdir -p $d/$v
    if [[ "$v" == *-SNAPSHOT ]]; then
      b=${v%-SNAPSHOT}; ts=20240101.000000
      echo "<metadata><groupId>t</groupId><artifactId>$a</artifactId><version>$v</version><versioning><snapshot><timestamp>$ts</timestamp><buildNumber>1</buildNumber></snapshot><snapshotVersions><snapshotVersion><extension>pom</extension><value>$b-$ts-1</value></snapshotVersion><snapshotVersion><extension>jar</extension><value>$b-$ts-1</value></snapshotVersion></snapshotVersions></versioning></metadata>" > $d/$v/maven-metadata.xml
      f=$a-$b-$ts-1
    else f=$a-$v; fi
    echo "<project><modelVersion>4.0.0</modelVersion><groupId>t</groupId><artifactId>$a</artifactId><version>$v</version></project>" > $d/$v/$f.pom
    (cd $W && rm -rf e && mkdir e && jar cf $d/$v/$f.jar -C e .) 2>/dev/null
    meta="$meta<version>$v</version>"
  done
  echo "$meta</versions></versioning></metadata>" > $d/maven-metadata.xml
  echo "$i|$sel|$vers" >> $W/index
  DEPS="$DEPS  c$i 't:$a:$sel'"$'\n'
done < cases.txt
mkdir -p $W/proj; cd $W/proj
echo "rootProject.name='t'" > settings.gradle
{
  echo "repositories { maven { url = uri('$REPO') } }"
  echo "configurations {"; for n in $(seq 1 $i); do echo "  c$n"; done; echo "}"
  echo "dependencies {"; printf '%s' "$DEPS"; echo "}"
  cat <<'G'
tasks.register('pick') { doLast {
  configurations.findAll { it.name ==~ /c\d+/ }.sort { (it.name - 'c') as int }.each { c ->
    def r = c.incoming.resolutionResult.root.dependencies[0]
    def v = (r instanceof org.gradle.api.artifacts.result.ResolvedDependencyResult) ? r.selected.moduleVersion.version : 'FAIL'
    println "PICK ${c.name - 'c'} ${v}"
  } } }
G
} > build.gradle
gradle --offline -q --no-daemon pick 2>/dev/null | grep '^PICK' > $W/picks
cd - >/dev/null
echo "# Gradle $(gradle --version 2>/dev/null | awk '/^Gradle/{print $2}') — selector|published|chosen" > RESULTS.txt
join -t'|' <(sort -t'|' -k1,1 $W/index) <(sed 's/^PICK \([0-9]*\) /\1|/' $W/picks | sort -t'|' -k1,1) | sort -t'|' -n -k1,1 | cut -d'|' -f2- >> RESULTS.txt
rm -rf $W
cat RESULTS.txt
