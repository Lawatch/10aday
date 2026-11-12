/*
 * rc-dates.js — Calendrier de la rupture conventionnelle (CDI, salarié non protégé, droit privé).
 * Source canonique : products/EXP-001-calculateurs-fr/src/rc-dates.js
 * Copie publiée     : docs/rupture-conventionnelle-dates/rc-dates.js (doit rester identique, vérifié par les tests)
 * Oracle            : products/EXP-001-calculateurs-fr/reference/rc_dates.py
 *
 * Règles (sources vérifiées le 2026-11-12, cf. state/experiments/EXP-001-calculateurs-fr.md) :
 *  - Rétractation : 15 jours calendaires à compter du lendemain de la signature — C. trav. art. L1237-13.
 *  - Délai expirant un samedi, dimanche ou jour férié : prorogé au 1er jour ouvrable suivant — C. trav. art. R1231-1.
 *  - Instruction : 15 jours ouvrables à compter du lendemain de la réception de la demande — C. trav. art. L1237-14.
 *    Jours ouvrables = tous les jours sauf dimanche et jours fériés.
 *  - Rupture : au plus tôt le lendemain de l'homologation — C. trav. art. L1237-13 al. 3.
 *  - Jours fériés légaux — C. trav. art. L3133-1 ; Alsace-Moselle (Vendredi saint, 26 déc.) — C. trav. art. L3134-13.
 * Aucune dépendance. Fonctionne dans le navigateur (window.RCDates) et sous Node (module.exports).
 */
(function (root) {
  'use strict';
  var DAY = 86400000;

  // Dates manipulées en UTC minuit pour éviter tout effet de changement d'heure.
  function ymd(y, m, d) { return new Date(Date.UTC(y, m - 1, d)); }
  function addDays(date, n) { return new Date(date.getTime() + n * DAY); }
  function iso(date) { return date.toISOString().slice(0, 10); }
  function parseISO(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || '').trim());
    if (!m) return null;
    var d = ymd(+m[1], +m[2], +m[3]);
    return iso(d) === m[0] ? d : null; // rejette le 31/02 etc.
  }

  // Dimanche de Pâques (algorithme grégorien anonyme / Meeus-Jones-Butcher).
  function easter(y) {
    var a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4;
    var f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
    var h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4;
    var l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
    var month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
    return ymd(y, month, day);
  }

  var cache = {};
  // Renvoie { 'AAAA-MM-JJ': 'libellé' } des jours fériés de l'année y.
  function holidays(y, alsaceMoselle) {
    var key = y + (alsaceMoselle ? 'am' : '');
    if (cache[key]) return cache[key];
    var p = easter(y), h = {};
    h[iso(ymd(y, 1, 1))] = 'Jour de l’an';
    h[iso(addDays(p, 1))] = 'Lundi de Pâques';
    h[iso(ymd(y, 5, 1))] = 'Fête du Travail';
    h[iso(ymd(y, 5, 8))] = 'Victoire 1945';
    h[iso(addDays(p, 39))] = 'Ascension';
    h[iso(addDays(p, 50))] = 'Lundi de Pentecôte';
    h[iso(ymd(y, 7, 14))] = 'Fête nationale';
    h[iso(ymd(y, 8, 15))] = 'Assomption';
    h[iso(ymd(y, 11, 1))] = 'Toussaint';
    h[iso(ymd(y, 11, 11))] = 'Armistice 1918';
    h[iso(ymd(y, 12, 25))] = 'Noël';
    if (alsaceMoselle) {
      h[iso(addDays(p, -2))] = 'Vendredi saint (Alsace-Moselle)';
      h[iso(ymd(y, 12, 26))] = 'Saint-Étienne (Alsace-Moselle)';
    }
    return (cache[key] = h);
  }
  function holidayName(date, am) { return holidays(date.getUTCFullYear(), am)[iso(date)] || null; }
  function isSunday(date) { return date.getUTCDay() === 0; }
  function isSaturday(date) { return date.getUTCDay() === 6; }

  // R1231-1 : report au premier jour ouvrable suivant si samedi, dimanche ou férié.
  function prorogate(date, am, skipped) {
    while (isSaturday(date) || isSunday(date) || holidayName(date, am)) {
      if (skipped) skipped.push(describeSkip(date, am));
      date = addDays(date, 1);
    }
    return date;
  }
  function describeSkip(date, am) {
    return { date: iso(date), raison: holidayName(date, am) || (isSunday(date) ? 'dimanche' : 'samedi') };
  }

  /**
   * calc(signature, options)
   *  signature : Date (UTC minuit) ou 'AAAA-MM-JJ'
   *  options.reception : date de réception de la demande par la DREETS (défaut : lendemain de la fin de rétractation)
   *  options.alsaceMoselle : booléen
   */
  function calc(signature, options) {
    options = options || {};
    var am = !!options.alsaceMoselle;
    var sign = typeof signature === 'string' ? parseISO(signature) : signature;
    if (!sign) throw new Error('Date de signature invalide');

    var retrBrute = addDays(sign, 15);
    var retrReports = [];
    var finRetr = prorogate(retrBrute, am, retrReports);
    var envoi = addDays(finRetr, 1);

    var rec = options.reception ? (typeof options.reception === 'string' ? parseISO(options.reception) : options.reception) : null;
    if (options.reception && !rec) throw new Error('Date de réception invalide');
    var receptionParDefaut = !rec;
    if (!rec) rec = envoi;
    var receptionTropTot = rec.getTime() <= finRetr.getTime();

    // L1237-14 : 15 jours ouvrables (hors dimanches et fériés) à partir du lendemain de la réception.
    var x = rec, n = 0, exclus = [];
    while (n < 15) {
      x = addDays(x, 1);
      if (!isSunday(x) && !holidayName(x, am)) n++;
      else if (holidayName(x, am)) exclus.push(describeSkip(x, am));
    }
    var instrBrute = x;
    var instrReports = [];
    var finInstr = prorogate(instrBrute, am, instrReports);

    return {
      signature: sign,
      fin_retractation_brute: retrBrute,
      fin_retractation: finRetr,
      retractation_reports: retrReports,
      envoi_au_plus_tot: envoi,
      reception: rec,
      reception_par_defaut: receptionParDefaut,
      reception_trop_tot: receptionTropTot,
      feries_exclus_instruction: exclus,
      fin_instruction_brute: instrBrute,
      fin_instruction: finInstr,
      instruction_reports: instrReports,
      rupture_au_plus_tot: addDays(finInstr, 1),
      rupture_au_plus_tot_brute: addDays(instrBrute, 1)
    };
  }

  var JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  var MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  function formatFR(date) {
    var d = date.getUTCDate();
    return JOURS[date.getUTCDay()] + ' ' + (d === 1 ? '1er' : d) + ' ' + MOIS[date.getUTCMonth()] + ' ' + date.getUTCFullYear();
  }

  // Export iCalendar (.ics) : événements « journée entière ».
  function toICS(events, stamp) {
    var pad = function (s) { return s.replace(/-/g, ''); };
    var esc = function (s) { return String(s).replace(/[\;,]/g, function (c) { return '\\' + c; }).replace(/\n/g, '\\n'); };
    var lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//10aday//Rupture conventionnelle dates//FR', 'CALSCALE:GREGORIAN'];
    events.forEach(function (ev, i) {
      lines.push('BEGIN:VEVENT',
        'UID:rc-' + pad(iso(ev.date)) + '-' + i + '@10aday',
        'DTSTAMP:' + (stamp || '20260101T000000Z'),
        'DTSTART;VALUE=DATE:' + pad(iso(ev.date)),
        'DTEND;VALUE=DATE:' + pad(iso(addDays(ev.date, 1))),
        'SUMMARY:' + esc(ev.titre),
        'DESCRIPTION:' + esc(ev.description || ''),
        'END:VEVENT');
    });
    lines.push('END:VCALENDAR');
    return lines.join('\r\n') + '\r\n';
  }

  var api = { calc: calc, easter: easter, holidays: holidays, holidayName: holidayName, parseISO: parseISO,
              iso: iso, addDays: addDays, ymd: ymd, formatFR: formatFR, toICS: toICS };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.RCDates = api;
})(this);
