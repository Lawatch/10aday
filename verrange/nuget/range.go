package nuget

import (
	"errors"
	"strconv"
	"strings"
)

// ErrInvalidRange is returned when a string is not a valid NuGet version range.
var ErrInvalidRange = errors.New("nuget: invalid version range")

// errNoPrefix matches the ArgumentException NuGet throws for a few
// malformed floating versions such as "1.0.0-*-*".
var errNoPrefix = errors.New("nuget: invalid version range (floating pre-release without prefix)")

// FloatBehavior says which part of a floating version may move.
type FloatBehavior int

// Floating behaviors, named as in NuGet.Versioning.
const (
	FloatNone               FloatBehavior = iota // "1.0.0"
	FloatPrerelease                              // "1.0.0-beta*"
	FloatRevision                                // "1.0.0.*"
	FloatPatch                                   // "1.0.*"
	FloatMinor                                   // "1.*"
	FloatMajor                                   // "*"
	FloatAbsoluteLatest                          // "*-*"
	FloatPrereleaseRevision                      // "1.0.0.*-*"
	FloatPrereleasePatch                         // "1.0.*-*"
	FloatPrereleaseMinor                         // "1.*-*"
	FloatPrereleaseMajor                         // "*-beta*"
)

func (b FloatBehavior) includesPrerelease() bool {
	switch b {
	case FloatAbsoluteLatest, FloatPrerelease, FloatPrereleaseMajor, FloatPrereleaseMinor, FloatPrereleasePatch, FloatPrereleaseRevision:
		return true
	}
	return false
}

// FloatRange is the floating part of a range like "1.*" or "1.0.0-beta*".
type FloatRange struct {
	Behavior FloatBehavior
	// Min is the lowest version the float can resolve to, e.g. 1.0.0 for "1.*".
	Min Version
	// Prefix is the pre-release prefix, e.g. "beta" for "1.0.0-beta*".
	Prefix string
}

func makeFloat(b FloatBehavior, min Version, prefix *string) (*FloatRange, error) {
	if prefix == nil && min.IsPrerelease() {
		p := min.release()
		prefix = &p
	}
	if b == FloatAbsoluteLatest && prefix == nil {
		p := ""
		prefix = &p
	}
	if b.includesPrerelease() && prefix == nil {
		return nil, errNoPrefix
	}
	f := &FloatRange{Behavior: b, Min: min}
	if prefix != nil {
		f.Prefix = *prefix
	}
	return f, nil
}

func countParts(s string) int { return strings.Count(s, ".") + 1 }

func parseFloat(vs string) (*FloatRange, error) {
	if isBlank(vs) {
		return nil, ErrInvalidRange
	}
	first, last := strings.IndexByte(vs, '*'), strings.LastIndexByte(vs, '*')
	if vs == "*" {
		return makeFloat(FloatMajor, Version{}, nil)
	}
	if vs == "*-*" {
		empty := ""
		return makeFloat(FloatAbsoluteLatest, MustParseVersion("0.0.0-0"), &empty)
	}
	hasPlus := strings.IndexByte(vs, '+') != -1
	if first != last && last != -1 && !hasPlus {
		behavior := FloatNone
		dash := strings.IndexByte(vs, '-')
		var actual *string
		var prefix *string
		if dash != -1 && last == len(vs)-1 && first == dash-1 {
			stable := vs[:dash-1] + "0"
			switch countParts(stable) {
			case 1:
				behavior = FloatPrereleaseMajor
			case 2:
				behavior = FloatPrereleaseMinor
			case 3:
				behavior = FloatPrereleasePatch
			case 4:
				behavior = FloatPrereleaseRevision
			}
			rel := vs[dash+1:]
			p := rel[:len(rel)-1]
			prefix = &p
			relPart := p
			if p == "" || strings.HasSuffix(p, ".") {
				relPart += "0"
			}
			a := stable + "-" + relPart
			actual = &a
		}
		if actual == nil {
			return nil, ErrInvalidRange
		}
		v, err := ParseVersion(*actual)
		if err != nil {
			return nil, ErrInvalidRange
		}
		return makeFloat(behavior, v, prefix)
	} else if last == len(vs)-1 && !hasPlus {
		behavior := FloatNone
		act := vs[:len(vs)-1]
		var prefix *string
		if strings.IndexByte(vs, '-') == -1 {
			act += "0"
			switch countParts(act) {
			case 2:
				behavior = FloatMinor
			case 3:
				behavior = FloatPatch
			case 4:
				behavior = FloatRevision
			}
		} else {
			behavior = FloatPrerelease
			if strings.IndexByte(vs, '-') == strings.LastIndexByte(vs, '-') {
				p := act[strings.LastIndexByte(vs, '-')+1:]
				prefix = &p
				if p == "" || strings.HasSuffix(act, ".") {
					act += "0"
				} else if strings.HasSuffix(act, "-") {
					act += "-"
				}
			}
		}
		v, err := ParseVersion(act)
		if err != nil {
			return nil, ErrInvalidRange
		}
		return makeFloat(behavior, v, prefix)
	}
	v, err := ParseVersion(vs)
	if err != nil {
		return nil, ErrInvalidRange
	}
	return makeFloat(FloatNone, v, nil)
}

func hasPrefixFold(s, p string) bool {
	return len(s) >= len(p) && strings.EqualFold(s[:len(p)], p)
}

// Satisfies reports whether v matches the floating pattern itself
// (e.g. 1.4.0 matches "1.*", 2.0.0 does not).
func (f *FloatRange) Satisfies(v Version) bool {
	b, m, pre := f.Behavior, f.Min, v.IsPrerelease()
	if b == FloatAbsoluteLatest {
		return true
	}
	if b == FloatMajor && !pre {
		return true
	}
	relOK := !pre || hasPrefixFold(strings.ToUpper(v.release()), strings.ToUpper(f.Prefix))
	switch b {
	case FloatPrereleaseRevision:
		return m.Major == v.Major && m.Minor == v.Minor && m.Patch == v.Patch && relOK
	case FloatPrereleasePatch:
		return m.Major == v.Major && m.Minor == v.Minor && relOK
	case FloatPrereleaseMinor:
		return m.Major == v.Major && relOK
	case FloatPrereleaseMajor:
		return relOK
	case FloatPrerelease:
		return m.Major == v.Major && m.Minor == v.Minor && m.Patch == v.Patch && m.Revision == v.Revision && relOK
	case FloatRevision:
		return m.Major == v.Major && m.Minor == v.Minor && m.Patch == v.Patch && !pre
	case FloatPatch:
		return m.Major == v.Major && m.Minor == v.Minor && !pre
	case FloatMinor:
		return m.Major == v.Major && !pre
	}
	return false
}

// String returns the float as NuGet writes it, e.g. "1.*" or "1.0.0-beta*".
func (f *FloatRange) String() string {
	m := f.Min
	mm := strconv.Itoa(m.Major)
	mmn := mm + "." + strconv.Itoa(m.Minor)
	mmp := mmn + "." + strconv.Itoa(m.Patch)
	switch f.Behavior {
	case FloatNone:
		return m.String()
	case FloatPrerelease:
		s := mmp
		if m.Revision > 0 {
			s += "." + strconv.Itoa(m.Revision)
		}
		return s + "-" + f.Prefix + "*"
	case FloatRevision:
		return mmp + ".*"
	case FloatPatch:
		return mmn + ".*"
	case FloatMinor:
		return mm + ".*"
	case FloatMajor:
		return "*"
	case FloatPrereleaseRevision:
		return mmp + ".*-" + f.Prefix + "*"
	case FloatPrereleasePatch:
		return mmn + ".*-" + f.Prefix + "*"
	case FloatPrereleaseMinor:
		return mm + ".*-" + f.Prefix + "*"
	case FloatPrereleaseMajor:
		return "*-" + f.Prefix + "*"
	case FloatAbsoluteLatest:
		return "*-*"
	}
	return ""
}

// Range is a NuGet version range. A nil Min or Max means no bound on
// that side.
type Range struct {
	Min          *Version
	MinInclusive bool
	Max          *Version
	MaxInclusive bool
	// Float is set when the lower bound is a floating version ("1.*").
	Float *FloatRange
}

// ParseRange parses a NuGet version range, the way a PackageReference
// Version attribute is read:
//
//	"1.0"         means 1.0 or higher (the lowest match is preferred)
//	"[1.0]"       exactly 1.0
//	"[1.0,2.0)"   1.0 <= v < 2.0
//	"(,2.0]"      v <= 2.0
//	"1.*"         any 1.x, highest preferred
//	"*-*"         anything, including pre-releases, highest preferred
//
// npm-style syntax such as "^1.0", "~1.0" or ">=1.0" is rejected, as NuGet does.
func ParseRange(s string) (*Range, error) {
	r, err := parseRange(s, true)
	if err != nil {
		return nil, ErrInvalidRange
	}
	return r, nil
}

// MustParseRange is like ParseRange but panics on error.
func MustParseRange(s string) *Range {
	r, err := ParseRange(s)
	if err != nil {
		panic(err.Error() + ": " + strconv.Quote(s))
	}
	return r
}

func parseRange(value string, allowFloating bool) (*Range, error) {
	t := trim(value)
	if t == "" {
		return nil, ErrInvalidRange
	}
	if allowFloating && t == "*" {
		f, err := parseFloat(t)
		if err != nil {
			return nil, err
		}
		return mkRange(&Version{}, true, nil, true, f), nil
	}
	var minS, maxS string
	hasMax := false
	var minInc, maxInc bool
	if t[0] == '(' || t[0] == '[' {
		minInc = t[0] == '['
		switch t[len(t)-1] {
		case ']':
			maxInc = true
		case ')':
			maxInc = false
		default:
			return nil, ErrInvalidRange
		}
		if len(t) < 2 {
			return nil, ErrInvalidRange
		}
		inner := t[1 : len(t)-1]
		parts := strings.Split(inner, ",")
		if len(parts) > 2 {
			return nil, ErrInvalidRange
		}
		allEmpty := true
		for _, p := range parts {
			if p != "" {
				allEmpty = false
			}
		}
		if allEmpty {
			return nil, ErrInvalidRange
		}
		if len(parts) == 1 && !(minInc && maxInc) {
			return nil, ErrInvalidRange
		}
		minS = parts[0]
		if len(parts) == 2 {
			maxS = parts[1]
		} else {
			maxS = parts[0]
		}
		hasMax = true
	} else {
		minInc = true
		minS = t
	}
	var minV, maxV *Version
	var fl *FloatRange
	if !isBlank(minS) {
		if allowFloating && strings.IndexByte(minS, '*') != -1 {
			f, err := parseFloat(minS)
			if err != nil {
				return nil, err
			}
			fl = f
			m := f.Min
			minV = &m
		} else {
			v, err := ParseVersion(minS)
			if err != nil {
				return nil, ErrInvalidRange
			}
			minV = &v
		}
	}
	if hasMax && !isBlank(maxS) {
		v, err := ParseVersion(maxS)
		if err != nil {
			return nil, ErrInvalidRange
		}
		maxV = &v
	}
	if minV != nil && maxV != nil {
		c := Compare(*minV, *maxV)
		if c > 0 || (c == 0 && minInc != maxInc) {
			return nil, ErrInvalidRange
		}
	}
	return mkRange(minV, minInc, maxV, maxInc, fl), nil
}

func mkRange(minV *Version, minInc bool, maxV *Version, maxInc bool, fl *FloatRange) *Range {
	// A missing bound is never inclusive.
	return &Range{Min: minV, MinInclusive: minV != nil && minInc, Max: maxV, MaxInclusive: maxV != nil && maxInc, Float: fl}
}

// IsFloating reports whether the range has a floating lower bound ("1.*").
func (r *Range) IsFloating() bool { return r.Float != nil && r.Float.Behavior != FloatNone }

// Satisfies reports whether v lies inside the range bounds. Like NuGet's
// VersionRange.Satisfies, it does not apply the pre-release rule; use
// IsCandidate to know whether restore would consider v at all.
func (r *Range) Satisfies(v Version) bool {
	if r.Min != nil {
		c := Compare(*r.Min, v)
		if (r.MinInclusive && c > 0) || (!r.MinInclusive && c >= 0) {
			return false
		}
	}
	if r.Max != nil {
		c := Compare(*r.Max, v)
		if (r.MaxInclusive && c < 0) || (!r.MaxInclusive && c <= 0) {
			return false
		}
	}
	return true
}

func (r *Range) hasPrereleaseBounds() bool {
	return (r.Min != nil && r.Min.IsPrerelease()) || (r.Max != nil && r.Max.IsPrerelease())
}

// IsCandidate reports whether restore may pick v for this range: v must
// satisfy the range, and a pre-release is only allowed when a bound is a
// pre-release or the float includes pre-releases ("1.*-*").
func (r *Range) IsCandidate(v Version) bool {
	if v.IsPrerelease() && !r.hasPrereleaseBounds() && !(r.Float != nil && r.Float.Behavior.includesPrerelease()) {
		return false
	}
	return r.Satisfies(v)
}

// IsBetter reports whether candidate should replace current as the best
// match (NuGet's VersionRange.IsBetter). current may be nil.
func (r *Range) IsBetter(current *Version, candidate Version) bool {
	if !r.IsCandidate(candidate) {
		return false
	}
	if current == nil {
		return true
	}
	cur := *current
	if r.IsFloating() {
		ci, ni := r.Float.Satisfies(cur), r.Float.Satisfies(candidate)
		switch {
		case ci && !ni:
			return false
		case ni && !ci:
			return true
		case ci && ni:
			return Compare(cur, candidate) < 0
		}
		cl, nl := Compare(cur, r.Float.Min) < 0, Compare(candidate, r.Float.Min) < 0
		switch {
		case cl && !nl:
			return true
		case !cl && nl:
			return false
		case !cl && !nl:
			return Compare(cur, candidate) > 0
		}
		return Compare(cur, candidate) < 0
	}
	return Compare(cur, candidate) > 0
}

// BestMatchIndex returns the index in versions of the version NuGet
// restore would choose for this range, or -1 if none fits. Without a
// float, the lowest fitting version wins; with "1.*", the highest
// version matching the float wins.
func (r *Range) BestMatchIndex(versions []Version) int {
	best := -1
	for i := range versions {
		var cur *Version
		if best >= 0 {
			cur = &versions[best]
		}
		if r.IsBetter(cur, versions[i]) {
			best = i
		}
	}
	return best
}

// FindBestMatch returns the version NuGet restore would choose among
// versions, and false if none fits.
func (r *Range) FindBestMatch(versions []Version) (Version, bool) {
	i := r.BestMatchIndex(versions)
	if i < 0 {
		return Version{}, false
	}
	return versions[i], true
}

// String returns the normalized form, e.g. "[1.0.0, 2.0.0)".
func (r *Range) String() string {
	var b strings.Builder
	if r.Min != nil && r.MinInclusive {
		b.WriteByte('[')
	} else {
		b.WriteByte('(')
	}
	if r.Min != nil {
		if r.IsFloating() {
			b.WriteString(r.Float.String())
		} else {
			b.WriteString(r.Min.String())
		}
	}
	b.WriteString(", ")
	if r.Max != nil {
		b.WriteString(r.Max.String())
	}
	if r.Max != nil && r.MaxInclusive {
		b.WriteByte(']')
	} else {
		b.WriteByte(')')
	}
	return b.String()
}

// ShortString returns the shortest NuGet form: "1.0.0", "1.*", "[1.0.0]",
// or the normalized interval otherwise.
func (r *Range) ShortString() string {
	if r.Min != nil && r.MinInclusive && r.Max == nil {
		if r.IsFloating() {
			return r.Float.String()
		}
		return r.Min.String()
	}
	if r.Min != nil && r.Max != nil && r.MinInclusive && r.MaxInclusive && Compare(*r.Min, *r.Max) == 0 {
		return "[" + r.Min.String() + "]"
	}
	return r.String()
}

// PrettyPrint returns the human form NuGet shows in messages, e.g.
// "(>= 1.0.0 && < 2.0.0)". With showFloating, a float is shown as
// written ("1.*") instead of its lowest version.
func (r *Range) PrettyPrint(showFloating bool) string {
	if r.Min == nil && r.Max == nil {
		return ""
	}
	var b strings.Builder
	b.WriteByte('(')
	if r.Min != nil && r.Max != nil && Compare(*r.Max, *r.Min) == 0 && r.MinInclusive && r.MaxInclusive {
		b.WriteString("= " + r.Min.String())
	} else {
		if r.Min != nil {
			b.WriteString(">")
			if r.MinInclusive {
				b.WriteString("= ")
			} else {
				b.WriteString(" ")
			}
			if r.IsFloating() && showFloating {
				b.WriteString(r.Float.String())
			} else {
				b.WriteString(r.Min.String())
			}
		}
		if r.Min != nil && r.Max != nil {
			b.WriteString(" && ")
		}
		if r.Max != nil {
			b.WriteString("<")
			if r.MaxInclusive {
				b.WriteString("= ")
			} else {
				b.WriteString(" ")
			}
			b.WriteString(r.Max.String())
		}
	}
	b.WriteByte(')')
	return b.String()
}
