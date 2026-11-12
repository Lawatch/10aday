#!/usr/bin/env python3
"""Génère DASHBOARD.md et dashboard/index.html à partir de l'état du dépôt.

Fichiers générés : ne pas les éditer à la main. Seul le répartiteur les régénère et les pousse (un seul écrivain = pas de conflit).
Usage : python3 ops/build_dashboard.py
"""
import datetime as dt
import html
import re

from lib import ROOT, experiments, ledger_rows, lock_age_min, now_utc, to_float

STATUS_ICON = {"active": "🟢", "pause": "🟡", "tuee": "🔴", "reussie": "✅"}
MODEL_LABEL = {"vente": "Vente", "trafic-pub": "Trafic → pub", "affiliation": "Affiliation", "service": "Service",
               "abonnement": "Abonnement", "prime": "Prime/bounty", "autre": "Autre"}


def read(rel):
    p = ROOT / rel
    return p.read_text(encoding="utf-8") if p.exists() else ""


def section(text, title):
    m = re.search(rf"^## {re.escape(title)}\n(.*?)(?=^## |\Z)", text, re.S | re.M)
    return m.group(1).strip() if m else ""


def days_left(d):
    try:
        delta = (dt.date.fromisoformat(d) - now_utc().date()).days
    except (ValueError, TypeError):
        return ""
    return f"J-{delta}" if delta > 0 else ("aujourd'hui" if delta == 0 else f"dépassée ({-delta} j)")


def collect():
    exps = experiments()
    rows = ledger_rows()
    revenue = sum(to_float(r.get("montant_eur")) for r in rows if r.get("type", "").lower().startswith("rev"))
    costs = sum(to_float(r.get("montant_eur")) for r in rows if r.get("type", "").lower().startswith("dep"))
    week_ago = now_utc().date() - dt.timedelta(days=7)
    rev7 = 0.0
    for r in rows:
        try:
            if r.get("type", "").lower().startswith("rev") and dt.date.fromisoformat(r["date"][:10]) > week_ago:
                rev7 += to_float(r.get("montant_eur"))
        except (ValueError, KeyError):
            pass
    ideas_txt = read("state/ideas.md")
    cand = section(ideas_txt, "Candidates")
    n_ideas = len(re.findall(r"^\| ID-", cand, re.M))
    n_rejected = len(re.findall(r"^\| (?!Idée|---)", section(ideas_txt, "Rejetées"), re.M))
    hq = [f"{t} — {x.strip()}" if x.strip() else t for t, x in re.findall(r"^### (HQ-\d+ — .*?)\s+\[🟡 ouvert(?:\s*—\s*)?([^\]]*)\]", read("state/HUMAN_QUEUE.md"), re.M)]
    journals = sorted(p for p in (ROOT / "journal").glob("20*.md"))
    since = (now_utc() - dt.timedelta(hours=24)).strftime("%Y-%m-%d-%H%M")
    runs24 = [p for p in journals if p.stem[:15] >= since]
    recent = []
    for p in reversed(journals[-12:]):
        t = p.read_text(encoding="utf-8")
        obj = re.search(r"\*\*Objectif du passage\*\*\s*:\s*(.+)", t)
        recent.append((p.stem, obj.group(1).strip() if obj else ""))
    palier = section(read("state/STATUS.md"), "Palier actuel").splitlines()
    locks = {p.stem: lock_age_min(p.stem) for p in (ROOT / "state" / "locks").glob("*.lock")}
    return dict(exps=exps, revenue=revenue, costs=costs, rev7=rev7, n_ideas=n_ideas, n_rejected=n_rejected, hq=hq,
                runs24=len(runs24), recent=recent, palier=palier[0] if palier else "?", locks=locks)


def build_md(d):
    e = d["exps"]
    count = lambda s: sum(1 for x in e if x.get("statut") == s)
    L = [
        "# 📊 Tableau de bord 10aday",
        f"_Généré automatiquement le {now_utc():%Y-%m-%d %H:%M} UTC par `ops/build_dashboard.py` — ne pas éditer._",
        "",
        "| Revenu net cumulé | Revenu / jour (moy. 7 j) | Objectif | Palier |",
        "|---|---|---|---|",
        f"| **{d['revenue'] - d['costs']:.2f} €** | **{d['rev7'] / 7:.2f} €** | 10,00 € / jour | {d['palier']} |",
        "",
        "| Expériences actives | Réussies | Tuées | Idées en attente | Idées rejetées | Passages d'agents (24 h) | Demandes humaines ouvertes |",
        "|---|---|---|---|---|---|---|",
        f"| {count('active')} | {count('reussie')} | {count('tuee')} | {d['n_ideas']} | {d['n_rejected']} | {d['runs24']} | {len(d['hq'])} |",
        "",
        "## Expériences",
        "| | ID | Titre | Modèle | Métrique | Valeur actuelle | ✅ Succès si | ❌ Échec si | Décision | Revenu | Verdict |",
        "|---|---|---|---|---|---|---|---|---|---|---|",
    ]
    order = {"active": 0, "pause": 1, "reussie": 2, "tuee": 3}
    for x in sorted(e, key=lambda x: (order.get(x.get("statut"), 9), x.get("id", ""))):
        L.append("| {} | [{}]({}) | {} | {} | {} | {} | {} | {} | {} {} | {} € | {} |".format(
            STATUS_ICON.get(x.get("statut"), "❔"), x.get("id"), x["_file"], x.get("titre", ""),
            MODEL_LABEL.get(x.get("modele_revenu"), x.get("modele_revenu", "")), x.get("metrique", ""),
            x.get("valeur_actuelle", ""), x.get("seuil_succes", ""), x.get("seuil_echec", ""),
            x.get("decision_le", ""), f"({days_left(x.get('decision_le'))})" if x.get("statut") == "active" else "",
            x.get("revenu_total_eur", "0"), x.get("verdict", "")))
    if not e:
        L.append("| | | _aucune expérience_ | | | | | | | | |")
    L += ["", "## 🙋 Ce qu'on attend de toi (`state/HUMAN_QUEUE.md`)"]
    L += [f"- {h}" for h in d["hq"]] or ["- Rien 🎉"]
    L += ["", "## 🕒 Derniers passages d'agents"]
    L += [f"- `{s}` — {o}" for s, o in d["recent"]] or ["- aucun"]
    busy = [f"`{k}` ({v:.0f} min)" for k, v in d["locks"].items() if v is not None and v < 50]
    L += ["", f"**Couloirs en cours** : {', '.join(busy) if busy else 'aucun'}", ""]
    return "\n".join(L)


def build_html(d):
    e = d["exps"]
    esc = lambda s: html.escape(str(s or ""))
    count = lambda s: sum(1 for x in e if x.get("statut") == s)
    tiles = [("Revenu net cumulé", f"{d['revenue'] - d['costs']:.2f} €"), ("Revenu / jour (7 j)", f"{d['rev7'] / 7:.2f} €"),
             ("Objectif", "10 € / jour"), ("Expériences actives", count("active")), ("Réussies", count("reussie")),
             ("Tuées", count("tuee")), ("Idées en attente", d["n_ideas"]), ("Passages (24 h)", d["runs24"])]
    order = {"active": 0, "pause": 1, "reussie": 2, "tuee": 3}
    cards = []
    for x in sorted(e, key=lambda x: (order.get(x.get("statut"), 9), x.get("id", ""))):
        st = x.get("statut", "")
        link = f'<a href="{esc(x.get("lien_public"))}">{esc(x.get("lien_public"))}</a>' if x.get("lien_public") else "pas encore publié"
        cards.append(f"""<article class="exp {esc(st)}">
<header><span class="badge">{STATUS_ICON.get(st, '❔')} {esc(st)}</span> <b>{esc(x.get('id'))}</b> — {esc(x.get('titre'))}
<span class="model">{esc(MODEL_LABEL.get(x.get('modele_revenu'), x.get('modele_revenu')))}</span></header>
<p class="hyp">{esc(x.get('hypothese'))}</p>
<dl>
<dt>Métrique</dt><dd>{esc(x.get('metrique'))}</dd>
<dt>Valeur actuelle</dt><dd><b>{esc(x.get('valeur_actuelle'))}</b></dd>
<dt>✅ Succès si</dt><dd>{esc(x.get('seuil_succes'))}</dd>
<dt>❌ Échec si</dt><dd>{esc(x.get('seuil_echec'))}</dd>
<dt>Décision</dt><dd>{esc(x.get('decision_le'))} {esc(days_left(x.get('decision_le')) if st == 'active' else '')}</dd>
<dt>Revenu</dt><dd>{esc(x.get('revenu_total_eur', '0'))} €</dd>
<dt>Prochain rôle</dt><dd>{esc(x.get('prochain_role'))}</dd>
<dt>En ligne</dt><dd>{link}</dd>
{f"<dt>Verdict</dt><dd><b>{esc(x.get('verdict'))}</b></dd>" if x.get('verdict') else ''}
</dl></article>""")
    hq = "".join(f"<li>{esc(h)}</li>" for h in d["hq"]) or "<li>Rien 🎉</li>"
    recent = "".join(f"<li><code>{esc(s)}</code> — {esc(o)}</li>" for s, o in d["recent"]) or "<li>aucun</li>"
    tiles_html = "".join(f'<div class="tile"><div class="k">{esc(k)}</div><div class="v">{esc(v)}</div></div>' for k, v in tiles)
    return f"""<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>10aday — tableau de bord</title>
<style>
:root{{--bg:#fafaf9;--fg:#1c1917;--mut:#78716c;--card:#fff;--bd:#e7e5e4;--ok:#15803d;--ko:#b91c1c;--act:#1d4ed8;--pause:#a16207}}
@media (prefers-color-scheme:dark){{:root{{--bg:#1c1917;--fg:#f5f5f4;--mut:#a8a29e;--card:#292524;--bd:#44403c;--ok:#4ade80;--ko:#f87171;--act:#93c5fd;--pause:#facc15}}}}
body{{font-family:system-ui,sans-serif;background:var(--bg);color:var(--fg);margin:0;padding:1.2rem;line-height:1.45}}
main{{max-width:1100px;margin:auto}} h1{{margin:.2rem 0}} .mut{{color:var(--mut);font-size:.85rem}}
.tiles{{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:.6rem;margin:1rem 0}}
.tile{{background:var(--card);border:1px solid var(--bd);border-radius:10px;padding:.7rem}}
.tile .k{{color:var(--mut);font-size:.8rem}} .tile .v{{font-size:1.4rem;font-weight:600;font-variant-numeric:tabular-nums}}
.grid{{display:grid;grid-template-columns:repeat(auto-fill,minmax(330px,1fr));gap:.8rem}}
.exp{{background:var(--card);border:1px solid var(--bd);border-left:5px solid var(--mut);border-radius:10px;padding:.8rem}}
.exp.active{{border-left-color:var(--act)}} .exp.reussie{{border-left-color:var(--ok)}} .exp.tuee{{border-left-color:var(--ko)}} .exp.pause{{border-left-color:var(--pause)}}
.badge{{font-size:.75rem;color:var(--mut)}} .model{{float:right;font-size:.75rem;border:1px solid var(--bd);border-radius:99px;padding:0 .5rem}}
.hyp{{font-style:italic;color:var(--mut);font-size:.9rem}}
dl{{display:grid;grid-template-columns:auto 1fr;gap:.2rem .6rem;font-size:.88rem;margin:0}} dt{{color:var(--mut)}} dd{{margin:0}}
a{{color:var(--act)}} section{{margin-top:1.5rem}}
</style></head><body><main>
<h1>📊 10aday — tableau de bord</h1>
<div class="mut">Mis à jour le {now_utc():%Y-%m-%d %H:%M} UTC · Palier : {esc(d['palier'])}</div>
<div class="tiles">{tiles_html}</div>
<section><h2>Expériences</h2><div class="grid">{''.join(cards) or '<p>Aucune expérience.</p>'}</div></section>
<section><h2>🙋 Ce qu'on attend de toi</h2><ul>{hq}</ul></section>
<section><h2>🕒 Derniers passages d'agents</h2><ul>{recent}</ul></section>
</main></body></html>"""


def main():
    d = collect()
    (ROOT / "DASHBOARD.md").write_text(build_md(d), encoding="utf-8")
    out = ROOT / "dashboard"
    out.mkdir(exist_ok=True)
    (out / "index.html").write_text(build_html(d), encoding="utf-8")
    print("DASHBOARD.md et dashboard/index.html générés")


if __name__ == "__main__":
    main()
