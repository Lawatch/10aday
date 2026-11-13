package nuget

import (
	"bufio"
	"compress/gzip"
	"encoding/json"
	"os"
	"regexp"
	"strings"
	"testing"
)

// oracleCase is one case answered by the real NuGet.Versioning 8.0.0
// (see the oracle program in the 10aday repository).
type oracleCase struct {
	R string   `json:"r"`
	V []string `json:"v"`
	O struct {
		Err *string `json:"err"`
		V   []*struct {
			N string `json:"n"`
			F string `json:"f"`
		} `json:"v"`
		R *struct {
			N    string  `json:"n"`
			A    string  `json:"a"`
			P    string  `json:"p"`
			F    string  `json:"F"`
			Fl   bool    `json:"fl"`
			Sat  []*bool `json:"sat"`
			Cand []*bool `json:"cand"`
			Best int     `json:"best"`
		} `json:"r"`
	} `json:"o"`
}

func loadOracle(t *testing.T, path string) []oracleCase {
	f, err := os.Open(path)
	if err != nil {
		t.Fatal(err)
	}
	defer f.Close()
	z, err := gzip.NewReader(f)
	if err != nil {
		t.Fatal(err)
	}
	var cs []oracleCase
	if err := json.NewDecoder(z).Decode(&cs); err != nil {
		t.Fatal(err)
	}
	return cs
}

func TestAgainstRealNuGet(t *testing.T) {
	path := "testdata/oracle.json.gz"
	if p := os.Getenv("NUGET_ORACLE"); p != "" {
		path = p
	}
	cs := loadOracle(t, path)
	checks, bad := 0, 0
	fail := func(c oracleCase, what string, got, want any) {
		bad++
		if bad <= 20 {
			t.Errorf("range %q versions %q: %s = %v, want %v", c.R, c.V, what, got, want)
		}
	}
	for _, c := range cs {
		vs := make([]Version, len(c.V))
		okv := make([]bool, len(c.V))
		for j, s := range c.V {
			checks++
			v, err := ParseVersion(s)
			want := c.O.V[j]
			if (err == nil) != (want != nil) {
				fail(c, "ParseVersion("+s+") ok", err == nil, want != nil)
				continue
			}
			if want != nil {
				vs[j], okv[j] = v, true
				if v.String() != want.N || v.FullString() != want.F {
					fail(c, "String", v.String()+" "+v.FullString(), want.N+" "+want.F)
				}
			}
		}
		checks++
		r, err := parseRange(c.R, true)
		if c.O.Err != nil {
			if err != errNoPrefix {
				fail(c, "error", err, *c.O.Err)
			}
			continue
		}
		if c.O.R == nil {
			if err == nil {
				fail(c, "parse", r.String(), "invalid")
			}
			continue
		}
		if err != nil {
			fail(c, "parse", err, c.O.R.N)
			continue
		}
		o := c.O.R
		got := []string{r.String(), r.ShortString(), r.PrettyPrint(false), r.PrettyPrint(true)}
		want := []string{o.N, o.A, o.P, o.F}
		for k := range got {
			checks++
			if got[k] != want[k] {
				fail(c, "format", got[k], want[k])
			}
		}
		checks++
		if r.IsFloating() != o.Fl {
			fail(c, "IsFloating", r.IsFloating(), o.Fl)
		}
		var valid []Version
		var idx []int
		for j := range vs {
			if !okv[j] {
				continue
			}
			checks += 2
			if r.Satisfies(vs[j]) != *o.Sat[j] {
				fail(c, "Satisfies("+c.V[j]+")", r.Satisfies(vs[j]), *o.Sat[j])
			}
			if r.IsCandidate(vs[j]) != *o.Cand[j] {
				fail(c, "IsCandidate("+c.V[j]+")", r.IsCandidate(vs[j]), *o.Cand[j])
			}
			valid = append(valid, vs[j])
			idx = append(idx, j)
		}
		checks++
		b := r.BestMatchIndex(valid)
		if b >= 0 {
			b = idx[b]
		}
		if b != o.Best {
			fail(c, "BestMatchIndex", b, o.Best)
		}
	}
	t.Logf("%d cases, %d checks, %d mismatches against NuGet.Versioning 8.0.0", len(cs), checks, bad)
}

// TestRealRestore replays real `dotnet restore` runs (SDK 8.0.134) on a
// local feed: which version did restore actually install?
func TestRealRestore(t *testing.T) {
	f, err := os.Open("testdata/real_restore.txt")
	if err != nil {
		t.Fatal(err)
	}
	defer f.Close()
	re := regexp.MustCompile(`^(\S+) \| Version="(.*)" \| published: (.*) \| restored: (\S+) \|`)
	sc := bufio.NewScanner(f)
	n := 0
	for sc.Scan() {
		m := re.FindStringSubmatch(sc.Text())
		if m == nil {
			t.Fatalf("bad line %q", sc.Text())
		}
		n++
		var vs []Version
		for _, s := range strings.Fields(m[3]) {
			vs = append(vs, MustParseVersion(s))
		}
		got := "FAIL"
		if r, err := ParseRange(m[2]); err == nil {
			if v, ok := r.FindBestMatch(vs); ok {
				got = v.String()
			}
		}
		if got != m[4] {
			t.Errorf("%s: Version=%q published %s: got %s, dotnet restore installed %s", m[1], m[2], m[3], got, m[4])
		}
	}
	t.Logf("%d real dotnet restore runs replayed", n)
}
