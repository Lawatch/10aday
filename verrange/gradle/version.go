// Package gradle reads Gradle dependency versions and dynamic versions
// ("1.+", "latest.release", "[1.0,2.0)") the way Gradle does, and tells which
// published version Gradle would pick.
//
// It is a port of the Gradle 8.14.3 classes VersionParser,
// StaticVersionComparator, DefaultVersionSelectorScheme, VersionRangeSelector,
// SubVersionSelector, ExactVersionSelector and LatestVersionSelector
// (Apache License 2.0), checked against those classes and against real
// Gradle builds (see the tests).
//
// Gradle does not order versions like Maven. The main differences:
//
//   - "1.0" < "1.0.0" < "1.0.1" for Gradle; Maven says "1.0" == "1.0.0".
//   - A version with a word after it is lower than the version alone:
//     "1.0-rc1" < "1.0", and also "1.0-release" < "1.0" and "1.0-sp1" < "1.0".
//   - Between words, Gradle ranks: dev < any other word < rc < snapshot < final < ga < release < sp
//     (any case). So "1.0-SNAPSHOT" > "1.0-rc1" and "1.0-sp1" > "1.0-final".
//   - Other words compare as plain strings, case-sensitive: "1.0-M1" < "1.0-alpha".
//   - "1.+" is a prefix match on the text: it accepts "1.10" and "1.0-SNAPSHOT", not "10.0".
//   - An exclusive upper bound also excludes versions that start with it:
//     "[1.0,2.0)" rejects "2.0-rc1" even though "2.0-rc1" < "2.0".
package gradle

import (
	"strconv"
	"strings"
	"unicode/utf16"
)

// Version is a parsed Gradle version. The zero value is the empty version "".
type Version struct {
	source    string
	parts     []string
	nums      []int64
	isNum     []bool
	base      string
	qualified bool
}

func isSep(r rune) bool { return r == '.' || r == '_' || r == '-' || r == '+' }

// ParseVersion parses a version string. Every string is a valid Gradle
// version, so it never fails.
//
// The version is split into parts at '.', '-', '_', '+' and at every change
// between digits and non-digits: "1.0-rc1" has the parts 1, 0, rc, 1.
func ParseVersion(s string) Version {
	v := Version{source: s}
	digit := false
	start, endBase := 0, 0
	for i, r := range s {
		switch {
		case isSep(r):
			v.parts = append(v.parts, s[start:i])
			start = i + 1 // separators are one byte
			digit = false
			if r != '.' && endBase == 0 {
				endBase = i
			}
		case r >= '0' && r <= '9': // ASCII only, like Gradle
			if !digit && i > start {
				if endBase == 0 {
					endBase = i
				}
				v.parts = append(v.parts, s[start:i])
				start = i
			}
			digit = true
		default:
			if digit {
				if endBase == 0 {
					endBase = i
				}
				v.parts = append(v.parts, s[start:i])
				start = i
			}
			digit = false
		}
	}
	if len(s) > start {
		v.parts = append(v.parts, s[start:])
	}
	v.nums = make([]int64, len(v.parts))
	v.isNum = make([]bool, len(v.parts))
	for i, p := range v.parts {
		v.nums[i], v.isNum[i] = tryLong(p)
	}
	if endBase > 0 {
		v.base, v.qualified = s[:endBase], true
	} else {
		v.base = s
	}
	return v
}

// tryLong mirrors Guava's Longs.tryParse for a version part: ASCII digits
// only, must fit in an int64.
func tryLong(p string) (int64, bool) {
	if p == "" {
		return 0, false
	}
	for i := 0; i < len(p); i++ {
		if p[i] < '0' || p[i] > '9' {
			return 0, false
		}
	}
	n, err := strconv.ParseInt(p, 10, 64)
	return n, err == nil
}

// String returns the version exactly as written.
func (v Version) String() string { return v.source }

// Parts returns the parts Gradle compares, in order.
func (v Version) Parts() []string { return append([]string(nil), v.parts...) }

// IsQualified reports whether the version has a qualifier, i.e. something
// after the leading dot-separated numbers ("1.0-rc1", "1.0a", "1.0_1").
func (v Version) IsQualified() bool { return v.qualified }

// BaseVersion returns the version without its qualifier: "1.0-rc1" → "1.0".
func (v Version) BaseVersion() Version {
	if !v.qualified {
		return v
	}
	return ParseVersion(v.base)
}

var special = map[string]int{"dev": -1, "rc": 1, "snapshot": 2, "final": 3, "ga": 4, "release": 5, "sp": 6}

// specialRank returns the rank of dev, rc, snapshot, final, ga, release, sp
// (any case). A part with non-ASCII letters is never special: Java's
// toLowerCase can't turn it into one of these words.
func specialRank(p string) (int, bool) {
	if !isASCII(p) {
		return 0, false
	}
	r, ok := special[strings.ToLower(p)]
	return r, ok
}

// javaCompare compares two strings like Java's String.compareTo (UTF-16 code units).
func javaCompare(a, b string) int {
	if isASCII(a) && isASCII(b) {
		return strings.Compare(a, b)
	}
	x, y := utf16.Encode([]rune(a)), utf16.Encode([]rune(b))
	for i := 0; i < len(x) && i < len(y); i++ {
		if x[i] != y[i] {
			if x[i] < y[i] {
				return -1
			}
			return 1
		}
	}
	switch {
	case len(x) < len(y):
		return -1
	case len(x) > len(y):
		return 1
	}
	return 0
}

func isASCII(s string) bool {
	for i := 0; i < len(s); i++ {
		if s[i] >= 0x80 {
			return false
		}
	}
	return true
}

// Compare returns -1, 0 or 1 as a is lower than, equal to or higher than b in
// Gradle's order. Two versions are equal only when written the same way.
func (a Version) Compare(b Version) int {
	if a.source == b.source {
		return 0
	}
	i := 0
	for ; i < len(a.parts) && i < len(b.parts); i++ {
		p1, p2 := a.parts[i], b.parts[i]
		if p1 == p2 {
			continue
		}
		n1, n2 := a.isNum[i], b.isNum[i]
		switch {
		case n1 && !n2:
			return 1
		case n2 && !n1:
			return -1
		case n1 && n2:
			if a.nums[i] == b.nums[i] {
				continue
			}
			if a.nums[i] < b.nums[i] {
				return -1
			}
			return 1
		}
		s1, ok1 := specialRank(p1)
		s2, ok2 := specialRank(p2)
		if ok1 {
			return sign(s1 - s2) // s2 is 0 when p2 is not special
		}
		if ok2 {
			return sign(-s2)
		}
		return javaCompare(p1, p2)
	}
	if i < len(a.parts) {
		if a.isNum[i] {
			return 1
		}
		return -1
	}
	if i < len(b.parts) {
		if b.isNum[i] {
			return -1
		}
		return 1
	}
	return 0
}

func sign(n int) int {
	switch {
	case n < 0:
		return -1
	case n > 0:
		return 1
	}
	return 0
}

// Compare compares two version strings in Gradle's order. See Version.Compare.
func Compare(a, b string) int { return ParseVersion(a).Compare(ParseVersion(b)) }
