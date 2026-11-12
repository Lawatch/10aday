#!/usr/bin/env python3
"""earn_scan — inventaire des annonces Superteam Earn ouvertes aux agents IA (EXP-005).

Lecture seule : ne soumet rien, ne signe rien, n'enregistre aucun agent.

Sources (au choix) :
  --api              GET {BASE}/api/agents/listings/live (clé agent requise, lue dans
                     la variable d'env EARN_API_KEY ; dans l'environnement cloud, le proxy
                     peut l'injecter : on envoie alors une valeur factice).
  --public           GET {BASE}/api/listings?...status=open (sans clé ; ne montre PAS
                     les annonces AGENT_ONLY, masquées des flux publics).
  --file F.json      réponse JSON sauvegardée (tests, ou copie faite par l'humain).

Sortie : tableau Markdown trié par score (à coller dans LISTINGS.md).
Champs attendus : ceux de `listingSelect` (SuperteamDAO/earn,
src/features/listings/constants/schema.ts) : id, slug, title, type, token, rewardAmount,
deadline, agentAccess, status, compensationType, minRewardAsk, maxRewardAsk,
_count.Submission, sponsor{name, isVerified, chapter}.

Clé API : JAMAIS dans le dépôt (CHARTER règle 5).
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.request
from datetime import datetime, timezone

BASE = os.environ.get("EARN_BASE_URL", "https://superteam.fun")
AGENT_OK = {"AGENT_ALLOWED", "AGENT_ONLY"}
# Mots qui signalent un livrable hors de notre portée (clé privée, tx, réseaux sociaux, vidéo…)
EXCLUDE_WORDS = ("mainnet", "deploy", "video", "tweet", "x thread", "thread", "meme",
                 "trading", "airdrop", "tiktok", "youtube", "design", "figma")
GOOD_WORDS = ("tool", "skill", "sdk", "cli", "library", "audit", "report", "research",
              "analysis", "docs", "documentation", "plugin", "mcp", "agent", "open source",
              "open-source", "test", "dashboard", "integration")


def parse_dt(s: str | None) -> datetime | None:
    if not s:
        return None
    s = s.replace("Z", "+00:00")
    try:
        d = datetime.fromisoformat(s)
    except ValueError:
        return None
    return d if d.tzinfo else d.replace(tzinfo=timezone.utc)


def assess(item: dict, now: datetime) -> dict:
    """Normalise une annonce et calcule faisabilité + score (heuristique, à relire)."""
    title = item.get("title") or ""
    low = title.lower()
    deadline = parse_dt(item.get("deadline"))
    days_left = None if deadline is None else (deadline - now).total_seconds() / 86400
    subs = ((item.get("_count") or {}).get("Submission")) or 0
    sponsor = item.get("sponsor") or {}
    reward = item.get("rewardAmount") or item.get("maxRewardAsk") or 0
    access = item.get("agentAccess") or "HUMAN_ONLY"
    superteam_sponsor = bool(sponsor.get("chapter")) or "superteam" in (sponsor.get("name") or "").lower()

    reasons = []
    feasible = True
    if access not in AGENT_OK:
        feasible = False
        reasons.append("humains seulement")
    if (item.get("status") or "OPEN") != "OPEN" or item.get("isWinnersAnnounced"):
        feasible = False
        reasons.append("fermée")
    if days_left is None or days_left < 0:
        feasible = False
        reasons.append("échéance passée")
    elif days_left < 5:
        feasible = False
        reasons.append(f"échéance < 5 j ({days_left:.1f} j)")
    if any(w in low for w in EXCLUDE_WORDS):
        feasible = False
        reasons.append("livrable hors charte/portée (mot-clé)")

    # Score : espérance naïve (dotation / (soumissions+1)), bonus livrable code/rapport,
    # bonus sponsor externe (pas de KYC Superteam), bonus AGENT_ONLY (moins de concurrence humaine).
    score = float(reward) / (subs + 1)
    if any(w in low for w in GOOD_WORDS):
        score *= 1.5
    if not superteam_sponsor:
        score *= 1.2
    if access == "AGENT_ONLY":
        score *= 1.2
    if days_left is not None and days_left >= 7:
        score *= 1.1
    if not feasible:
        score = 0.0

    return {
        "slug": item.get("slug") or "",
        "title": title,
        "type": item.get("type") or "",
        "sponsor": sponsor.get("name") or "?",
        "kyc_superteam": superteam_sponsor,
        "reward": reward,
        "token": item.get("token") or "",
        "subs": subs,
        "deadline": deadline.strftime("%Y-%m-%d") if deadline else "?",
        "days_left": days_left,
        "access": access,
        "feasible": feasible,
        "reasons": reasons,
        "score": round(score, 1),
    }


def to_markdown(rows: list[dict], now: datetime, source: str) -> str:
    out = [f"_Scan du {now:%Y-%m-%d %H:%M} UTC — source : {source} — {len(rows)} annonces._", "",
           "| Score | Annonce | Sponsor | Dotation | Soum. | Échéance (j) | Accès | Faisable ? |",
           "|---:|---|---|---:|---:|---|---|---|"]
    for r in sorted(rows, key=lambda r: (-r["score"], r["days_left"] or 1e9)):
        url = f"{BASE}/earn/listing/{r['slug']}/"
        dl = "?" if r["days_left"] is None else f"{r['deadline']} ({r['days_left']:.0f})"
        sp = r["sponsor"] + (" (Superteam ⇒ KYC)" if r["kyc_superteam"] else "")
        fe = "✅" if r["feasible"] else "❌ " + ", ".join(r["reasons"])
        out.append(f"| {r['score']} | [{r['title']}]({url}) | {sp} | {r['reward']} {r['token']} | "
                   f"{r['subs']} | {dl} | {r['access']} | {fe} |")
    return "\n".join(out) + "\n"


def fetch(url: str, key: str | None) -> list[dict]:
    req = urllib.request.Request(url, headers={"User-Agent": "earn-scan/1.0"})
    if key:
        req.add_header("Authorization", f"Bearer {key}")
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.load(resp)
    if isinstance(data, dict):  # certains endpoints enveloppent la liste
        for k in ("listings", "bounties", "data", "items"):
            if isinstance(data.get(k), list):
                return data[k]
    return data


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--api", action="store_true")
    g.add_argument("--public", action="store_true")
    g.add_argument("--file")
    ap.add_argument("--now", help="date ISO (tests)")
    ap.add_argument("--all", action="store_true", help="garder aussi les annonces humaines")
    a = ap.parse_args(argv)
    now = parse_dt(a.now) if a.now else datetime.now(timezone.utc)

    if a.file:
        with open(a.file, encoding="utf-8") as f:
            items, source = json.load(f), a.file
    elif a.api:
        key = os.environ.get("EARN_API_KEY") or "sk_injected_by_proxy"
        items = fetch(f"{BASE}/api/agents/listings/live?take=50", key)
        source = "API agents /listings/live"
    else:
        items = fetch(f"{BASE}/api/listings?context=all&tab=bounties&category=All&status=open"
                      "&sortBy=Date&order=asc", None)
        # 2e flux public (annonces « live », bounties + projects, 50 max) ; dédoublonné par slug.
        seen = {i.get("slug") for i in items}
        items += [i for i in fetch(f"{BASE}/api/listings/live?take=50", None)
                  if i.get("slug") not in seen]
        source = "2 flux publics (sans AGENT_ONLY)"

    rows = [assess(i, now) for i in items]
    if not a.all:
        rows = [r for r in rows if r["access"] in AGENT_OK]
    sys.stdout.write(to_markdown(rows, now, source))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
