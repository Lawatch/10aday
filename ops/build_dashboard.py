#!/usr/bin/env python3
"""Génère DASHBOARD.md, dashboard/index.html et la page de suivi docs/suivi/ à partir de l'état du dépôt.

Écrit pour l'humain : français courant, concret, lisible en 30 secondes (voir ops/STYLE.md).
Lit les champs « en clair » des fiches d'expérience (titre, en_clair, deja_fait, resultat, bloque_par,
prochaine_etape, on_arrete_si, verdict) et la ligne « En une phrase » des journaux.

Fichiers générés : ne pas les éditer à la main. Chaque agent le lance en fin de passage (un seul agent à la fois).
Usage : python3 ops/build_dashboard.py
"""
import datetime as dt
import html
import re


def eur(x):
    return f"{x:.2f}".replace(".", ",") + " €"

from lib import ROOT, experiments, ledger_rows, now_utc, to_float

ROLE_FR = {"pilote": "pilotage", "operateur": "cycle complet", "builder": "construction", "growth": "faire connaître", "scout": "recherche d'idées",
           "strategist": "décisions", "analyst": "mesures"}
STATUT_FR = {"active": "En test", "pause": "En pause", "tuee": "Arrêtée", "reussie": "Réussie"}
EMPTY = {"", "—", "-", "rien"}


def read(rel):
    p = ROOT / rel
    return p.read_text(encoding="utf-8") if p.exists() else ""


def fr_date(d):
    try:
        return dt.date.fromisoformat(d).strftime("%d/%m")
    except (ValueError, TypeError):
        return d or ""


def days_left(d):
    try:
        n = (dt.date.fromisoformat(d) - now_utc().date()).days
    except (ValueError, TypeError):
        return ""
    return f"dans {n} jours" if n > 1 else ("demain" if n == 1 else ("aujourd'hui" if n == 0 else "date dépassée"))


def clean_request(title):
    """« HQ-006 — Faire indexer le site (≈ 10 min) » → « Faire indexer le site (≈ 10 min) »."""
    return re.sub(r"^HQ-\d+\s*—\s*", "", title).strip()


def collect():
    exps = experiments()
    by_id = {e.get("id"): e for e in exps}
    rows = ledger_rows()
    is_rev = lambda r: r.get("type", "").lower().startswith("rev")
    revenue = sum(to_float(r.get("montant_eur")) for r in rows if is_rev(r))
    costs = sum(to_float(r.get("montant_eur")) for r in rows if r.get("type", "").lower().startswith("dep"))
    week_ago = now_utc().date() - dt.timedelta(days=7)
    rev7 = 0.0
    for r in rows:
        try:
            if is_rev(r) and dt.date.fromisoformat(r["date"][:10]) > week_ago:
                rev7 += to_float(r.get("montant_eur"))
        except (ValueError, KeyError):
            pass
    ideas_txt = read("state/ideas.md")
    m = re.search(r"^## Candidates\n(.*?)(?=^## |\Z)", ideas_txt, re.S | re.M)
    n_ideas = len(re.findall(r"^\| ID-", m.group(1), re.M)) if m else 0

    # Demandes ouvertes à l'humain : titre seulement, sans numéro ni annotations entre crochets.
    requests = [clean_request(t) for t in re.findall(r"^### (HQ-\d+ — .*?)\s+\[🟡 ouvert[^\]]*\]", read("state/HUMAN_QUEUE.md"), re.M)]

    # Derniers passages : phrase « En une phrase » (nouveau format) ou, à défaut, l'objectif (ancien format).
    recent = []
    for p in sorted((ROOT / "journal").glob("20*.md"))[-10:][::-1]:
        t = p.read_text(encoding="utf-8")
        phrase = re.search(r"\*\*En une phrase\*\*\s*:\s*(.+)", t) or re.search(r"\*\*Objectif du passage\*\*\s*:\s*(.+)", t)
        mm = re.match(r"(\d{4}-\d\d-\d\d)-(\d\d)(\d\d)-(.+)-(\w+)$", p.stem)
        if not mm:
            continue
        day, hh, mi, lane, role = mm.groups()
        exp_id = re.search(r"EXP-\d+", lane)
        sujet = by_id.get(exp_id.group(0), {}).get("titre", exp_id.group(0)) if exp_id else (
            "nouvelles idées" if lane == "exploration" else "pilotage")
        recent.append({"quand": f"{fr_date(day)} {hh}h{mi}", "sujet": sujet, "role": ROLE_FR.get(role, role),
                       "phrase": phrase.group(1).strip().replace("**", "") if phrase else ""})
    return dict(exps=exps, revenue=revenue - costs, rev7=rev7, n_ideas=n_ideas, requests=requests, recent=recent)


def split(exps):
    active = [e for e in exps if e.get("statut") == "active"]
    other = [e for e in exps if e.get("statut") != "active"]
    return active, other


def build_md(d):
    active, other = split(d["exps"])
    L = [f"# Où en est 10aday — {now_utc():%d/%m à %Hh%M} (heure UTC)", "",
         "_Page générée automatiquement à chaque passage d'agent. Ne pas modifier à la main._", "",
         "## En bref",
         f"- **Argent gagné** : {eur(d['revenue'])} au total, {eur(d['rev7'] / 7)} par jour en moyenne sur 7 jours. Objectif : 10 € par jour.",
         f"- **Pistes en test** : {len(active)}. Arrêtées ou en pause : {len(other)}. Idées en réserve : {d['n_ideas']}.",
         f"- **Coup de pouce possible (une seule fois, facultatif)** : {len(d['requests'])} demande(s) de clé ou de compte. Rien n'en dépend.", ""]
    L.append("## Les pistes en test")
    for e in active:
        L += [f"### {e.get('titre', e.get('id'))}", "", e.get("en_clair", ""), "",
              f"- **Déjà fait** : {e.get('deja_fait', '')}",
              f"- **Résultat** : {e.get('resultat', '')}"]
        if e.get("bloque_par", "").lower() not in EMPTY:
            L.append(f"- **Bloqué par** : {e['bloque_par']}")
        L += [f"- **Prochaine étape** : {e.get('prochaine_etape', '')}",
              f"- **Décision le {fr_date(e.get('decision_le'))}** ({days_left(e.get('decision_le'))}). On arrête si : {e.get('on_arrete_si', '')}"]
        if e.get("lien_public"):
            L.append(f"- **Voir** : {e['lien_public']}")
        L += [f"- _Fiche détaillée : [{e.get('id')}]({e['_file']})_", ""]
    if not active:
        L += ["Aucune piste en test.", ""]
    if other:
        L.append("## Pistes en pause ou arrêtées")
        L += [f"- **{e.get('titre')}** ({STATUT_FR.get(e.get('statut'), e.get('statut'))}) : {e.get('verdict', '')}" for e in other]
        L.append("")
    L.append("## Coup de pouce possible (une seule fois, facultatif)")
    L += [f"{i}. {r}" for i, r in enumerate(d["requests"], 1)] or ["Rien."]
    L += ["", "_Les étapes détaillées sont dans [state/HUMAN_QUEUE.md](state/HUMAN_QUEUE.md)._", "",
          "## Ce que les agents ont fait récemment"]
    L += [f"- **{r['quand']}** · {r['sujet']} · {r['role']} — {r['phrase']}" for r in d["recent"]] or ["- Rien encore."]
    L.append("")
    return "\n".join(L)


def build_html(d):
    esc = lambda s: html.escape(str(s or ""))
    active, other = split(d["exps"])
    cards = []
    for e in active:
        blocked = e.get("bloque_par", "")
        cards.append(f"""<article class="card">
<h3>{esc(e.get('titre'))}</h3>
<p class="lead">{esc(e.get('en_clair'))}</p>
<dl>
<dt>Déjà fait</dt><dd>{esc(e.get('deja_fait'))}</dd>
<dt>Résultat</dt><dd><b>{esc(e.get('resultat'))}</b></dd>
{f'<dt class="warn">Bloqué par</dt><dd class="warn">{esc(blocked)}</dd>' if blocked.lower() not in EMPTY else ''}
<dt>Prochaine étape</dt><dd>{esc(e.get('prochaine_etape'))}</dd>
<dt>Décision</dt><dd>le {esc(fr_date(e.get('decision_le')))} ({esc(days_left(e.get('decision_le')))}). On arrête si : {esc(e.get('on_arrete_si'))}</dd>
{f'<dt>Voir</dt><dd><a href="{esc(e["lien_public"])}">{esc(e["lien_public"])}</a></dd>' if e.get('lien_public') else ''}
</dl></article>""")
    others = "".join(f"<li><b>{esc(e.get('titre'))}</b> ({esc(STATUT_FR.get(e.get('statut'), e.get('statut')))}) : {esc(e.get('verdict'))}</li>" for e in other)
    reqs = "".join(f"<li>{esc(r)}</li>" for r in d["requests"]) or "<li>Rien pour l'instant.</li>"
    recent = "".join(f"<li><span class='mut'>{esc(r['quand'])} · {esc(r['sujet'])} · {esc(r['role'])}</span><br>{esc(r['phrase'])}</li>" for r in d["recent"])
    return f"""<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>10aday — tableau de bord</title><meta name="robots" content="noindex">
<style>
:root{{--bg:#fafaf9;--fg:#1c1917;--mut:#6b6560;--card:#fff;--bd:#e7e5e4;--acc:#1d4ed8;--warn:#b45309}}
@media (prefers-color-scheme:dark){{:root{{--bg:#1c1917;--fg:#f5f5f4;--mut:#a8a29e;--card:#292524;--bd:#44403c;--acc:#93c5fd;--warn:#fbbf24}}}}
body{{font-family:system-ui,sans-serif;background:var(--bg);color:var(--fg);margin:0;padding:1.2rem;line-height:1.5;font-size:16px}}
main{{max-width:760px;margin:auto}} h1{{font-size:1.4rem;margin:.2rem 0}} h2{{font-size:1.15rem;margin-top:2rem}}
.mut{{color:var(--mut);font-size:.85rem}}
.big{{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:.6rem;margin:1rem 0}}
.big div{{background:var(--card);border:1px solid var(--bd);border-radius:10px;padding:.8rem}}
.big b{{display:block;font-size:1.5rem;font-variant-numeric:tabular-nums}}
.card{{background:var(--card);border:1px solid var(--bd);border-left:4px solid var(--acc);border-radius:10px;padding:1rem;margin:.8rem 0}}
.card h3{{margin:0 0 .3rem}} .lead{{margin:.2rem 0 .8rem}}
dl{{display:grid;grid-template-columns:8.5rem 1fr;gap:.35rem .8rem;margin:0;font-size:.95rem}} dt{{color:var(--mut)}} dd{{margin:0}}
.warn{{color:var(--warn)}} a{{color:var(--acc);word-break:break-all}}
li{{margin:.4rem 0}}
@media (max-width:520px){{dl{{grid-template-columns:1fr}} dt{{margin-top:.4rem}}}}
</style></head><body><main>
<h1>Où en est 10aday</h1>
<div class="mut">Mis à jour le {now_utc():%d/%m à %Hh%M} (heure UTC)</div>
<div class="big">
<div>Argent gagné<b>{eur(d['revenue'])}</b><span class="mut">objectif : 10 € / jour</span></div>
<div>Par jour (moy. 7 j)<b>{eur(d['rev7'] / 7)}</b></div>
<div>Pistes en test<b>{len(active)}</b><span class="mut">{len(other)} arrêtée(s) ou en pause</span></div>
<div>Coups de pouce possibles<b>{len(d['requests'])}</b><span class="mut">facultatif</span></div>
</div>
<h2>Les pistes en test</h2>
{''.join(cards) or '<p>Aucune piste en test.</p>'}
{f'<h2>Pistes en pause ou arrêtées</h2><ul>{others}</ul>' if others else ''}
<h2>Coup de pouce possible (une seule fois, facultatif)</h2><ol>{reqs}</ol>
<p class="mut">Étapes détaillées : fichier state/HUMAN_QUEUE.md du dépôt.</p>
<h2>Ce que les agents ont fait récemment</h2><ul>{recent or '<li>Rien encore.</li>'}</ul>
</main></body></html>"""


def main():
    d = collect()
    (ROOT / "DASHBOARD.md").write_text(build_md(d), encoding="utf-8")
    page = build_html(d)
    for out in (ROOT / "dashboard", ROOT / "docs" / "suivi"):
        out.mkdir(parents=True, exist_ok=True)
        (out / "index.html").write_text(page, encoding="utf-8")
    print("DASHBOARD.md, dashboard/ et docs/suivi/ générés")


if __name__ == "__main__":
    main()
