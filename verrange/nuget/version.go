// Package nuget parses NuGet versions and version ranges and picks the
// version that NuGet itself would pick.
//
// It follows NuGet.Versioning (the library used by dotnet restore and
// nuget.exe) rule for rule: four-part versions, case-insensitive
// pre-release labels, interval ranges such as "[1.0,2.0)", floating
// versions such as "1.*", "1.2.*-beta*" or "*-*", and the "best match"
// algorithm that decides which published version gets restored.
//
// Its results were compared with the real NuGet.Versioning 8.0.0
// package on more than 60,000 generated cases and with real
// dotnet restore runs. See the testdata directory.
//
// Quick start:
//
//	r, _ := nuget.ParseRange("[1.0,2.0)")
//	v, _ := nuget.ParseVersion("1.5.0")
//	r.Satisfies(v) // true
package nuget

import (
	"errors"
	"strconv"
	"strings"
	"unicode"
)

const intMax = 2147483647

// ErrInvalidVersion is returned when a string is not a valid NuGet version.
var ErrInvalidVersion = errors.New("nuget: invalid version")

// Version is a NuGet version: Major.Minor.Patch.Revision, optional
// pre-release labels and optional build metadata.
type Version struct {
	Major, Minor, Patch, Revision int
	// Release holds the dot-separated pre-release labels, e.g. ["beta", "2"]
	// for "1.0.0-beta.2". It is nil for a stable version.
	Release []string
	// Metadata is the build metadata after "+", ignored when comparing.
	Metadata string
}

func isDigit(c rune) bool { return c >= '0' && c <= '9' }

// isWs mirrors .NET char.IsWhiteSpace.
func isWs(c rune) bool { return unicode.IsSpace(c) }

func isLDD(c byte) bool {
	return (c >= '0' && c <= '9') || (c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z') || c == '-'
}

func isBlank(s string) bool { return strings.TrimFunc(s, isWs) == "" }

func trim(s string) string { return strings.TrimFunc(s, isWs) }

func isValidPart(s string, allowLeadingZeros bool) bool {
	if len(s) == 0 {
		return false
	}
	if !allowLeadingZeros && len(s) > 1 && s[0] == '0' {
		allDigits := true
		for i := 1; i < len(s); i++ {
			if !isDigit(rune(s[i])) {
				allDigits = false
				break
			}
		}
		if allDigits {
			return false
		}
	}
	for i := 0; i < len(s); i++ {
		if !isLDD(s[i]) {
			return false
		}
	}
	return true
}

func isValid(s string, allowLeadingZeros bool) bool {
	for _, p := range strings.Split(s, ".") {
		if !isValidPart(p, allowLeadingZeros) {
			return false
		}
	}
	return true
}

type sections struct {
	version  string
	hasVer   bool
	labels   []string
	metadata string
	hasMeta  bool
}

// parseSections splits "1.0.0-beta+build" into its three parts, the way
// NuGet's VersionParser.ParseSections does.
func parseSections(value string) sections {
	var r sections
	versionEnd, plusPos := -1, -1
	for i := 0; i < len(value); i++ {
		end := i == len(value)-1
		if versionEnd < 0 {
			if end || value[i] == '-' || value[i] == '+' {
				endPos := i
				if end {
					endPos++
				}
				r.version, r.hasVer = value[:endPos], true
				versionEnd = i
				if value[i] == '+' {
					plusPos = i
				}
			}
		} else if plusPos < 0 {
			if end || value[i] == '+' {
				endPos := i
				if end {
					endPos++
				}
				r.labels = strings.Split(value[versionEnd+1:endPos], ".")
				plusPos = i
			}
		} else if end {
			r.metadata, r.hasMeta = value[plusPos+1:i+1], true
		}
	}
	return r
}

// parseSection reads one numeric part starting at start, allowing
// surrounding white space like .NET's System.Version parser.
func parseSection(str []rune, start int) (next int, n int, ok bool) {
	if start == len(str) {
		return start, 0, true
	}
	end := start
	for ; end < len(str); end++ {
		c := str[end]
		if !isWs(c) {
			if isDigit(c) {
				break
			}
			return 0, 0, false
		}
	}
	done, digitFound := false, false
	var acc int64
	for ; end < len(str); end++ {
		ch := str[end]
		if isDigit(ch) {
			digitFound = true
			acc = acc*10 + int64(ch-'0')
			if acc > intMax {
				return 0, 0, false
			}
		} else if ch == '.' {
			end++
			if end == len(str) {
				return 0, 0, false
			}
			done = true
			break
		} else if isWs(ch) {
			break
		} else {
			return 0, 0, false
		}
	}
	if !digitFound {
		return 0, 0, false
	}
	if end == len(str) {
		done = true
	}
	if !done {
		for ; end < len(str); end++ {
			c := str[end]
			if !isWs(c) {
				if c == '.' {
					end++
					if end == len(str) {
						return 0, 0, false
					}
					break
				}
				return 0, 0, false
			}
		}
	}
	return end, int(acc), true
}

func normalizedNumbers(s string) ([4]int, bool) {
	var nums [4]int
	if isBlank(s) {
		return nums, false
	}
	str := []rune(s)
	pos := 0
	for k := 0; k < 4; k++ {
		next, n, ok := parseSection(str, pos)
		if !ok {
			return nums, false
		}
		nums[k], pos = n, next
	}
	return nums, pos == len(str)
}

// ParseVersion parses a NuGet version such as "1.0", "1.2.3.4",
// "2.0.0-rc.1" or "1.0.0+build.5". Leading and trailing white space is
// ignored. It accepts exactly what NuGetVersion.TryParse accepts.
func ParseVersion(s string) (Version, error) {
	t := trim(s)
	sec := parseSections(t)
	if !sec.hasVer {
		return Version{}, ErrInvalidVersion
	}
	nums, ok := normalizedNumbers(sec.version)
	if !ok {
		return Version{}, ErrInvalidVersion
	}
	for _, l := range sec.labels {
		if !isValidPart(l, false) {
			return Version{}, ErrInvalidVersion
		}
	}
	if sec.hasMeta && !isValid(sec.metadata, true) {
		return Version{}, ErrInvalidVersion
	}
	return Version{Major: nums[0], Minor: nums[1], Patch: nums[2], Revision: nums[3], Release: sec.labels, Metadata: sec.metadata}, nil
}

// MustParseVersion is like ParseVersion but panics on error.
func MustParseVersion(s string) Version {
	v, err := ParseVersion(s)
	if err != nil {
		panic(err.Error() + ": " + strconv.Quote(s))
	}
	return v
}

// IsPrerelease reports whether v has a non-empty pre-release label.
func (v Version) IsPrerelease() bool {
	for _, l := range v.Release {
		if l != "" {
			return true
		}
	}
	return false
}

func (v Version) release() string { return strings.Join(v.Release, ".") }

// String returns the normalized form used by NuGet: "1.0.0", "1.2.3.4",
// "1.0.0-beta". Build metadata is left out (see FullString).
func (v Version) String() string {
	var b strings.Builder
	b.WriteString(strconv.Itoa(v.Major))
	b.WriteByte('.')
	b.WriteString(strconv.Itoa(v.Minor))
	b.WriteByte('.')
	b.WriteString(strconv.Itoa(v.Patch))
	if v.Revision > 0 {
		b.WriteByte('.')
		b.WriteString(strconv.Itoa(v.Revision))
	}
	if v.IsPrerelease() {
		b.WriteByte('-')
		b.WriteString(v.release())
	}
	return b.String()
}

// FullString is String plus "+metadata" when there is build metadata.
func (v Version) FullString() string {
	if v.Metadata != "" {
		return v.String() + "+" + v.Metadata
	}
	return v.String()
}

// labelInt mirrors .NET int.TryParse on a label made of [0-9A-Za-z-].
func labelInt(s string) (int64, bool) {
	d := strings.TrimPrefix(s, "-")
	if d == "" {
		return 0, false
	}
	for i := 0; i < len(d); i++ {
		if !isDigit(rune(d[i])) {
			return 0, false
		}
	}
	n, err := strconv.ParseInt(s, 10, 32)
	return n, err == nil
}

func cmp3[T int | int64 | string](a, b T) int {
	if a < b {
		return -1
	}
	if a > b {
		return 1
	}
	return 0
}

func compareLabel(a, b string) int {
	na, aok := labelInt(a)
	nb, bok := labelInt(b)
	switch {
	case aok && bok:
		return cmp3(na, nb)
	case aok:
		return -1
	case bok:
		return 1
	}
	return cmp3(strings.ToUpper(a), strings.ToUpper(b))
}

// Compare returns -1, 0 or +1 following NuGet's default version order.
// Numbers are compared first, then a pre-release sorts before the stable
// version, then labels are compared one by one (numeric labels as numbers,
// others case-insensitively). Build metadata is ignored.
func Compare(x, y Version) int {
	if r := cmp3(x.Major, y.Major); r != 0 {
		return r
	}
	if r := cmp3(x.Minor, y.Minor); r != 0 {
		return r
	}
	if r := cmp3(x.Patch, y.Patch); r != 0 {
		return r
	}
	if r := cmp3(x.Revision, y.Revision); r != 0 {
		return r
	}
	xp, yp := x.IsPrerelease(), y.IsPrerelease()
	switch {
	case xp && !yp:
		return -1
	case !xp && yp:
		return 1
	case xp && yp:
		xl, yl := x.Release, y.Release
		n := max(len(xl), len(yl))
		for i := 0; i < n; i++ {
			if i >= len(xl) {
				return -1
			}
			if i >= len(yl) {
				return 1
			}
			if r := compareLabel(xl[i], yl[i]); r != 0 {
				return r
			}
		}
	}
	return 0
}

// Equal reports whether Compare(v, o) == 0.
func (v Version) Equal(o Version) bool { return Compare(v, o) == 0 }
