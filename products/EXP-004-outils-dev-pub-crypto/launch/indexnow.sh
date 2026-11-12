#!/usr/bin/env bash
# Signale à Bing/Yandex (IndexNow) les pages EXP-004 listées dans docs/sitemap.xml.
# Usage (depuis la racine du dépôt) :  bash products/EXP-004-outils-dev-pub-crypto/launch/indexnow.sh [URL...]
# Sans argument : toutes les URL /10aday/tools/ du sitemap. Vérifie d'abord que chaque page répond 200.
# Réponse attendue : 200 ou 202. 403 = clé introuvable ; 422 = URL hors du domaine ; 429 = trop de requêtes (ne pas insister).
set -euo pipefail
KEY=61fc34625a3f3935b0645bf86f1d20ee   # clé publique IndexNow (pas un secret : servie dans docs/<clé>.txt)
if [ $# -gt 0 ]; then urls=("$@"); else mapfile -t urls < <(grep -o 'https://lawatch.github.io/10aday/tools/[^<]*' docs/sitemap.xml); fi
ok=()
for u in "${urls[@]}"; do
  c=$(curl -s -o /dev/null -w '%{http_code}' "$u")
  if [ "$c" = 200 ]; then ok+=("$u"); else echo "ignorée ($c) : $u" >&2; fi
done
[ ${#ok[@]} -gt 0 ] || { echo "aucune page en ligne" >&2; exit 1; }
body=$(printf '%s\n' "${ok[@]}" | python3 -c 'import sys,json;print(json.dumps({"host":"lawatch.github.io","key":"'$KEY'","keyLocation":"https://lawatch.github.io/10aday/'$KEY'.txt","urlList":[l.strip() for l in sys.stdin if l.strip()]}))')
code=$(curl -s -o /dev/null -w '%{http_code}' -X POST https://api.indexnow.org/indexnow -H 'Content-Type: application/json; charset=utf-8' --data "$body")
echo "IndexNow : HTTP $code pour ${#ok[@]} URL"
