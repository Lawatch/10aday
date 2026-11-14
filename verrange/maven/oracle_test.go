package maven

import (
	"compress/gzip"
	"encoding/json"
	"io"
	"os"
	"strings"
	"testing"
)

// oracleSet holds versions, constraints and the answers of the real Maven
// Resolver 1.9.24: o[0] is the compare matrix ("<", "=", ">" for every pair),
// then one line per constraint: "ERR" when Maven rejects it, else 1/0 for
// containsVersion on every version.
type oracleSet struct {
	V []string `json:"v"`
	C []string `json:"c"`
	O []string `json:"o"`
}

func TestAgainstRealMaven(t *testing.T) {
	path := "testdata/oracle.json.gz"
	if p := os.Getenv("MAVEN_ORACLE"); p != "" {
		path = p
	}
	f, err := os.Open(path)
	if err != nil {
		t.Fatal(err)
	}
	defer f.Close()
	var r io.Reader = f
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
					fail("Compare(%q, %q) = %c, Maven says %c", s.V[i], s.V[j], got, want)
				}
			}
		}
		for k, c := range s.C {
			want := s.O[k+1]
			var got string
			if con, err := ParseConstraint(c); err != nil {
				got = "ERR"
			} else {
				var b strings.Builder
				for _, v := range pv {
					if con.ContainsVersion(v) {
						b.WriteByte('1')
					} else {
						b.WriteByte('0')
					}
				}
				got = b.String()
			}
			if want == "ERR" {
				checks++
			} else {
				checks += n
			}
			if got != want {
				fail("constraint %q:\n got   %s\n Maven %s", c, got, want)
			}
		}
	}
	t.Logf("%d checks against Maven Resolver 1.9.24, %d differences", checks, bad)
}

// TestRealMavenBuilds replays real "mvn dependency:list" resolutions against
// a local repository (testdata/real_mvn.txt: constraint|published|picked).
func TestRealMavenBuilds(t *testing.T) {
	data, err := os.ReadFile("testdata/real_mvn.txt")
	if err != nil {
		t.Fatal(err)
	}
	n := 0
	for _, l := range strings.Split(string(data), "\n") {
		if l == "" || l[0] == '#' {
			continue
		}
		f := strings.Split(l, "|")
		got := "ERROR"
		if c, err := ParseConstraint(f[0]); err == nil {
			if v, ok := c.Select(strings.Split(f[1], ",")); ok {
				got = v
			}
		}
		if got != f[2] {
			t.Errorf("%s from %s: got %s, Maven picked %s", f[0], f[1], got, f[2])
		}
		n++
	}
	if n < 15 {
		t.Fatalf("only %d cases", n)
	}
}
