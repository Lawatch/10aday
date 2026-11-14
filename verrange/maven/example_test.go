package maven_test

import (
	"fmt"

	"github.com/Lawatch/10aday/verrange/maven"
)

func ExampleParseConstraint() {
	published := []string{"1.0", "1.5", "1.10", "2.0-rc1", "2.0", "2.0.1"}
	for _, decl := range []string{"[1.0,2.0)", "[1.0,2.0-alpha)", "[2,3)", "(,1.0],[2.0.1]", "1.5"} {
		c, err := maven.ParseConstraint(decl)
		if err != nil {
			fmt.Println(decl, "→", err)
			continue
		}
		v, ok := c.Select(published)
		fmt.Println(decl, "→", v, ok)
	}
	// Output:
	// [1.0,2.0) → 2.0-rc1 true
	// [1.0,2.0-alpha) → 1.10 true
	// [2,3) → 2.0.1 true
	// (,1.0],[2.0.1] → 2.0.1 true
	// 1.5 → 1.5 true
}

func ExampleConstraint_Contains() {
	c := maven.MustParseConstraint("[1.0,2.0)")
	fmt.Println(c.Contains("1.0.0"), c.Contains("2.0-SNAPSHOT"), c.Contains("2.0"))
	_, err := maven.ParseConstraint("[2.0,1.0]")
	fmt.Println(err)
	// Output:
	// true true false
	// maven: invalid version constraint "[2.0,1.0]": lower bound must not be greater than upper bound
}

func ExampleCompare() {
	fmt.Println(maven.Compare("1.0", "1.0.0"))       // trailing zeros do not count
	fmt.Println(maven.Compare("1.0-ga", "1.0"))      // "ga", "final", "release" = no qualifier
	fmt.Println(maven.Compare("1.0-rc1", "1.0"))     // pre-releases come first
	fmt.Println(maven.Compare("1.0-sp1", "1.0"))     // service packs come after
	fmt.Println(maven.Compare("1.10", "1.9"))        // numbers, not text
	fmt.Println(maven.Compare("1.0a1", "1.0-alpha")) // "a1" is alpha 1
	// Output:
	// 0
	// 0
	// -1
	// 1
	// 1
	// 1
}

func ExampleSort() {
	vs := []string{"2.0", "1.0-SNAPSHOT", "1.0", "2.0-rc1", "1.0-sp1", "1.0-alpha"}
	maven.Sort(vs)
	fmt.Println(vs)
	// Output:
	// [1.0-alpha 1.0-SNAPSHOT 1.0 1.0-sp1 2.0-rc1 2.0]
}
