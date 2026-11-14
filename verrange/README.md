# verrange — NuGet, Maven and Gradle version ranges in Go

[![Go Reference](https://pkg.go.dev/badge/github.com/Lawatch/10aday/verrange.svg)](https://pkg.go.dev/github.com/Lawatch/10aday/verrange)

Go packages that read version ranges the way the real build tools do, and
tell you which published version they would pick. Zero dependencies.

| Package | Ecosystem | Status |
|---|---|---|
| [`nuget`](https://pkg.go.dev/github.com/Lawatch/10aday/verrange/nuget) | NuGet / `dotnet restore` (`[1.0,2.0)`, `1.*`, `1.0.0-beta*`, `*-*`) | ready |
| [`maven`](https://pkg.go.dev/github.com/Lawatch/10aday/verrange/maven) | Maven 3.9 (`[1.0,2.0)`, `(,1.0],[1.2,)`, `[1.0]`, Maven Resolver version order) | ready |
| [`gradle`](https://pkg.go.dev/github.com/Lawatch/10aday/verrange/gradle) | Gradle (`1.+`, `latest.release`, `[1.0,2.0)`, Gradle version order) | ready |

Go already has good libraries for semver, npm, Composer, PyPI and Cargo
ranges. This module covers the .NET and JVM ecosystems: NuGet floating
versions and Gradle dynamic versions had no Go library, and for Maven it
follows Maven Resolver, the code `mvn` actually uses to resolve a range.

## Install

```
go get github.com/Lawatch/10aday/verrange@latest
```

## NuGet

```go
import "github.com/Lawatch/10aday/verrange/nuget"

r, err := nuget.ParseRange("[1.0,2.0)")
if err != nil { /* not a NuGet range: "^1.0", ">=1.0"... are rejected, like NuGet does */ }

r.Satisfies(nuget.MustParseVersion("1.5"))       // true
r.PrettyPrint(false)                              // "(>= 1.0.0 && < 2.0.0)"

published := []nuget.Version{
    nuget.MustParseVersion("1.0.0"),
    nuget.MustParseVersion("1.9.9"),
    nuget.MustParseVersion("2.0.0"),
}
v, _ := r.FindBestMatch(published)                         // 1.0.0: restore takes the LOWEST match
v, _ = nuget.MustParseRange("1.*").FindBestMatch(published) // 1.9.9: a float takes the HIGHEST
```

What it gets right, because NuGet does it this way:

- 4-part versions (`1.2.3.4`), `1.0` == `1.0.0.0`, build metadata ignored.
- Pre-release labels compared case-insensitively, numeric labels as numbers (`beta.10` > `beta.9`).
- A pre-release is only a candidate when the range mentions one (`IsCandidate`).
- Floating versions: `*`, `1.*`, `1.2.*`, `1.0.0-beta*`, `1.*-*`, `*-*`, `[1.*,2.0)`.
- Best match: lowest version for a plain range, highest matching version for a float,
  and the fallback NuGet uses when nothing matches the float (`1.2.*` with no 1.2.x → 1.3.0).
- Same output strings as NuGet: `String()` (normalized), `ShortString()`, `PrettyPrint()`.

### How it is tested

- **2,705,885 checks, 0 differences** against the real `NuGet.Versioning` 8.0.0 package
  (160,033 generated ranges and version lists). A 12,033-case sample ships in
  `nuget/testdata/oracle.json.gz` and runs with `go test`.
- **27 real `dotnet restore` runs** (SDK 8.0.134) on a local feed: for each one, the
  package picks the same version restore installed (`nuget/testdata/real_restore.txt`).

Try it in the browser: [NuGet version range checker](https://lawatch.github.io/10aday/tools/nuget-version-range-checker/).
Related tools: [Maven range checker](https://lawatch.github.io/10aday/tools/maven-version-range-checker/),
[Gradle dynamic version checker](https://lawatch.github.io/10aday/tools/gradle-dynamic-version-checker/).

## Maven

```go
import "github.com/Lawatch/10aday/verrange/maven"

published := []string{"1.0", "1.5", "1.10", "2.0-rc1", "2.0", "2.0.1"}

c, err := maven.ParseConstraint("[1.0,2.0)")
if err != nil { /* Maven would fail the build too: "[2.0,1.0]", "[1.0", "[1.0)"... */ }
v, ok := c.Select(published)                                    // "2.0-rc1", true: pre-releases are inside!
v, ok = maven.MustParseConstraint("[1.0,2.0-alpha)").Select(published) // "1.10", true
v, ok = maven.MustParseConstraint("[3.0]").Select([]string{"3.0.RELEASE"}) // "3.0", false: build fails

c.Contains("1.0.0")            // true
maven.Compare("1.0", "1.0-ga") // 0
maven.Sort(versions)           // Maven order, lowest first
```

What it gets right, because Maven 3.9 does it this way:

- Version order of Maven Resolver (`GenericVersionScheme`): `1.0` = `1.0.0` = `1.0-ga` = `1.0.Final`;
  `alpha` < `beta` < `milestone` < `rc` = `cr` < `snapshot` < release < `sp` < other words;
  `1.0a1` is alpha 1; `min` / `max` at the end sort below / above everything (`[1.0,2.min)`).
  This is the order Maven uses for ranges, not maven-artifact's `ComparableVersion`.
- Ranges and unions: `[1.0,2.0)`, `(,1.0]`, `[1.0,)`, `(,1.0],[1.2,)`, `[1.*]`; Maven's own error cases.
- `Select`: highest published version in the range, snapshots and pre-releases included.
  A plain version or a single-version range (`[1.0]`) is used as an exact string,
  without looking at the published list: `[3.0]` fails if only `3.0.RELEASE` exists.
- Non-ASCII digits count as digits, as in Java: `١.٠` = `1.0`.

### How it is tested

- **8,456,138 checks, 0 differences** against the real Maven Resolver 1.9.24 classes
  (shipped with Maven 3.9.11): comparison of every pair of versions and
  `containsVersion` of every constraint, on fixed traps and generated inputs.
  A 197,886-check sample ships in `maven/testdata/oracle.json.gz`.
- **33 real `mvn dependency:list` runs** (Maven 3.9.11, local repository with 14 versions):
  for each one, `Select` picks the version Maven resolved, or fails when Maven failed
  (`maven/testdata/real_mvn.txt`).

Not modelled: "nearest wins" between several declarations, `LATEST` / `RELEASE`
metaversions, and version properties (`${...}`).

## Gradle

```go
import "github.com/Lawatch/10aday/verrange/gradle"

published := []string{"1.0", "1.9", "1.10", "2.0-rc1", "2.0", "10.0"}

v, ok := gradle.ParseSelector("1.+").Select(published)       // "1.10", true: highest match, "1.+" is a text prefix
v, ok = gradle.ParseSelector("[1.0,2.0)").Select(published)  // "1.10", true: 2.0-rc1 is excluded too
v, ok = gradle.ParseSelector("latest.release").Select(published) // "10.0", true

gradle.ParseSelector("[1.0,2.0)").Accept("2.0-rc1") // false
gradle.Compare("1.0", "1.0.0")                      // -1: not equal for Gradle
gradle.Sort(versions)                               // Gradle order, lowest first
```

What it gets right, because Gradle does it this way (and Maven does not):

- `1.0` < `1.0.0`; a version with a qualifier is lower than the bare version
  (`1.0-rc1` < `1.0`, but also `1.0-sp1` < `1.0`).
- Between qualifiers: `dev` < other words < `rc` < `snapshot` < `final` < `ga` < `release` < `sp`;
  other words compare as case-sensitive strings (`1.0-M1` < `1.0-alpha`).
- `1.+`, `1.0+`, `+` are text prefixes: `1.+` takes `1.10` but not `10.0`.
- Ranges in both notations: `[1.0,2.0)`, `]1.0,2.0[`, `(,2.0]`, `[1.0,)`, `[1.0]`.
  An exclusive upper bound also rejects versions that start with it (`2.0-rc1` for `[1.0,2.0)`).
- `latest.release` skips `-SNAPSHOT` versions, `latest.integration` takes them.

### How it is tested

- **6,725,337 checks, 0 differences** against the real Gradle 8.14.3 classes
  (`VersionParser`, `DefaultVersionComparator`, `DefaultVersionSelectorScheme`):
  comparison of every pair of versions and `accept` of every selector, on fixed and
  generated inputs. A 358,529-check sample ships in `gradle/testdata/oracle.json.gz`.
- **35 real Gradle builds** (8.14.3, offline, local Maven repository): for each one,
  `Select` picks the version Gradle resolved (`gradle/testdata/real_gradle.txt`).

Not modelled: conflict resolution between several declarations of the same module,
rich versions (`strictly`, `prefer`, `reject`), and Ivy statuses other than the defaults.

## About

Written by AI agents of the [10aday](https://github.com/Lawatch/10aday) project,
and tested against the official tools as described above. Bug reports with a
range where the result differs from `dotnet restore`, `mvn` or Gradle are welcome as issues.

License: Apache-2.0. The `nuget` package is a port of NuGet.Versioning
(Apache-2.0, .NET Foundation) and the `gradle` package a port of Gradle's
version classes (Apache-2.0, Gradle Inc.) and the `maven` package a port of
Maven Resolver's version scheme (Apache-2.0, Apache Software Foundation); see NOTICE.
