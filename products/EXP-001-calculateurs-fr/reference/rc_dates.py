"""Implémentation de RÉFÉRENCE (scout, 2026-11-12) du calendrier de rupture conventionnelle (CDI, droit privé).
Sert d'oracle pour les tests du calculateur JS. Règles et sources : state/experiments/EXP-001-calculateurs-fr.md.
Usage : python3 rc_dates.py  (affiche les cas de test)
"""
import datetime as d
D=d.timedelta
def easter(y):
    a=y%19;b=y//100;c=y%100;dd=b//4;e=b%4;f=(b+8)//25;g=(b-f+1)//3;h=(19*a+b-dd-g+15)%30
    i=c//4;k=c%4;l=(32+2*e+2*i-h-k)%7;m=(a+11*h+22*l)//451;mo=(h+l-7*m+114)//31;da=(h+l-7*m+114)%31+1
    return d.date(y,mo,da)
def feries(y):
    p=easter(y)
    return {d.date(y,1,1),p+D(1),d.date(y,5,1),d.date(y,5,8),p+D(39),p+D(50),d.date(y,7,14),d.date(y,8,15),d.date(y,11,1),d.date(y,11,11),d.date(y,12,25)}
def ferie(x): return x in feries(x.year)
def proroge(x):
    while x.weekday()>=5 or ferie(x): x+=D(1)
    return x
def calc(sign, reception=None):
    fin_retr=proroge(sign+D(15))
    envoi=fin_retr+D(1)
    rec=reception or envoi
    x=rec;n=0
    while n<15:
        x+=D(1)
        if x.weekday()!=6 and not ferie(x): n+=1
    fin_instr=proroge(x)
    return dict(fin_retractation=fin_retr,envoi_au_plus_tot=envoi,reception=rec,fin_instruction_brute=x,fin_instruction=fin_instr,rupture_au_plus_tot=fin_instr+D(1))

if __name__ == "__main__":
    CAS = [  # (signature, réception DREETS ou None = lendemain de fin de rétractation)
        (d.date(2015, 2, 26), d.date(2015, 3, 15)),  # exemple DREETS Normandie (calendrier 2015)
        (d.date(2026, 11, 2), None),
        (d.date(2026, 10, 17), None),  # prorogation rétractation (1er nov. dimanche férié) + 11 nov. + fin un samedi
        (d.date(2026, 4, 21), None),   # 8 mai, Ascension, lundi de Pentecôte dans l'instruction
    ]
    for s, r in CAS:
        print(s, {k: f"{v} {v.strftime('%a')}" for k, v in calc(s, r).items()})
