#!/usr/bin/env python3
"""Génère DASHBOARD.md, dashboard/index.html et la page de suivi docs/suivi/ à partir de l'état du dépôt.

Écrit pour l'humain : français courant, concret, lisible en 30 secondes (voir ops/STYLE.md).
Structure : 1) en bref ; 2) ce qu'on a testé, par catégorie (combien de pistes, ce qui existe, le résultat) ;
3) le détail des pistes en test ; 4) les derniers passages d'agents.
Aucune section « à faire pour l'humain » : le système ne dépend pas de lui.

Lit l'en-tête des fiches (titre, categorie, statut, deja_fait, resultat, prochaine_etape, decision_le, on_arrete_si,
verdict, lien_public) et la ligne « En une phrase » des journaux. Compte aussi les pages publiées dans docs/.
Fichiers générés : ne pas les éditer à la main. Chaque agent le lance en fin de passage.
Usage : python3 ops/build_dashboard.py
"""
import datetime as dt
import html
import re

from lib import ROOT, experiments, ledger_rows, now_utc, to_float

ROLE_FR = {"pilote": "pilotage", "operateur": "travail sur la piste", "builder": "construction", "growth": "faire connaître",
           "scout": "recherche d'idées", "strategist": "décisions", "analyst": "mesures"}
STATUT_FR = {"active": "en test", "pause": "en veille", "tuee": "arrêtée", "reussie": "réussie"}
ORDER = {"active": 0, "reussie": 1, "pause": 2, "tuee": 3}


def eur(x):
    return f"{x:.2f}".replace(".", ",") + " €"


def fr_date(d):
    try:
        return dt.date.fromisoformat(d[:10]).strftime("%d/%m")
    except (ValueError, TypeError):
        return d or ""


def days_left(d):
    try:
        n = (dt.date.fromisoformat(d[:10]) - now_utc().date()).days
    except (ValueError, TypeError):
        return ""
    return f"dans {n} jours" if n > 1 else ("demain" if n == 1 else ("aujourd'hui" if n == 0 else "date passée"))


def count_pages():
    """Pages web publiées (un index.html par page), hors page de suivi."""
    docs = ROOT / "docs"
    pages = [p for p in docs.rglob("index.html") if "suivi" not in p.parts]
    fr = [p for p in pages if "tools" not in p.parts and p.parent != docs]
    en = [p for p in pages if "tools" in p.parts]
    return len(pages), len(fr), len(en)


def collect():
    exps = experiments()
    by_id = {e.get("id"): e for e in exps}
    rows = ledger_rows()
    is_rev = lambda r: r.get("type", "").lower().startswith("rev")
    revenue = sum(to_float(r.get("montant_eur")) for r in rows if is_rev(r))
    costs = sum(to_float(r.get("montant_eur")) for r in rows if r.get("type", "").lower().startswith("dep"))
    week_ago = now_utc().date() - dt.timedelta(days=7)
    rev7 = sum(to_float(r.get("montant_eur")) for r in rows
               if is_rev(r) and re.match(r"\d{4}-\d\d-\d\d", r.get("date", "")) and dt.date.fromisoformat(r["date"][:10]) > week_ago)

    cats = {}
    for e in exps:
        cats.setdefault(e.get("categorie") or "Autre", []).append(e)
    for lst in cats.values():
        lst.sort(key=lambda e: (ORDER.get(e.get("statut"), 9), e.get("id", "")))
    cat_order = sorted(cats, key=lambda c: (min(ORDER.get(e.get("statut"), 9) for e in cats[c]), c))

    recent = []
    for p in sorted((ROOT / "journal").glob("20*.md"))[-8:][::-1]:
        t = p.read_text(encoding="utf-8")
        phrase = re.search(r"\*\*En une phrase\*\*\s*:\s*(.+)", t)
        mm = re.match(r"(\d{4}-\d\d-\d\d)-(\d\d)(\d\d)-(.+)-(\w+)$", p.stem)
        if not mm or not phrase:
            continue
        day, hh, mi, lane, role = mm.groups()
        exp_id = re.search(r"EXP-\d+", lane)
        sujet = by_id.get(exp_id.group(0), {}).get("titre", exp_id.group(0)) if exp_id else "pilotage"
        recent.append({"quand": f"{fr_date(day)} {hh}h{mi}", "sujet": sujet, "role": ROLE_FR.get(role, role),
                       "phrase": phrase.group(1).strip().replace("**", "")})
    pages = count_pages()
    return dict(exps=exps, cats=cats, cat_order=cat_order, revenue=revenue - costs, rev7=rev7, recent=recent, pages=pages)


def cat_summary(name, lst, pages):
    n = len(lst)
    counts = {}
    for e in lst:
        counts[STATUT_FR.get(e.get("statut"), e.get("statut"))] = counts.get(STATUT_FR.get(e.get("statut"), e.get("statut")), 0) + 1
    plur = {"en test": "en test", "en veille": "en veille", "arrêtée": "arrêtées", "réussie": "réussies"}
    etat = ", ".join(f"{v} {plur.get(k, k) if v > 1 else k}" for k, v in counts.items())
    extra = ""
    if name.startswith("Sites web"):
        total, fr, en = pages
        extra = f"{total} pages en ligne ({fr} en français, {en} en anglais)."
    return f"{n} piste{'s' if n > 1 else ''} testée{'s' if n > 1 else ''} : {etat}.", extra


def build_md(d):
    active = [e for e in d["exps"] if e.get("statut") == "active"]
    L = [f"# Où en est 10aday — {now_utc():%d/%m à %Hh%M} (heure UTC)", "",
         "_Généré automatiquement à chaque passage d'agent. Tout est fait par les agents, rien ne t'attend._", "",
         "## En bref",
         f"- **Argent gagné** : {eur(d['revenue'])} au total ({eur(d['rev7'] / 7)} par jour sur 7 jours). Objectif : 10 € par jour.",
         f"- **Pistes** : {len(active)} en test, {len(d['exps']) - len(active)} arrêtées ou en veille, réparties en {len(d['cats'])} catégories.", "",
         "## Ce qu'on a testé, par catégorie"]
    for c in d["cat_order"]:
        lst = d["cats"][c]
        head, extra = cat_summary(c, lst, d["pages"])
        L += ["", f"### {c}", f"{head} {extra}".strip()]
        for e in lst:
            st = STATUT_FR.get(e.get("statut"), e.get("statut"))
            L.append(f"- **{e.get('titre')}** — _{st}_")
            L.append(f"  - Fait : {e.get('deja_fait', '')}")
            L.append(f"  - Résultat : {e.get('resultat', '')}")
            if e.get("statut") != "active" and e.get("verdict"):
                L.append(f"  - Décision : {e['verdict']}")
    L += ["", "## Pistes en test : la suite"]
    for e in active:
        L += [f"- **{e.get('titre')}** : {e.get('prochaine_etape', '')} Décision le {fr_date(e.get('decision_le'))} "
              f"({days_left(e.get('decision_le'))}). On arrête si : {e.get('on_arrete_si', '')}"]
    if not active:
        L.append("- Aucune piste en test.")
    L += ["", "## Derniers passages d'agents"]
    L += [f"- **{r['quand']}** · {r['sujet']} · {r['role']} — {r['phrase']}" for r in d["recent"]] or ["- Rien encore."]
    L.append("")
    return "\n".join(L)


def build_html(d):
    esc = lambda s: html.escape(str(s or ""))
    active = [e for e in d["exps"] if e.get("statut") == "active"]
    cats_html = []
    for c in d["cat_order"]:
        lst = d["cats"][c]
        head, extra = cat_summary(c, lst, d["pages"])
        is_on = any(e.get("statut") == "active" for e in lst)
        items = []
        for e in lst:
            st = e.get("statut", "")
            link = f' · <a href="{esc(e["lien_public"])}">voir</a>' if e.get("lien_public") else ""
            verdict = f'<div class="v">Décision : {esc(e.get("verdict"))}</div>' if st != "active" and e.get("verdict") else ""
            items.append(f"""<li class="{esc(st)}"><div class="t"><b>{esc(e.get('titre'))}</b> <span class="tag {esc(st)}">{esc(STATUT_FR.get(st, st))}</span>{link}</div>
<div><span class="k">Fait</span> {esc(e.get('deja_fait'))}</div>
<div><span class="k">Résultat</span> <b>{esc(e.get('resultat'))}</b></div>{verdict}</li>""")
        cats_html.append(f"""<section class="cat{' on' if is_on else ''}"><h3>{esc(c)}</h3>
<p class="sum">{esc(head)} {esc(extra)}</p><ul>{''.join(items)}</ul></section>""")
    nxt = "".join(f"<li><b>{esc(e.get('titre'))}</b> : {esc(e.get('prochaine_etape'))} <span class='mut'>Décision le "
                  f"{esc(fr_date(e.get('decision_le')))} ({esc(days_left(e.get('decision_le')))}). On arrête si : {esc(e.get('on_arrete_si'))}</span></li>"
                  for e in active) or "<li>Aucune piste en test.</li>"
    recent = "".join(f"<li><span class='mut'>{esc(r['quand'])} · {esc(r['sujet'])} · {esc(r['role'])}</span><br>{esc(r['phrase'])}</li>"
                     for r in d["recent"]) or "<li>Rien encore.</li>"
    return f"""<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>10aday — tableau de bord</title><meta name="robots" content="noindex">
<style>
:root{{--bg:#fafaf9;--fg:#1c1917;--mut:#6b6560;--card:#fff;--bd:#e7e5e4;--acc:#1d4ed8;--ok:#15803d;--off:#9a3412}}
@media (prefers-color-scheme:dark){{:root{{--bg:#1c1917;--fg:#f5f5f4;--mut:#a8a29e;--card:#292524;--bd:#44403c;--acc:#93c5fd;--ok:#4ade80;--off:#fdba74}}}}
body{{font-family:system-ui,sans-serif;background:var(--bg);color:var(--fg);margin:0;padding:1.2rem;line-height:1.5;font-size:16px}}
main{{max-width:780px;margin:auto}} h1{{font-size:1.4rem;margin:.2rem 0}} h2{{font-size:1.15rem;margin-top:2rem}}
.mut{{color:var(--mut);font-size:.85rem}}
.big{{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:.6rem;margin:1rem 0}}
.big div{{background:var(--card);border:1px solid var(--bd);border-radius:10px;padding:.8rem}}
.big b{{display:block;font-size:1.5rem;font-variant-numeric:tabular-nums}}
.cat{{background:var(--card);border:1px solid var(--bd);border-left:4px solid var(--bd);border-radius:10px;padding:.9rem 1rem;margin:.8rem 0}}
.cat.on{{border-left-color:var(--acc)}} .cat h3{{margin:0}} .sum{{margin:.2rem 0 .6rem;color:var(--mut)}}
.cat ul{{list-style:none;padding:0;margin:0}} .cat li{{padding:.6rem 0;border-top:1px solid var(--bd)}}
.cat li.tuee,.cat li.pause{{opacity:.8}}
.k{{display:inline-block;min-width:5.5rem;color:var(--mut);font-size:.9rem}} .v{{color:var(--mut);font-size:.9rem;margin-top:.2rem}}
.tag{{font-size:.75rem;border-radius:99px;padding:.05rem .5rem;border:1px solid var(--bd);margin-left:.3rem}}
.tag.active{{color:var(--acc);border-color:var(--acc)}} .tag.tuee{{color:var(--off)}} .tag.reussie{{color:var(--ok)}}
a{{color:var(--acc)}} li{{margin:.3rem 0}}
</style></head><body><main>
<h1>Où en est 10aday</h1>
<div class="mut">Mis à jour le {now_utc():%d/%m à %Hh%M} (heure UTC). Tout est fait par les agents : rien ne t'attend.</div>
<div class="big">
<div>Argent gagné<b>{eur(d['revenue'])}</b><span class="mut">objectif : 10 € / jour</span></div>
<div>Pistes en test<b>{len(active)}</b><span class="mut">{len(d['exps']) - len(active)} arrêtées ou en veille</span></div>
<div>Catégories testées<b>{len(d['cats'])}</b></div>
<div>Pages web en ligne<b>{d['pages'][0]}</b></div>
</div>
<h2>Ce qu'on a testé, par catégorie</h2>
{''.join(cats_html)}
<h2>Pistes en test : la suite</h2><ul>{nxt}</ul>
<h2>Derniers passages d'agents</h2><ul>{recent}</ul>
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
