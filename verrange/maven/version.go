// Package maven orders Maven versions and reads Maven version ranges the way
// Maven 3.9 resolves dependencies: it is a port of Maven Resolver 1.9.24
// (org.eclipse.aether.util.version.GenericVersionScheme), the code that
// "mvn" uses to pick a version for "[1.0,2.0)".
//
// Note: Maven Resolver's order is not the order of maven-artifact's
// ComparableVersion, which most other Go ports implement. They differ on
// cases such as "1.0-foo" vs "1.0" or "1.0.max". For range resolution,
// Maven uses the Resolver order implemented here.
package maven

import (
	"sort"
	"strconv"
	"strings"
	"unicode"
	"unicode/utf8"
)

type kind int

// Item kinds, in Maven Resolver order.
const (
	kMin    kind = 0
	kQual   kind = 2
	kString kind = 3
	kInt    kind = 4
	kBigInt kind = 5
	kMax    kind = 8
)

var qualifiers = map[string]int{
	"alpha": -5, "beta": -4, "milestone": -3, "cr": -2, "rc": -2, "snapshot": -1,
	"ga": 0, "final": 0, "release": 0, "": 0, "sp": 1,
}

type item struct {
	kind kind
	n    int    // kInt, kQual
	s    string // kString (lower case), kBigInt (digits, no leading zero)
}

func (it item) isNumber() bool { return it.kind&kQual == 0 }

// compareNull compares an item with "nothing" (padding).
func (it item) compareNull() int {
	switch it.kind {
	case kMin:
		return -1
	case kMax, kBigInt, kString:
		return 1
	default:
		return it.n
	}
}

func (it item) compare(o item) int {
	if rel := int(it.kind) - int(o.kind); rel != 0 {
		return rel
	}
	switch it.kind {
	case kBigInt:
		if len(it.s) != len(o.s) {
			return len(it.s) - len(o.s)
		}
		return strings.Compare(it.s, o.s)
	case kInt, kQual:
		return it.n - o.n
	case kString:
		return compareIgnoreCase(it.s, o.s)
	}
	return 0
}

// compareIgnoreCase follows Java's String.compareToIgnoreCase.
func compareIgnoreCase(a, b string) int {
	ra, rb := []rune(a), []rune(b)
	n := len(ra)
	if len(rb) < n {
		n = len(rb)
	}
	for i := 0; i < n; i++ {
		x, y := ra[i], rb[i]
		if x == y {
			continue
		}
		x, y = toUpper(x), toUpper(y)
		if x == y {
			continue
		}
		x, y = toLower(x), toLower(y)
		if x != y {
			return int(x) - int(y)
		}
	}
	return len(ra) - len(rb)
}

func toUpper(r rune) rune { return unicode.ToUpper(r) }
func toLower(r rune) rune { return unicode.ToLower(r) }

// javaLower follows Java's String.toLowerCase(Locale.ENGLISH), which turns
// "İ" (U+0130) into two characters, "i" + U+0307. Go maps it to "i".
func javaLower(s string) string {
	return strings.ToLower(strings.ReplaceAll(s, "\u0130", "i\u0307"))
}

// Version is a parsed Maven version. Every string is a valid version: Maven
// never rejects one. The zero Version equals "0".
type Version struct {
	src   string
	items []item
}

// ParseVersion parses a version as Maven Resolver does.
func ParseVersion(s string) Version {
	return Version{src: s, items: trimPadding(tokenize(s))}
}

// String returns the version as it was given.
func (v Version) String() string { return v.src }

// digitValue returns the value of a Unicode decimal digit (Java's
// Character.isDigit / Character.digit), or -1. Maven Resolver accepts any
// decimal digit: "١.٠" (Arabic-Indic) equals "1.0".
func digitValue(r rune) int {
	if r >= '0' && r <= '9' {
		return int(r - '0')
	}
	if r < utf8.RuneSelf || !unicode.IsDigit(r) {
		return -1
	}
	start := r // decimal digits come in runs of whole blocks of ten
	for unicode.IsDigit(start - 1) {
		start--
	}
	return int(r-start) % 10
}

// utf16Len is the length Java sees (String.length).
func utf16Len(s string) int {
	n := 0
	for _, r := range s {
		n++
		if r > 0xFFFF {
			n++
		}
	}
	return n
}

func tokenize(version string) []item {
	v := version
	if v == "" {
		v = "0"
	}
	var out []item
	index, n := 0, len(v)
	for index < n {
		state, start, end, termNum := -2, index, n, false
		for index < n {
			c, size := utf8.DecodeRuneInString(v[index:])
			if c == '.' || c == '-' || c == '_' {
				end = index
				index++
				break
			}
			if digitValue(c) >= 0 {
				if state == -1 {
					end = index
					termNum = true
					break
				}
				if state == 0 {
					start++
				}
				if state > 0 || c != '0' {
					state = 1
				} else {
					state = 0
				}
			} else {
				if state >= 0 {
					end = index
					break
				}
				state = -1
			}
			index += size
		}
		var token string
		var number bool
		if end-start > 0 {
			token, number = v[start:end], state >= 0
		} else {
			token, number = "0", true
		}
		out = append(out, toItem(token, number, termNum, index >= n))
	}
	return out
}

func toItem(token string, number, termNum, atEnd bool) item {
	if number {
		var digits []byte
		for _, r := range token {
			digits = append(digits, byte('0'+digitValue(r)))
		}
		if utf16Len(token) < 10 {
			i, _ := strconv.Atoi(string(digits))
			return item{kind: kInt, n: i}
		}
		t := strings.TrimLeft(string(digits), "0")
		if t == "" {
			t = "0"
		}
		return item{kind: kBigInt, s: t}
	}
	low := javaLower(token)
	if atEnd {
		switch low {
		case "min":
			return item{kind: kMin}
		case "max":
			return item{kind: kMax}
		}
	}
	if termNum && len(token) == 1 {
		switch low {
		case "a":
			return item{kind: kQual, n: qualifiers["alpha"]}
		case "b":
			return item{kind: kQual, n: qualifiers["beta"]}
		case "m":
			return item{kind: kQual, n: qualifiers["milestone"]}
		}
	}
	if q, ok := qualifiers[low]; ok {
		return item{kind: kQual, n: q}
	}
	return item{kind: kString, s: low}
}

func trimPadding(items []item) []item {
	var number *bool
	end := len(items) - 1
	for i := end; i > 0; i-- {
		it := items[i]
		num := it.isNumber()
		if number == nil || *number != num {
			end = i
			number = &num
		}
		if end == i && (i == len(items)-1 || items[i-1].isNumber() == num) && it.compareNull() == 0 {
			items = append(items[:i], items[i+1:]...)
			end--
		}
	}
	return items
}

func padCompare(items []item, index int, number *bool) int {
	rel := 0
	for _, it := range items[index:] {
		if number != nil && *number != it.isNumber() {
			continue
		}
		if rel = it.compareNull(); rel != 0 {
			break
		}
	}
	return rel
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

// Compare returns -1, 0 or +1 when v is lower than, equal to or higher than
// o in Maven order.
func (v Version) Compare(o Version) int {
	a, b := v.items, o.items
	if v.items == nil && v.src == "" {
		a = ParseVersion("").items
	}
	if o.items == nil && o.src == "" {
		b = ParseVersion("").items
	}
	number := true
	for i := 0; ; i++ {
		if i >= len(a) && i >= len(b) {
			return 0
		}
		if i >= len(a) {
			return -sign(padCompare(b, i, nil))
		}
		if i >= len(b) {
			return sign(padCompare(a, i, nil))
		}
		x, y := a[i], b[i]
		if x.isNumber() != y.isNumber() {
			if number == x.isNumber() {
				return sign(padCompare(a, i, &number))
			}
			return -sign(padCompare(b, i, &number))
		}
		if rel := x.compare(y); rel != 0 {
			return sign(rel)
		}
		number = x.isNumber()
	}
}

// Equal reports whether two versions are equal for Maven ("1.0" == "1.0.0" == "1-ga").
func (v Version) Equal(o Version) bool { return v.Compare(o) == 0 }

// Compare compares two version strings in Maven order (-1, 0, +1).
func Compare(a, b string) int { return ParseVersion(a).Compare(ParseVersion(b)) }

// Sort sorts version strings in Maven order, lowest first. The sort is stable.
func Sort(versions []string) {
	p := make([]Version, len(versions))
	for i, v := range versions {
		p[i] = ParseVersion(v)
	}
	idx := make([]int, len(versions))
	for i := range idx {
		idx[i] = i
	}
	sort.SliceStable(idx, func(i, j int) bool { return p[idx[i]].Compare(p[idx[j]]) < 0 })
	out := make([]string, len(versions))
	for i, k := range idx {
		out[i] = versions[k]
	}
	copy(versions, out)
}
