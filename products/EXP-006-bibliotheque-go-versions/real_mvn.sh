#!/bin/bash
# Real Maven check for verrange/maven (Maven 3.9.11): a local file repository holds ex:lib in the versions below,
# `mvn dependency:list` says which version each constraint resolves to. Output lines: constraint|published|picked
# Usage: ./real_mvn.sh <workdir> > ../../verrange/maven/testdata/real_mvn.txt
set -u; W=${1:?workdir}; rm -rf "$W"; mkdir -p "$W/repo/ex/lib" "$W/proj"; cd "$W"; W=$(pwd)
VS="1.0 1.5 1.9.9 1.10 2.0-alpha-1 2.0-beta1 2.0-rc1 2.0-SNAPSHOT 2.0 2.0.1 2.1-foo 3.0.RELEASE 3.0-sp1 10.0"
for v in $VS; do d=repo/ex/lib/$v; mkdir -p $d/e; echo x > $d/e/f; (cd $d && jar cf lib-$v.jar -C e f && rm -r e)
  printf '<project><modelVersion>4.0.0</modelVersion><groupId>ex</groupId><artifactId>lib</artifactId><version>%s</version></project>' $v > $d/lib-$v.pom; done
{ echo '<metadata><groupId>ex</groupId><artifactId>lib</artifactId><versioning><versions>'; for v in $VS; do echo "<version>$v</version>"; done; echo '</versions></versioning></metadata>'; } > repo/ex/lib/maven-metadata.xml
resolve() { cd "$W/proj"; rm -rf "$W/m2/ex" out.txt
  printf '<project><modelVersion>4.0.0</modelVersion><groupId>t</groupId><artifactId>t</artifactId><version>1</version><repositories><repository><id>loc</id><url>file://%s/repo</url><snapshots><enabled>true</enabled></snapshots></repository></repositories><dependencies><dependency><groupId>ex</groupId><artifactId>lib</artifactId><version>%s</version></dependency></dependencies></project>' "$W" "$1" > pom.xml
  mvn -q -o -Dmaven.repo.local="$W/m2" dependency:list -DoutputFile=out.txt > err.txt 2>&1 || mvn -q -Dmaven.repo.local="$W/m2" dependency:list -DoutputFile=out.txt > err.txt 2>&1
  r=$(grep -o 'ex:lib:jar:[^:]*' out.txt 2>/dev/null | sed 's/ex:lib:jar://'); [ -n "$r" ] && echo "$r" || echo "ERROR"; }
echo "# Maven 3.9.11, mvn dependency:list on a local repository, $(date -u +%F). Format: constraint|published|picked"
for c in '[1.0,2.0)' '(,2.0)' '[1.0,2.0-SNAPSHOT)' '[1.0,2.0.min)' '[1.0,2.min)' '[1.0,2-alpha)' '[1.0,2.0]' '[1.0,1.9]' '[1.0]' '1.5' \
  '[1.0, 2.0)' '[1.0,2.0),' '[2,3)' '[1.0,2.0),[2.0.1]' '[2.0,1.0]' '[1.0' '[1.0,1.10)' '(1.9.9,2.0)' '[2.0.1,)' '[,3.0]' '(,3.0)' \
  '[3.0]' '[3.0-ga]' '(2.0,3.0)' '[2.1,2.2)' '(,1.0],[3.0,)' '[1.0,2.0)[3.0,4.0)' '[1.5,1.5]' '(1.0,1.5)' '[11,)' '1.7' '[,1.0)' '[2.0-SNAPSHOT]'; do
  echo "$c|${VS// /,}|$(resolve "$c")"; done
