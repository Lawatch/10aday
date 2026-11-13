"""Utilitaires partagés : lecture des expériences, des verrous, du ledger. Bibliothèque standard uniquement."""
import csv
import datetime as dt
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
EXP_DIR = ROOT / "state" / "experiments"
LOCK_DIR = ROOT / "state" / "locks"
LOCK_TTL_MIN = 180


def now_utc():
    return dt.datetime.now(dt.timezone.utc)


def parse_front_matter(text):
    """Lit un en-tête `---` / `clé: valeur` / `---`. Retourne {} s'il n'y en a pas."""
    m = re.match(r"^---\n(.*?)\n---\n", text, re.S)
    if not m:
        return {}
    meta = {}
    for line in m.group(1).splitlines():
        if ":" in line and not line.lstrip().startswith("#"):
            k, v = line.split(":", 1)
            meta[k.strip()] = v.strip()
    return meta


def experiments():
    out = []
    for p in sorted(EXP_DIR.glob("EXP-*.md")):
        meta = parse_front_matter(p.read_text(encoding="utf-8"))
        if not meta:
            meta = {"id": p.stem[:7], "titre": p.stem, "statut": "inconnu (en-tête manquant)"}
        meta["_file"] = str(p.relative_to(ROOT))
        out.append(meta)
    return out


def lock_age_min(lane):
    """Âge du verrou du couloir en minutes, ou None si libre/illisible."""
    f = LOCK_DIR / f"{lane}.lock"
    if not f.exists():
        return None
    txt = f.read_text(encoding="utf-8").strip()
    m = re.match(r"(\d{4}-\d\d-\d\dT\d\d:\d\d)Z", txt)
    if not m:
        return None
    t = dt.datetime.strptime(m.group(1), "%Y-%m-%dT%H:%M").replace(tzinfo=dt.timezone.utc)
    return (now_utc() - t).total_seconds() / 60


def lane_busy(lane):
    age = lock_age_min(lane)
    return age is not None and age < LOCK_TTL_MIN


def ledger_rows():
    p = ROOT / "state" / "ledger.csv"
    if not p.exists():
        return []
    with p.open(encoding="utf-8") as f:
        return list(csv.DictReader(f))


def to_float(x):
    try:
        return float(str(x).replace(",", ".").replace("€", "").strip() or 0)
    except ValueError:
        return 0.0
