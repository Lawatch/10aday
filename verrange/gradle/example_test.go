package gradle_test

import (
	"fmt"

	"github.com/Lawatch/10aday/verrange/gradle"
)

func ExampleParseSelector() {
	published := []string{"1.0", "1.9", "1.10", "2.0-rc1", "2.0", "10.0"}
	for _, decl := range []string{"1.+", "[1.0,2.0)", "latest.release", "1.9"} {
		v, ok := gradle.ParseSelector(decl).Select(published)
		fmt.Println(decl, "→", v, ok)
	}
	// Output:
	// 1.+ → 1.10 true
	// [1.0,2.0) → 1.10 true
	// latest.release → 10.0 true
	// 1.9 → 1.9 true
}

func ExampleSelector_Accept() {
	r := gradle.ParseSelector("[1.0,2.0)")
	fmt.Println(r.Kind(), r.Accept("1.5"), r.Accept("2.0-rc1"), r.Accept("2.0"))
	p := gradle.ParseSelector("1.+")
	fmt.Println(p.Kind(), p.Accept("1.10"), p.Accept("10.0"))
	// Output:
	// range true false false
	// prefix true false
}

func ExampleCompare() {
	fmt.Println(gradle.Compare("1.0", "1.0.0"))        // Maven says equal
	fmt.Println(gradle.Compare("1.0-rc1", "1.0"))      // release candidate first
	fmt.Println(gradle.Compare("1.0-sp1", "1.0-rc1"))  // sp ranks above rc
	fmt.Println(gradle.Compare("1.0-M1", "1.0-alpha")) // other words: string order
	// Output:
	// -1
	// -1
	// 1
	// -1
}

func ExampleSort() {
	vs := []string{"1.0", "1.0-SNAPSHOT", "1.0-rc1", "1.0-dev", "1.0.1", "1.0-sp1", "1.0-alpha"}
	gradle.Sort(vs)
	fmt.Println(vs)
	// Output:
	// [1.0-dev 1.0-alpha 1.0-rc1 1.0-SNAPSHOT 1.0-sp1 1.0 1.0.1]
}
