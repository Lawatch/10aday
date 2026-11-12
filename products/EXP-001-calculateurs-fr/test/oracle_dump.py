"""Génère les sorties de l'oracle Python pour une plage de dates (utilisé par test/rc-dates.test.js)."""
import sys, json, datetime as d, os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'reference'))
from rc_dates import calc
out = []
start = d.date(2015, 1, 1)
for i in range((d.date(2032, 12, 31) - start).days + 1):
    s = start + d.timedelta(i)
    for r in (None, s + d.timedelta(16 + i % 9)):  # réception par défaut, puis une réception décalée variable
        res = calc(s, r)
        out.append({'signature': s.isoformat(), 'reception': r.isoformat() if r else None,
                    **{k: v.isoformat() for k, v in res.items()}})
json.dump(out, sys.stdout)
