#!/bin/bash
# Real Maven check (Maven 3.9.11): builds a local file repository holding ex:lib in 8 versions,
# then asks `mvn dependency:list` which version each range resolves to. Usage: ./run.sh <workdir>
set -u; W=${1:?workdir}; rm -rf "$W"; mkdir -p "$W/repo/ex/lib" "$W/proj"; cd "$W"; W=$(pwd)
VS="1.0 1.5 1.9.9 2.0-alpha-1 2.0-beta1 2.0-rc1 2.0 2.0.1"
for v in $VS; do d=repo/ex/lib/$v; mkdir -p $d/e; echo x > $d/e/f; (cd $d && jar cf lib-$v.jar -C e f && rm -r e)
  printf '<project><modelVersion>4.0.0</modelVersion><groupId>ex</groupId><artifactId>lib</artifactId><version>%s</version></project>' $v > $d/lib-$v.pom; done
{ echo '<metadata><groupId>ex</groupId><artifactId>lib</artifactId><versioning><versions>'; for v in $VS; do echo "<version>$v</version>"; done; echo '</versions></versioning></metadata>'; } > repo/ex/lib/maven-metadata.xml
resolve() { cd "$W/proj"; rm -rf "$W/m2/ex" out.txt
  printf '<project><modelVersion>4.0.0</modelVersion><groupId>t</groupId><artifactId>t</artifactId><version>1</version><repositories><repository><id>loc</id><url>file://%s/repo</url></repository></repositories><dependencies><dependency><groupId>ex</groupId><artifactId>lib</artifactId><version>%s</version></dependency></dependencies></project>' "$W" "$1" > pom.xml
  mvn -q -Dmaven.repo.local="$W/m2" dependency:list -DoutputFile=out.txt > err.txt 2>&1
  r=$(grep -o 'ex:lib:jar:[^:]*' out.txt 2>/dev/null | sed 's/ex:lib:jar://'); [ -n "$r" ] && echo "$r" || { grep -q "must not contain any of these characters" err.txt && echo "REFUSED-IN-POM" || echo "ERROR"; }; }
for c in '[1.0,2.0)' '(,2.0)' '[1.0,2.0-SNAPSHOT)' '[1.0,2.0.min)' '[1.0,2.min)' '[1.0,2-alpha)' '[1.0,2.0]' '[1.0,1.9]' '[1.0]' '1.5' '[1.0, 2.0)' '[1.0,2.0),' '[2,3)' '[1.0,2.0),[2.0.1]' '[1.*]' '[2.0,1.0]' '[1.0'; do
  printf '%-22s %s\n' "$c" "$(resolve "$c")"; done
