package gradle

import (
	"compress/gzip"
	"encoding/json"
	"os"
	"strings"
	"testing"
)

// oracleSet holds versions, selectors and the answers of the real Gradle
// 8.14.3 classes: o[0] is the compare matrix ("<", "=", ">" for every pair),
// then one line per selector: kind letter (E/P/R/L), ':', and 1/0 for
// Accept on every version.
type oracleSet struct {
	V []string `json:"v"`
	C []string `json:"c"`
	O []string `json:"o"`
}

func TestAgainstRealGradle(t *testing.T) {
	path := "testdata/oracle.json.gz"
	if p := os.Getenv("GRADLE_ORACLE"); p != "" {
		path = p
	}
	f, err := os.Open(path)
	if err != nil {
		t.Fatal(err)
	}
	defer f.Close()
	var r interface{ Read([]byte) (int, error) } = f
	if strings.HasSuffix(path, ".gz") {
		z, err := gzip.NewReader(f)
		if err != nil {
			t.Fatal(err)
		}
		r = z
	}
	var sets []oracleSet
	if err := json.NewDecoder(r).Decode(&sets); err != nil {
		t.Fatal(err)
	}
	kinds := map[Kind]byte{Exact: 'E', Prefix: 'P', Range: 'R', Latest: 'L'}
	checks, bad := 0, 0
	fail := func(format string, a ...any) {
		bad++
		if bad <= 20 {
			t.Errorf(format, a...)
		}
	}
	for _, s := range sets {
		pv := make([]Version, len(s.V))
		for i, v := range s.V {
			pv[i] = ParseVersion(v)
		}
		row := []rune(s.O[0])
		n := len(s.V)
		for i := range pv {
			for j := range pv {
				want := row[i*n+j]
				got := [...]rune{'<', '=', '>'}[pv[i].Compare(pv[j])+1]
				checks++
				if got != want {
					fail("Compare(%q, %q) = %c, Gradle says %c", s.V[i], s.V[j], got, want)
				}
			}
		}
		for k, c := range s.C {
			sel := ParseSelector(c)
			var b strings.Builder
			b.WriteByte(kinds[sel.Kind()])
			b.WriteByte(':')
			for _, v := range s.V {
				if sel.Accept(v) {
					b.WriteByte('1')
				} else {
					b.WriteByte('0')
				}
			}
			checks += n + 1
			if b.String() != s.O[k+1] {
				fail("selector %q:\n got    %s\n Gradle %s", c, b.String(), s.O[k+1])
			}
		}
	}
	t.Logf("%d checks against Gradle 8.14.3, %d differences", checks, bad)
}

// TestRealGradleBuilds replays real "gradle dependencies" resolutions against
// a local Maven repository (testdata/real_gradle.txt: selector|published|picked).
func TestRealGradleBuilds(t *testing.T) {
	data, err := os.ReadFile("testdata/real_gradle.txt")
	if err != nil {
		t.Fatal(err)
	}
	n := 0
	for _, l := range strings.Split(string(data), "\n") {
		if l == "" || l[0] == '#' {
			continue
		}
		f := strings.Split(l, "|")
		got, ok := ParseSelector(f[0]).Select(strings.Split(f[1], ","))
		if !ok {
			got = "FAIL"
		}
		if got != f[2] {
			t.Errorf("%s from %s: got %s, Gradle picked %s", f[0], f[1], got, f[2])
		}
		n++
	}
	if n < 20 {
		t.Fatalf("only %d cases", n)
	}
}
