// Command verrange checks versions against a NuGet, Maven or Gradle version
// range, the way the real build tool reads it, and prints the version the tool
// would pick.
//
// Usage:
//
//	verrange <nuget|maven|gradle> <range> [version ...]
//
// With no version arguments, versions are read from standard input, one per
// line (blank lines and lines starting with # are skipped).
//
// Examples:
//
//	go run github.com/Lawatch/10aday/verrange/cmd/verrange@latest nuget "[1.0,2.0)" 1.5.0
//	go run github.com/Lawatch/10aday/verrange/cmd/verrange@latest maven "[1.0,2.0)" 1.0 1.5 2.0-rc1 2.0
//	go run github.com/Lawatch/10aday/verrange/cmd/verrange@latest gradle "1.+" 1.0 1.9 2.0
//
// For each version it prints "yes" or "no". With two or more versions it also
// prints the version the build tool would pick ("pick: ..."), or "pick: none".
//
// Exit status: 0 if at least one version matches (and, with several versions,
// the tool would pick one), 1 if none does, 2 on a usage error or an invalid
// range.
package main

import (
	"bufio"
	"errors"
	"fmt"
	"io"
	"os"
	"strings"

	"github.com/Lawatch/10aday/verrange/gradle"
	"github.com/Lawatch/10aday/verrange/maven"
	"github.com/Lawatch/10aday/verrange/nuget"
)

const usage = `usage: verrange <nuget|maven|gradle> <range> [version ...]

Checks each version against the range, the way dotnet restore, mvn or Gradle
reads it. With several versions, also prints the one the tool would pick.
Without version arguments, reads versions from standard input, one per line.

examples:
  verrange nuget "[1.0,2.0)" 1.5.0
  verrange maven "[1.0,2.0)" 1.0 1.5 2.0-rc1 2.0
  verrange gradle "1.+" 1.0 1.9 2.0
  verrange gradle latest.release < versions.txt

exit status: 0 = a version matches, 1 = none matches, 2 = usage error.
`

// checker is one ecosystem: does v match, and which version would the tool pick.
type checker struct {
	match func(v string) (bool, error)
	pick  func(vs []string) (string, bool, error)
}

func newChecker(eco, rng string) (*checker, error) {
	switch strings.ToLower(eco) {
	case "nuget", "dotnet", "nupkg":
		r, err := nuget.ParseRange(rng)
		if err != nil {
			return nil, err
		}
		parse := func(vs []string) ([]nuget.Version, error) {
			out := make([]nuget.Version, 0, len(vs))
			for _, s := range vs {
				v, err := nuget.ParseVersion(s)
				if err != nil {
					return nil, fmt.Errorf("%q is not a NuGet version", s)
				}
				out = append(out, v)
			}
			return out, nil
		}
		return &checker{
			match: func(s string) (bool, error) {
				vs, err := parse([]string{s})
				if err != nil {
					return false, err
				}
				// A float ("1.*") matches only versions that fit its pattern:
				// NuGet's own Satisfies would also accept 2.0.0 for "1.*".
				ok := r.IsCandidate(vs[0]) && (!r.IsFloating() || r.Float.Satisfies(vs[0]))
				return ok, nil
			},
			pick: func(ss []string) (string, bool, error) {
				vs, err := parse(ss)
				if err != nil {
					return "", false, err
				}
				i := r.BestMatchIndex(vs)
				if i < 0 {
					return "", false, nil
				}
				return ss[i], true, nil
			},
		}, nil
	case "maven", "mvn":
		c, err := maven.ParseConstraint(rng)
		if err != nil {
			return nil, err
		}
		return &checker{
			match: func(s string) (bool, error) { return c.Contains(s), nil },
			pick: func(ss []string) (string, bool, error) {
				v, ok := c.Select(ss)
				return v, ok, nil
			},
		}, nil
	case "gradle":
		if strings.TrimSpace(rng) == "" {
			return nil, errors.New("empty Gradle version")
		}
		s := gradle.ParseSelector(rng)
		return &checker{
			match: func(v string) (bool, error) {
				if s.Kind() == gradle.Latest {
					return s.AcceptStatus(gradle.MavenStatus(v)), nil
				}
				return s.Accept(v), nil
			},
			pick: func(ss []string) (string, bool, error) {
				v, ok := s.Select(ss)
				return v, ok, nil
			},
		}, nil
	}
	return nil, fmt.Errorf("unknown ecosystem %q (want nuget, maven or gradle)", eco)
}

func readVersions(r io.Reader) ([]string, error) {
	var out []string
	sc := bufio.NewScanner(r)
	for sc.Scan() {
		line := strings.TrimSpace(sc.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		out = append(out, line)
	}
	return out, sc.Err()
}

func run(args []string, stdin io.Reader, stdout, stderr io.Writer) int {
	if len(args) >= 1 && (args[0] == "-h" || args[0] == "-help" || args[0] == "--help" || args[0] == "help") {
		fmt.Fprint(stdout, usage)
		return 0
	}
	if len(args) < 2 {
		fmt.Fprint(stderr, usage)
		return 2
	}
	c, err := newChecker(args[0], args[1])
	if err != nil {
		fmt.Fprintf(stderr, "verrange: invalid range %q: %v\n", args[1], err)
		return 2
	}
	versions := args[2:]
	if len(versions) == 0 {
		versions, err = readVersions(stdin)
		if err != nil {
			fmt.Fprintf(stderr, "verrange: reading standard input: %v\n", err)
			return 2
		}
		if len(versions) == 0 {
			fmt.Fprint(stderr, "verrange: no version given\n\n"+usage)
			return 2
		}
	}
	any := false
	matched := map[string]bool{}
	for _, v := range versions {
		ok, err := c.match(v)
		if err != nil {
			fmt.Fprintf(stderr, "verrange: %v\n", err)
			return 2
		}
		ans := "no"
		if ok {
			ans, any = "yes", true
			matched[v] = true
		}
		fmt.Fprintf(stdout, "%-4s %s\n", ans, v)
	}
	if len(versions) < 2 {
		if any {
			return 0
		}
		return 1
	}
	v, ok, err := c.pick(versions)
	if err != nil {
		fmt.Fprintf(stderr, "verrange: %v\n", err)
		return 2
	}
	if !ok {
		if v != "" {
			// Maven asks the repository for this exact text.
			fmt.Fprintf(stdout, "pick: none (the tool asks for exactly %q, not in the list)\n", v)
		} else {
			fmt.Fprintln(stdout, "pick: none")
		}
		return 1
	}
	if !matched[v] {
		// NuGet: nothing fits the float, restore takes the closest higher version.
		fmt.Fprintf(stdout, "pick: %s (fallback: no version fits the pattern)\n", v)
		return 0
	}
	fmt.Fprintf(stdout, "pick: %s\n", v)
	return 0
}

func main() {
	os.Exit(run(os.Args[1:], os.Stdin, os.Stdout, os.Stderr))
}
