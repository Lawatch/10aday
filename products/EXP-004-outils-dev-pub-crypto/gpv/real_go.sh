#!/usr/bin/env bash
# Real `go` runs quoted on the page (table "What go says"). Needs network access to proxy.golang.org.
# Run from an empty module dir: go mod init x && bash real_go.sh
for v in v1.6.1-0.20241114170450-2d3c2a9cc518 v0.0.0-20241114170450-2d3c2a9cc518 v1.6.1-0.20241114170451-2d3c2a9cc518 \
  v1.6.1-0.20241114170450-2d3c2a9cc5 v1.6.2-0.20241114170450-2d3c2a9cc518 v1.6.0-0.20241114170450-2d3c2a9cc518 v1.6.1-0.20241114170450-ffffffffffff; do
  echo "== $v"; go list -m -json github.com/google/uuid@$v 2>&1 | grep -E '"Version"|go:' | head -1
done
for q in github.com/google/uuid@2d3c2a9 github.com/gorilla/mux@master github.com/docker/docker@v24.0.0; do
  echo "== $q"; go list -m -json "$q" 2>&1 | grep -E '"Version"|go:' | head -1
done
