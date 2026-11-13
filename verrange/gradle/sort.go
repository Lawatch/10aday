package gradle

import "sort"

// Sort sorts version strings in place, lowest first, in Gradle's order.
func Sort(versions []string) {
	parsed := make([]Version, len(versions))
	for i, v := range versions {
		parsed[i] = ParseVersion(v)
	}
	sort.SliceStable(parsed, func(i, j int) bool { return parsed[i].Compare(parsed[j]) < 0 })
	for i := range parsed {
		versions[i] = parsed[i].source
	}
}
