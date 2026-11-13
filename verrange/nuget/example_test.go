package nuget_test

import (
	"fmt"

	"github.com/Lawatch/10aday/verrange/nuget"
)

func ExampleParseRange() {
	r, err := nuget.ParseRange("[1.0,2.0)")
	if err != nil {
		panic(err)
	}
	fmt.Println(r)
	fmt.Println(r.PrettyPrint(false))
	fmt.Println(r.Satisfies(nuget.MustParseVersion("1.5")))
	fmt.Println(r.Satisfies(nuget.MustParseVersion("2.0")))
	// Output:
	// [1.0.0, 2.0.0)
	// (>= 1.0.0 && < 2.0.0)
	// true
	// false
}

// NuGet restore picks the LOWEST version that fits a plain range, but the
// HIGHEST one that fits a floating version.
func ExampleRange_FindBestMatch() {
	published := []nuget.Version{
		nuget.MustParseVersion("1.0.0"),
		nuget.MustParseVersion("1.5.0"),
		nuget.MustParseVersion("1.9.9"),
		nuget.MustParseVersion("2.0.0-beta"),
		nuget.MustParseVersion("2.0.0"),
	}
	for _, s := range []string{"[1.0,2.0)", "1.*", "1.2", "*-*"} {
		v, ok := nuget.MustParseRange(s).FindBestMatch(published)
		fmt.Println(s, "->", v, ok)
	}
	// Output:
	// [1.0,2.0) -> 1.0.0 true
	// 1.* -> 1.9.9 true
	// 1.2 -> 1.5.0 true
	// *-* -> 2.0.0 true
}

// A pre-release is only picked when the range itself mentions one.
func ExampleRange_IsCandidate() {
	beta := nuget.MustParseVersion("1.5.0-beta")
	fmt.Println(nuget.MustParseRange("[1.0,2.0)").IsCandidate(beta))
	fmt.Println(nuget.MustParseRange("[1.0-alpha,2.0)").IsCandidate(beta))
	fmt.Println(nuget.MustParseRange("1.*-*").IsCandidate(beta))
	// Output:
	// false
	// true
	// true
}

func ExampleCompare() {
	a := nuget.MustParseVersion("1.0.0-beta.10")
	b := nuget.MustParseVersion("1.0.0-BETA.9")
	fmt.Println(nuget.Compare(a, b))
	fmt.Println(nuget.Compare(nuget.MustParseVersion("1.0"), nuget.MustParseVersion("1.0.0.0+build")))
	// Output:
	// 1
	// 0
}

// npm-style operators are not NuGet syntax.
func ExampleParseRange_invalid() {
	for _, s := range []string{"^1.0", "~1.0", ">=1.0", "[2.0,1.0]"} {
		_, err := nuget.ParseRange(s)
		fmt.Println(s, err)
	}
	// Output:
	// ^1.0 nuget: invalid version range
	// ~1.0 nuget: invalid version range
	// >=1.0 nuget: invalid version range
	// [2.0,1.0] nuget: invalid version range
}
