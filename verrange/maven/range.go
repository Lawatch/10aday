package maven

import (
	"errors"
	"strings"
)

// Bound is one end of a range.
type Bound struct {
	Version   Version
	Inclusive bool
}

// Range is one Maven range such as "[1.0,2.0)". A nil bound is unbounded.
type Range struct {
	Lower, Upper *Bound
}

// Contains reports whether v is inside the range.
func (r Range) Contains(v Version) bool {
	if r.Lower != nil {
		c := r.Lower.Version.Compare(v)
		if c > 0 || (c == 0 && !r.Lower.Inclusive) {
			return false
		}
	}
	if r.Upper != nil {
		c := r.Upper.Version.Compare(v)
		if c < 0 || (c == 0 && !r.Upper.Inclusive) {
			return false
		}
	}
	return true
}

// String prints the range in Maven notation.
func (r Range) String() string {
	var b strings.Builder
	if r.Lower != nil && r.Lower.Inclusive {
		b.WriteByte('[')
	} else {
		b.WriteByte('(')
	}
	if r.Lower != nil {
		b.WriteString(r.Lower.Version.String())
	}
	if r.Lower == nil || r.Upper == nil || r.Lower.Version.src != r.Upper.Version.src {
		b.WriteByte(',')
		if r.Upper != nil {
			b.WriteString(r.Upper.Version.String())
		}
	}
	if r.Upper != nil && r.Upper.Inclusive {
		b.WriteByte(']')
	} else {
		b.WriteByte(')')
	}
	return b.String()
}

// Constraint is the content of a <version> element: either a plain
// ("soft") version such as "1.5", or one or more ranges such as
// "(,1.0],[1.2,)".
type Constraint struct {
	src    string
	soft   *Version
	ranges []Range
}

// ErrInvalid is wrapped by every error ParseConstraint returns.
var ErrInvalid = errors.New("invalid Maven version constraint")

func invalid(c, why string) error {
	return &constraintError{c: c, why: why}
}

type constraintError struct{ c, why string }

func (e *constraintError) Error() string {
	return "maven: invalid version constraint " + quote(e.c) + ": " + e.why
}
func (e *constraintError) Unwrap() error { return ErrInvalid }

func quote(s string) string { return "\"" + s + "\"" }

func parseRange(s string) (Range, error) {
	var r Range
	var loInc, hiInc bool
	switch s[0] {
	case '[':
		loInc = true
	case '(':
	default:
		return r, errors.New("a range must start with [ or (")
	}
	switch s[len(s)-1] {
	case ']':
		hiInc = true
	case ')':
	default:
		return r, errors.New("a range must end with ] or )")
	}
	p := s[1 : len(s)-1]
	idx := strings.IndexByte(p, ',')
	if idx < 0 {
		if !loInc || !hiInc {
			return r, errors.New("a single version must be surrounded by [ ]")
		}
		ver := strings.TrimSpace(p)
		if strings.HasSuffix(ver, ".*") {
			prefix := ver[:len(ver)-1]
			r.Lower = &Bound{ParseVersion(prefix + "min"), true}
			r.Upper = &Bound{ParseVersion(prefix + "max"), true}
		} else {
			v := ParseVersion(ver)
			r.Lower = &Bound{v, true}
			r.Upper = &Bound{v, true}
		}
		return r, nil
	}
	l, h := strings.TrimSpace(p[:idx]), strings.TrimSpace(p[idx+1:])
	if strings.IndexByte(h, ',') >= 0 {
		return r, errors.New(`bounds may not contain an extra ","`)
	}
	if l != "" {
		r.Lower = &Bound{ParseVersion(l), loInc}
	}
	if h != "" {
		r.Upper = &Bound{ParseVersion(h), hiInc}
	}
	if r.Lower != nil && r.Upper != nil && r.Upper.Version.Compare(r.Lower.Version) < 0 {
		return r, errors.New("lower bound must not be greater than upper bound")
	}
	return r, nil
}

// ParseConstraint parses a dependency version as Maven Resolver does.
// "[1.0,2.0)", "(,1.0],[1.2,)", "[1.0]", "[1.*]" are ranges; anything that
// does not start with [ or ( is a plain version (Maven never rejects those).
// Errors wrap ErrInvalid; Maven fails the build on the same inputs.
//
// "LATEST" and "RELEASE" are parsed as plain versions, as Resolver does: the
// metaversions are handled by Maven before, and are not modelled here.
func ParseConstraint(c string) (Constraint, error) {
	process := c
	var ranges []Range
	for len(process) > 0 && (process[0] == '[' || process[0] == '(') {
		i1, i2 := strings.IndexByte(process, ')'), strings.IndexByte(process, ']')
		index := i2
		if i2 < 0 || (i1 >= 0 && i1 < i2) {
			index = i1
		}
		if index < 0 {
			return Constraint{}, invalid(c, "unbounded version range (missing ] or ))")
		}
		r, err := parseRange(process[:index+1])
		if err != nil {
			return Constraint{}, invalid(c, err.Error())
		}
		ranges = append(ranges, r)
		process = strings.TrimSpace(process[index+1:])
		if strings.HasPrefix(process, ",") {
			process = strings.TrimSpace(process[1:])
		}
	}
	if process != "" && len(ranges) > 0 {
		return Constraint{}, invalid(c, `expected [ or ( but got "`+process+`"`)
	}
	if len(ranges) == 0 {
		v := ParseVersion(c)
		return Constraint{src: c, soft: &v}, nil
	}
	return Constraint{src: c, ranges: ranges}, nil
}

// MustParseConstraint is ParseConstraint that panics on error.
func MustParseConstraint(c string) Constraint {
	r, err := ParseConstraint(c)
	if err != nil {
		panic(err)
	}
	return r
}

// String returns the constraint as it was given.
func (c Constraint) String() string { return c.src }

// IsRange reports whether the constraint is made of ranges (not a plain version).
func (c Constraint) IsRange() bool { return len(c.ranges) > 0 }

// Ranges returns the ranges, or nil for a plain version.
func (c Constraint) Ranges() []Range { return append([]Range(nil), c.ranges...) }

// Recommended returns the plain version and true, or false for ranges.
func (c Constraint) Recommended() (Version, bool) {
	if c.soft == nil {
		return Version{}, false
	}
	return *c.soft, true
}

// ContainsVersion reports whether v satisfies the constraint. A plain
// version only contains versions equal to it ("1.0" contains "1.0.0").
func (c Constraint) ContainsVersion(v Version) bool {
	if c.soft != nil {
		return c.soft.Compare(v) == 0
	}
	for _, r := range c.ranges {
		if r.Contains(v) {
			return true
		}
	}
	return false
}

// Contains is ContainsVersion for a version string.
func (c Constraint) Contains(v string) bool { return c.ContainsVersion(ParseVersion(v)) }

// exact returns the version Maven uses without reading metadata: a plain
// version, or ranges whose bounds are all the same inclusive version
// ("[1.0]", "[1.5,1.5]").
func (c Constraint) exact() (Version, bool) {
	if c.soft != nil {
		return *c.soft, true
	}
	first := c.ranges[0].Lower
	for _, r := range c.ranges {
		for _, b := range []*Bound{r.Lower, r.Upper} {
			if b == nil || first == nil || !b.Inclusive || !b.Version.Equal(first.Version) {
				return Version{}, false
			}
		}
	}
	return first.Version, true
}

// Select returns the version Maven picks among the published versions
// (the "<versions>" of maven-metadata.xml) when this is the only declaration
// of the dependency, and false when the build would fail.
//
// For ranges: the highest published version inside a range. Pre-releases
// and snapshots are candidates like any other version: "[1.0,2.0)" takes
// "2.0-rc1" or "2.0-SNAPSHOT" if published; write "[1.0,2.0-alpha)" or
// "[1.0,2-min)" to exclude them.
//
// For a plain version ("1.5") or a single-version range ("[1.5]",
// "[1.5,1.5]"), Maven does not read the published list: it asks for that
// exact string. Select returns it, with false if that exact string is not
// published ("[3.0]" fails when only "3.0.RELEASE" exists, though they are
// equal versions).
func (c Constraint) Select(published []string) (string, bool) {
	if v, ok := c.exact(); ok {
		for _, p := range published {
			if p == v.String() {
				return p, true
			}
		}
		return v.String(), false
	}
	best, found := Version{}, false
	for _, s := range published {
		v := ParseVersion(s)
		if c.ContainsVersion(v) && (!found || v.Compare(best) > 0) {
			best, found = v, true
		}
	}
	return best.String(), found
}
