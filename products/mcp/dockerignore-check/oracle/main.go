// Oracle: what Docker BuildKit really sends as build context.
// Reads JSON lines {"dockerignore": "...", "paths": ["a/b.txt", "empty/"]} on stdin,
// creates the files in a temp dir, parses the ignore file with moby/patternmatcher/ignorefile.ReadAll
// and walks it with tonistiigi/fsutil (ExcludePatterns), exactly like `docker buildx build`.
// Prints {"sent": [...files...], "error": "..."} per line.
package main

import (
	"bufio"
	"context"
	"encoding/json"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"github.com/moby/patternmatcher/ignorefile"
	"github.com/tonistiigi/fsutil"
)

type in struct {
	Dockerignore string   `json:"dockerignore"`
	Paths        []string `json:"paths"`
}
type out struct {
	Sent  []string `json:"sent"`
	Error string   `json:"error,omitempty"`
}

func run(c in) out {
	dir, _ := os.MkdirTemp("", "ctx")
	defer os.RemoveAll(dir)
	for _, p := range c.Paths {
		full := filepath.Join(dir, p)
		if strings.HasSuffix(p, "/") {
			os.MkdirAll(full, 0o755)
		} else {
			os.MkdirAll(filepath.Dir(full), 0o755)
			os.WriteFile(full, []byte("x"), 0o644)
		}
	}
	pats, err := ignorefile.ReadAll(strings.NewReader(c.Dockerignore))
	if err != nil {
		return out{Error: err.Error()}
	}
	sent := []string{}
	err = fsutil.Walk(context.Background(), dir, &fsutil.FilterOpt{ExcludePatterns: pats}, func(p string, fi os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if fi.IsDir() {
			sent = append(sent, p+"/")
		} else {
			sent = append(sent, p)
		}
		return nil
	})
	if err != nil {
		return out{Sent: []string{}, Error: err.Error()}
	}
	sort.Strings(sent)
	return out{Sent: sent}
}

func main() {
	sc := bufio.NewScanner(os.Stdin)
	sc.Buffer(make([]byte, 1<<20), 1<<24)
	enc := json.NewEncoder(os.Stdout)
	for sc.Scan() {
		var c in
		json.Unmarshal(sc.Bytes(), &c)
		enc.Encode(run(c))
	}
}
