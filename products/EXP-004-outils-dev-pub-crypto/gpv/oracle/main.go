// Oracle for gpv.js: reads JSON requests on stdin (one per line), answers with golang.org/x/mod.
package main

import (
	"bufio"
	"encoding/json"
	"os"
	"time"

	"golang.org/x/mod/module"
	"golang.org/x/mod/semver"
)

type req struct {
	Op    string `json:"op"`
	V     string `json:"v"`
	W     string `json:"w"`
	Major string `json:"major"`
	Older string `json:"older"`
	TS    string `json:"ts"`
	Rev   string `json:"rev"`
}

func errs(err error) string {
	if err == nil {
		return ""
	}
	return "ERR"
}

func main() {
	in := bufio.NewScanner(os.Stdin)
	in.Buffer(make([]byte, 1<<20), 1<<20)
	out := bufio.NewWriter(os.Stdout)
	defer out.Flush()
	enc := json.NewEncoder(out)
	for in.Scan() {
		var r req
		json.Unmarshal(in.Bytes(), &r)
		res := map[string]any{}
		switch r.Op {
		case "one":
			v := r.V
			res["valid"] = semver.IsValid(v)
			res["canonical"] = semver.Canonical(v)
			res["major"] = semver.Major(v)
			res["pre"] = semver.Prerelease(v)
			res["build"] = semver.Build(v)
			res["pseudo"] = module.IsPseudoVersion(v)
			t, err := module.PseudoVersionTime(v)
			if err == nil {
				res["time"] = t.UTC().Format("2006-01-02T15:04:05Z")
			} else {
				res["time"] = errs(err)
			}
			rev, err := module.PseudoVersionRev(v)
			if err == nil {
				res["rev"] = rev
			} else {
				res["rev"] = errs(err)
			}
			b, err := module.PseudoVersionBase(v)
			if err == nil {
				res["base"] = b
			} else {
				res["base"] = errs(err)
			}
		case "cmp":
			res["cmp"] = semver.Compare(r.V, r.W)
		case "make":
			t, err := time.Parse("20060102150405", r.TS)
			if err != nil {
				res["make"] = "ERR"
			} else {
				res["make"] = module.PseudoVersion(r.Major, r.Older, t, r.Rev)
			}
		}
		enc.Encode(res)
	}
}
