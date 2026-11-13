#!/usr/bin/env python3
"""Décide du passage d'agent à lancer à ce tick. Sortie : JSON {hour, launch: [{title, prompt}], skipped}.

Rythme (depuis le 2026-11-13, pour diviser la consommation par ~9) :
  - un tick toutes les 4 h → UN seul agent par tick, soit 6 passages par jour ;
  - le tick de PILOT_HOUR (UTC) lance le pilote (mesure, arbitre, lance/arrête des pistes) ;
  - les autres ticks lancent un opérateur sur UNE piste active, à tour de rôle, pondéré par le champ `poids` de la fiche (défaut 1).
  - aucune piste active : aucun opérateur (le pilote passe déjà chaque jour) ; une seule piste active : 3 opérateurs par jour au lieu de 5.
Un passage dont le verrou (`state/locks/run.lock`) a moins de LOCK_TTL_MIN est encore en cours : le tick est sauté.

Usage : python3 ops/dispatch.py [--hour H]
Réglages : constantes ci-dessous (le pilote peut les changer, en le justifiant dans son journal).
"""
import json
import re
import sys

from lib import ROOT, experiments, lane_busy, now_utc

TICK_EVERY_H = 4      # doit correspondre au cron de la routine (17 */4 * * *)
PILOT_HOUR = 8        # heure UTC du passage quotidien du pilote
# Pilote 2026-11-13 : avec une seule piste active, 5 passages d'opérateur par jour sont trop. On n'en garde que 3 (12 h, 16 h, 20 h UTC).
SINGLE_TRACK_HOURS = (12, 16, 20)


def prompt_template():
    txt = (ROOT / "ops" / "ROUTINE_PROMPT.md").read_text(encoding="utf-8")
    m = re.search(r"^---\n(.*?)\n---\s*$", txt, re.S | re.M)
    if not m:
        sys.exit("ROUTINE_PROMPT.md : bloc entre lignes --- introuvable")
    return m.group(1)


def pick(hour, day_ordinal):
    """Retourne (role, experience ou None)."""
    slot = hour // TICK_EVERY_H
    if slot == PILOT_HOUR // TICK_EVERY_H:
        return "pilote", None
    wheel = []
    for e in experiments():
        if e.get("statut") == "active":
            try:
                w = max(1, min(5, int(e.get("poids", "1"))))
            except ValueError:
                w = 1
            wheel += [e] * w
    if not wheel:
        # aucune piste active : le pilote passe déjà une fois par jour, inutile de le relancer à chaque tick
        return None, None
    if len({e["id"] for e in wheel}) == 1 and slot * TICK_EVERY_H not in SINGLE_TRACK_HOURS:
        return None, None
    slots_per_day = 24 // TICK_EVERY_H
    return "operateur", wheel[(day_ordinal * slots_per_day + slot) % len(wheel)]


def main():
    now = now_utc()
    hour = now.hour
    if "--hour" in sys.argv:
        hour = int(sys.argv[sys.argv.index("--hour") + 1])
    out, skipped = [], []
    if lane_busy("run"):
        skipped.append("un passage est encore en cours")
    else:
        role, exp = pick(hour, now.toordinal())
    if not skipped and role is None:
        skipped.append("créneau économisé : moins de 2 pistes actives")
    elif not skipped:
        exp_txt = f"{exp['id']} — {exp.get('titre', '')} (`{exp['_file']}`)" if exp else "aucune : tu gères tout le portefeuille"
        sujet = exp["id"] if exp else "pilotage"
        prompt = prompt_template().replace("{ROLE}", role).replace("{EXPERIMENT}", exp_txt).replace("{SUJET}", sujet)
        out.append({"title": f"10aday · {role} · {sujet} · {now:%Y-%m-%d %H:%M} UTC", "prompt": prompt})
    print(json.dumps({"hour": hour, "launch": out, "skipped": skipped}, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
