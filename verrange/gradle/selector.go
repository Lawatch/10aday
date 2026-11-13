package gradle

import (
	"regexp"
	"strings"
)

// Kind is the kind of a version selector.
type Kind int

const (
	// Exact is a static version: "1.0", or a single-version range "[1.0]".
	Exact Kind = iota
	// Prefix is a prefix version: "1.+", "1.0+", "+".
	Prefix
	// Range is a version range: "[1.0,2.0)", "]1.0,)", "(,2.0]".
	Range
	// Latest is a status selector: "latest.release", "latest.integration".
	Latest
)

func (k Kind) String() string {
	return [...]string{"exact", "prefix", "range", "latest"}[k]
}

// Selector is a parsed Gradle version declaration, static or dynamic.
type Selector struct {
	src  string
	kind Kind

	exact  string // Exact: the version
	prefix string // Prefix: text before '+'
	status string // Latest: text after "latest."

	lower, upper       *Version // Range: nil = unbounded
	lowerInc, upperInc bool
	upperSrc           string
}

// Regular expressions copied from Gradle's VersionRangeSelector. Java's \s
// also matches \x0B, RE2's does not: ws spells it out.
const (
	ws       = `[\t\n\x0B\f\r ]`
	anyChar  = `[^\t\n\x0B\f\r ,\[\]\]\(\]\[\[\)\(\)]`
	sep      = ws + `*\,` + ws + `*`
	open     = `[\[\]\(]`
	closeBr  = `[\]\[\)]`
	finite   = open + ws + `*(` + anyChar + `+)` + sep + `(` + anyChar + `+)` + ws + `*` + closeBr
	lowerInf = `\(` + sep + `(` + anyChar + `+)` + ws + `*` + closeBr
	upperInf = open + ws + `*(` + anyChar + `+)` + sep + `\)`
	single   = `\[` + ws + `*(` + anyChar + `+)\]`
)

func full(p string) *regexp.Regexp { return regexp.MustCompile(`^(?:` + p + `)$`) }

var (
	reFinite = full(finite)
	reLower  = full(lowerInf)
	reUpper  = full(upperInf)
	reSingle = full(single)
)

// ParseSelector parses a version declaration as written in a build file.
// Like Gradle, it accepts any string: what is not a range, a prefix ("+" at
// the end) or "latest.<status>" is an exact version.
func ParseSelector(s string) Selector {
	sel := Selector{src: s}
	first, last := byte(0), byte(0)
	if s != "" {
		first, last = s[0], s[len(s)-1]
	}
	var lo, up string
	hasLo, hasUp := false, false
	switch {
	case reFinite.MatchString(s):
		m := reFinite.FindStringSubmatch(s)
		lo, up, hasLo, hasUp = m[1], m[2], true, true
		sel.lowerInc, sel.upperInc = first == '[', last == ']'
	case reLower.MatchString(s):
		m := reLower.FindStringSubmatch(s)
		up, hasUp = m[1], true
		sel.lowerInc, sel.upperInc = true, last == ']'
	case reUpper.MatchString(s):
		m := reUpper.FindStringSubmatch(s)
		lo, hasLo = m[1], true
		sel.lowerInc, sel.upperInc = first == '[', true
	case reSingle.MatchString(s):
		m := reSingle.FindStringSubmatch(s)
		lo, up, hasLo, hasUp = m[1], m[1], true, true
		sel.lowerInc, sel.upperInc = true, true
	case strings.HasSuffix(s, "+"):
		sel.kind, sel.prefix = Prefix, s[:len(s)-1]
		return sel
	case strings.HasPrefix(s, "latest."):
		sel.kind, sel.status = Latest, s[len("latest."):]
		return sel
	default:
		sel.kind, sel.exact = Exact, s
		return sel
	}
	if hasLo && hasUp && lo == up && sel.lowerInc && sel.upperInc {
		sel.kind, sel.exact = Exact, up
		return sel
	}
	sel.kind = Range
	if hasLo {
		v := ParseVersion(lo)
		sel.lower = &v
	}
	if hasUp {
		v := ParseVersion(up)
		sel.upper, sel.upperSrc = &v, up
	}
	return sel
}

// String returns the selector as written.
func (s Selector) String() string { return s.src }

// Kind returns the kind of selector.
func (s Selector) Kind() Kind { return s.kind }

// IsDynamic reports whether the selector can match more than one version
// (Gradle then has to list the published versions).
func (s Selector) IsDynamic() bool { return s.kind != Exact }

// Bounds returns the bounds of a Range selector. A nil bound is unbounded.
// For other kinds it returns nil, nil.
func (s Selector) Bounds() (lower *Version, lowerInclusive bool, upper *Version, upperInclusive bool) {
	if s.kind != Range {
		return nil, false, nil, false
	}
	return s.lower, s.lowerInc, s.upper, s.upperInc
}

// Accept reports whether Gradle accepts version for this selector, looking
// only at the version string.
//
// A Latest selector needs the status of the version (see AcceptStatus):
// Accept returns true for it, as Gradle does.
func (s Selector) Accept(version string) bool {
	switch s.kind {
	case Exact:
		return s.exact == "" || s.exact == version
	case Prefix:
		return strings.HasPrefix(version, s.prefix)
	case Latest:
		return true
	}
	v := ParseVersion(version)
	if s.lower != nil {
		c := v.Compare(*s.lower)
		if c < 0 || (c == 0 && !s.lowerInc) {
			return false
		}
	}
	if s.upper == nil {
		return true
	}
	c := v.Compare(*s.upper)
	if s.upperInc {
		return c <= 0
	}
	// Gradle also excludes "2.0-rc1" from "[1.0,2.0)": it starts with "2.0".
	return c < 0 && !strings.HasPrefix(version, s.upperSrc)
}

// Status of a version in a Maven repository, in Gradle's default status
// scheme (integration < milestone < release).
const (
	StatusIntegration = "integration"
	StatusMilestone   = "milestone"
	StatusRelease     = "release"
)

var scheme = []string{StatusIntegration, StatusMilestone, StatusRelease}

func statusIndex(st string) int {
	for i, x := range scheme {
		if x == st {
			return i
		}
	}
	return -1
}

// MavenStatus returns the status Gradle gives a version found in a Maven
// repository: "integration" for "-SNAPSHOT" versions, "release" otherwise.
// Maven repositories have no "milestone" versions.
func MavenStatus(version string) string {
	if strings.HasSuffix(version, "-SNAPSHOT") {
		return StatusIntegration
	}
	return StatusRelease
}

// AcceptStatus reports whether a Latest selector accepts a version with the
// given status: "latest.integration" accepts every status, "latest.release"
// only "release". Unknown statuses are rejected. For other kinds it returns
// false.
func (s Selector) AcceptStatus(status string) bool {
	if s.kind != Latest {
		return false
	}
	si, ci := statusIndex(s.status), statusIndex(status)
	return si >= 0 && si <= ci
}

// Select returns the version Gradle picks for this declaration among the
// versions published in a Maven repository, and false if it finds none.
//
// Gradle takes the highest accepted version. For a static version it takes
// the version as written, if it is published. Latest selectors use
// MavenStatus. Conflict resolution between several declarations of the same
// module is not modelled: this is the choice for one declaration.
func (s Selector) Select(published []string) (string, bool) {
	if s.kind == Exact {
		for _, v := range published {
			if v == s.exact {
				return v, true
			}
		}
		return "", false
	}
	var best *Version
	for _, p := range published {
		ok := false
		if s.kind == Latest {
			ok = s.AcceptStatus(MavenStatus(p))
		} else {
			ok = s.Accept(p)
		}
		if !ok {
			continue
		}
		v := ParseVersion(p)
		if best == nil || v.Compare(*best) > 0 {
			best = &v
		}
	}
	if best == nil {
		return "", false
	}
	return best.source, true
}
