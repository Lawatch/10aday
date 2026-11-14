package main

import (
	"bytes"
	"strings"
	"testing"
)

func TestRun(t *testing.T) {
	tests := []struct {
		args  []string
		stdin string
		out   string // expected stdout, or a substring of stderr when code == 2
		code  int
	}{
		{[]string{"nuget", "[1.0,2.0)", "1.5.0"}, "", "yes  1.5.0\n", 0},
		{[]string{"nuget", "[1.0,2.0)", "2.0.0"}, "", "no   2.0.0\n", 1},
		// restore takes the lowest match; a pre-release is not a candidate.
		{[]string{"nuget", "[1.0,2.0)", "1.0.0", "1.9.9", "1.5.0-beta"}, "", "yes  1.0.0\nyes  1.9.9\nno   1.5.0-beta\npick: 1.0.0\n", 0},
		// a float takes the highest version that fits the pattern.
		{[]string{"nuget", "1.*", "1.0.0", "1.9.9", "2.0.0"}, "", "yes  1.0.0\nyes  1.9.9\nno   2.0.0\npick: 1.9.9\n", 0},
		{[]string{"nuget", "1.2.*", "1.1.0", "1.3.0", "1.4.0"}, "", "no   1.1.0\nno   1.3.0\nno   1.4.0\npick: 1.3.0 (fallback: no version fits the pattern)\n", 0},
		{[]string{"nuget", "^1.0", "1.0"}, "", "invalid range", 2},
		{[]string{"nuget", "[1.0,2.0)", "1.x"}, "", "not a NuGet version", 2},
		// Maven ranges take the highest match, pre-releases included.
		{[]string{"maven", "[1.0,2.0)", "1.0", "1.5", "2.0-rc1", "2.0"}, "", "yes  1.0\nyes  1.5\nyes  2.0-rc1\nno   2.0\npick: 2.0-rc1\n", 0},
		{[]string{"mvn", "[3.0]", "3.0.RELEASE", "3.1"}, "", "yes  3.0.RELEASE\nno   3.1\npick: none (the tool asks for exactly \"3.0\", not in the list)\n", 1},
		{[]string{"maven", "[1.0,2.0", "1.0"}, "", "invalid range", 2},
		{[]string{"gradle", "1.+", "1.0", "1.9", "2.0"}, "", "yes  1.0\nyes  1.9\nno   2.0\npick: 1.9\n", 0},
		{[]string{"gradle", "latest.release"}, "# published\n1.0\n\n2.0-SNAPSHOT\n1.5\n", "yes  1.0\nno   2.0-SNAPSHOT\nyes  1.5\npick: 1.5\n", 0},
		{[]string{"gradle", "[1.0,2.0)", "2.0", "2.1"}, "", "no   2.0\nno   2.1\npick: none\n", 1},
		{[]string{"cargo", "1.0", "1.0"}, "", "unknown ecosystem", 2},
		{[]string{"nuget"}, "", "usage:", 2},
		{[]string{"nuget", "1.0"}, "", "no version given", 2},
		{[]string{"--help"}, "", "usage:", 0},
	}
	for _, tt := range tests {
		var out, errb bytes.Buffer
		code := run(tt.args, strings.NewReader(tt.stdin), &out, &errb)
		if code != tt.code {
			t.Errorf("%q: exit %d, want %d (stderr %q)", tt.args, code, tt.code, errb.String())
		}
		got := out.String()
		if tt.code == 2 {
			got = errb.String()
		}
		if tt.code == 0 && tt.args[0] == "--help" {
			got = out.String()
		}
		if tt.code == 2 || tt.args[0] == "--help" {
			if !strings.Contains(got, tt.out) {
				t.Errorf("%q: output %q does not contain %q", tt.args, got, tt.out)
			}
		} else if got != tt.out {
			t.Errorf("%q:\n got %q\nwant %q", tt.args, got, tt.out)
		}
	}
}
