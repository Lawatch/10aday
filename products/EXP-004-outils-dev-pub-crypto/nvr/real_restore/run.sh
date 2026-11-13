#!/bin/bash
# Real `dotnet restore` against a local folder feed holding fake packages "Demo" in a few versions.
# Usage: bash run.sh > RESULTS.txt   (needs dotnet SDK 8; nothing is downloaded from nuget.org)
set -u
W=$(mktemp -d); FEED=$W/feed; mkdir -p $FEED
mkpkg() { # $1 = version
  local d=$W/p/$1; mkdir -p $d
  cat > $d/Demo.nuspec <<NS
<?xml version="1.0"?><package xmlns="http://schemas.microsoft.com/packaging/2013/05/nuspec.xsd"><metadata>
<id>Demo</id><version>$1</version><authors>t</authors><description>t</description></metadata></package>
NS
  (cd $d && python3 -c "import zipfile,sys;z=zipfile.ZipFile(sys.argv[1],'w');z.write('Demo.nuspec');z.close()" "$FEED/Demo.$1.nupkg")
}
restore() { # $1 = case name, $2 = Version attribute, $3.. = published versions
  local name=$1 rng=$2; shift 2
  rm -rf $FEED/* $W/p $W/gp; mkdir -p $FEED
  for v in "$@"; do mkpkg $v; done
  local P=$W/proj; rm -rf $P; mkdir -p $P
  cat > $P/p.csproj <<CS
<Project Sdk="Microsoft.NET.Sdk"><PropertyGroup><TargetFramework>net8.0</TargetFramework></PropertyGroup>
<ItemGroup><PackageReference Include="Demo" Version="$rng" /></ItemGroup></Project>
CS
  cat > $P/nuget.config <<NC
<configuration><packageSources><clear/><add key="local" value="$FEED"/></packageSources></configuration>
NC
  local out; out=$(cd $P && NUGET_PACKAGES=$W/gp dotnet restore 2>&1)
  local got; got=$(python3 -c "import json,sys;d=json.load(open(sys.argv[1]));print([k for k in d['libraries'] if k.startswith('Demo/')][0].split('/')[1])" $P/obj/project.assets.json 2>/dev/null || echo FAIL)
  local codes; codes=$(echo "$out" | grep -oE 'NU1[0-9]{3}' | sort -u | tr '\n' ' ')
  echo "$name | Version=\"$rng\" | published: $* | restored: $got | codes: ${codes:-none}"
}
restore lowest      "[1.0,2.0)"   1.0.0 1.5.0 1.9.9 2.0.0
restore bare        "1.0"         1.0.0 1.0.1 3.0.0
restore bare-miss   "1.0"         1.0.1 1.2.0 3.0.0
restore pre-skip    "[1.0,2.0)"   1.5.0-beta 1.6.0 1.7.0
restore pre-only    "[1.0,2.0)"   1.5.0-beta
restore pre-bound   "[1.0.0-beta,2.0)" 1.0.0-alpha 1.0.0-beta 1.6.0
restore excl-min    "(1.0,)"      1.0.0 1.0.1 5.0.0
restore upper-only  "(,2.0]"      0.1.0 1.0.0 2.0.0
restore exact       "[1.0]"       1.0.0 1.0.1
restore exact-miss  "[1.0]"       1.0.1
restore star        "*"           1.0.0 2.0.0 3.0.0-beta
restore star-star   "*-*"         1.0.0 2.0.0 3.0.0-beta
restore minor-float "1.*"         0.9.0 1.0.0 1.4.0 1.9.9-beta 2.0.0
restore patch-float "1.2.*"       1.2.0 1.2.9 1.3.0
restore float-miss  "1.2.*"       1.1.0 1.3.0 1.4.0
restore float-low   "1.2.*"       1.1.0
restore pre-float   "1.*-*"       1.0.0 1.5.0-beta 1.5.0 2.0.0-beta
restore pre-float2  "1.*-*"       1.0.0 1.6.0-beta 1.5.0
restore rel-float   "1.0.0-*"     1.0.0-alpha 1.0.0-beta 1.0.0 1.0.1
restore rel-prefix  "1.0.0-beta*" 1.0.0-alpha 1.0.0-beta.1 1.0.0-beta.2 1.0.0-rc.1
restore float-range "[1.*,2.0)"   1.0.0 1.5.0 2.0.0 2.1.0
restore case        "1.0.0-RC.1"  1.0.0-rc.1 1.0.0-rc.2
restore rev-float   "1.0.0.*"     1.0.0.1 1.0.0.9 1.0.1
restore caret       "^1.0"        1.0.0
restore tilde       "~1.0"        1.0.0
restore gte         ">=1.0"       1.0.0
restore none-in     "[1.0,2.0)"   0.9.0 2.0.0
rm -rf $W
