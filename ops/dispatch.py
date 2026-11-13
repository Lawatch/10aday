#!/usr/bin/env python3
"""Calcule les passages d'agents à lancer à ce tick. Sortie : JSON [{lane, role, experiment, title, prompt}].

Couloirs :
  - pilotage    : toutes les 3 h (strategist aux heures multiples de 6, analyst sinon)
  - exploration : toutes les 2 h (scout, heures impaires)
  - exp-<ID>    : chaque heure, un agent par expérience `statut: active` (rôle = `prochain_role`)
Un couloir dont le verrou a moins de 50 min est sauté (l'agent précédent travaille encore).

Usage : python3 ops/dispatch.py [--hour H]
Réglages : modifier les constantes ci-dessous (réservé au stratège, avec justification dans le journal).
"""
import json
import re
import sys

from lib import ROOT, experiments, lane_busy, now_utc

MAX_PARALLEL = 5          # plafond de sessions lancées par tick (protège le quota)
PILOTAGE_EVERY_H = 3
EXPLORATION_EVERY_H = 2
VALID_EXP_ROLES = {"builder", "growth", "analyst", "scout"}
# Cadence réduite pour une expérience bloquée (heures entre deux passages ; défaut 1).
# 2026-11-13 strategist : EXP-005 attend la clé (HQ-011), ses passages horaires ne produisent rien → toutes les 3 h.
EXP_EVERY_H = {"EXP-005": 3}


def prompt_template():
    txt = (ROOT / "ops" / "ROUTINE_PROMPT.md").read_text(encoding="utf-8")
    m = re.search(r"^---\n(.*?)\n---\s*$", txt, re.S | re.M)
    if not m:
        sys.exit("ROUTINE_PROMPT.md : bloc entre lignes --- introuvable")
    return m.group(1)


def plan(hour):
    jobs = []
    if hour % PILOTAGE_EVERY_H == 0:
        jobs.append(("pilotage", "strategist" if hour % 6 == 0 else "analyst", None))
    for e in experiments():
        if e.get("statut") == "active" and hour % EXP_EVERY_H.get(e["id"], 1) == 0:
            role = e.get("prochain_role", "builder")
            jobs.append((f"exp-{e['id']}", role if role in VALID_EXP_ROLES else "builder", e))
    if hour % EXPLORATION_EVERY_H == 1:
        jobs.append(("exploration", "scout", None))
    return jobs


def main():
    hour = now_utc().hour
    if "--hour" in sys.argv:
        hour = int(sys.argv[sys.argv.index("--hour") + 1])
    tpl = prompt_template()
    stamp = now_utc().strftime("%Y-%m-%d %H:%M UTC")
    out, skipped = [], []
    for lane, role, exp in plan(hour):
        if lane_busy(lane):
            skipped.append(lane)
            continue
        if len(out) >= MAX_PARALLEL:
            skipped.append(lane + " (plafond)")
            continue
        exp_txt = f"{exp['id']} — {exp.get('titre', '')} (`{exp['_file']}`)" if exp else "aucune (couloir transverse)"
        prompt = tpl.replace("{LANE}", lane).replace("{ROLE}", role).replace("{EXPERIMENT}", exp_txt)
        out.append({
            "lane": lane, "role": role, "experiment": exp["id"] if exp else None,
            "title": f"10aday · {lane} · {role} · {stamp}", "prompt": prompt,
        })
    print(json.dumps({"hour": hour, "launch": out, "skipped": skipped}, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
