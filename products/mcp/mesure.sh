#!/usr/bin/env bash
# Mesure EXP-008 en une commande : visites, clics d'installation et de question (GoatCounter),
# étoiles et questions (GitHub), téléchargements des fichiers .mcpb.
# Un compteur GoatCounter jamais touché renvoie 404 : cela veut dire 0.
set -u
G=https://10aday.goatcounter.com/counter
cd "$(dirname "$0")"
c() { local r; r=$(curl -s "$G/$1.json"); echo "$r" | grep -q count_unique && echo "$r" | sed -E 's/.*"count":"([0-9]+)".*/\1/' || echo 0; }
echo "site (total) : $(c TOTAL)   page /10aday/mcp/ : $(c %2F10aday%2Fmcp%2F)"
tools=$(grep -oE '"[a-z-]+-(check|mcp|why|exports)"' build_pages.py | sort -u | tr -d '"')
clics=0; n=0
for t in $tools; do for e in install-$t-claude install-$t-vscode install-$t-cursor ask-$t; do
  v=$(c "$e"); n=$((n+1)); [ "$v" != 0 ] && echo "  $e : $v"; clics=$((clics+v)); done; done
echo "clics install/ask : $clics (sur $n compteurs)"
curl -s https://api.github.com/repos/Lawatch/10aday | python3 -c "import json,sys;d=json.load(sys.stdin);print('étoiles',d['stargazers_count'],'| copies',d['forks_count'],'| questions ouvertes',d['open_issues_count'])"
curl -s "https://api.github.com/repos/Lawatch/10aday/releases?per_page=100" | python3 -c "import json,sys;print('fichiers .mcpb téléchargés :',sum(a['download_count'] for r in json.load(sys.stdin) for a in r['assets']))"
