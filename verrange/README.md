# verrange — NuGet, Maven and Gradle version ranges in Go

[![Go Reference](https://pkg.go.dev/badge/github.com/Lawatch/10aday/verrange.svg)](https://pkg.go.dev/github.com/Lawatch/10aday/verrange)

Go packages that read version ranges the way the real build tools do, and
tell you which published version they would pick. Zero dependencies.

| Package | Ecosystem | Status |
|---|---|---|
| [`nuget`](https://pkg.go.dev/github.com/Lawatch/10aday/verrange/nuget) | NuGet / `dotnet restore` (`[1.0,2.0)`, `1.*`, `1.0.0-beta*`, `*-*`) | ready |
| `maven` | Maven (`[1.0,2.0)`, Maven version order) | planned |
| [`gradle`](https://pkg.go.dev/github.com/Lawatch/10aday/verrange/gradle) | Gradle (`1.+`, `latest.release`, `[1.0,2.0)`, Gradle version order) | ready |

Go already has good libraries for semver, npm, Composer, PyPI and Cargo
ranges. This module covers the .NET and JVM ecosystems, which had none.

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
range where the result differs from `dotnet restore` or Gradle are welcome as issues.

License: Apache-2.0. The `nuget` package is a port of NuGet.Versioning
(Apache-2.0, .NET Foundation) and the `gradle` package a port of Gradle's
version classes (Apache-2.0, Gradle Inc.); see NOTICE.
