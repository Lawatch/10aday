/*
 * rc-protege.js — Calendrier de la rupture conventionnelle d'un SALARIÉ PROTÉGÉ (délégué syndical, élu du CSE…).
 * Source canonique : products/EXP-001-calculateurs-fr/src/rc-protege.js
 * Copie publiée     : docs/rupture-conventionnelle-salarie-protege/rc-protege.js (identique, vérifié par les tests)
 * Dépend de rc-dates.js (window.RCDates / require) pour la rétractation et les jours fériés.
 *
 * Règles (textes lus sur code.travail.gouv.fr le 2026-11-13) :
 *  - Rétractation : 15 jours calendaires, prorogation samedi/dimanche/férié — C. trav. L1237-13, R1231-1 (comme le cas général).
 *  - Pas d'homologation : autorisation de l'inspecteur du travail — L1237-15 (v. 25/07/2011).
 *    La demande ne peut être transmise qu'à l'issue du délai de rétractation (fiche du ministère du Travail
 *    « La rupture conventionnelle du CDI », rubrique salariés protégés ; circulaire DGT n° 2008-11 du 22/07/2008).
 *  - Décision dans un délai de 2 mois à compter de la réception de la demande ; silence de plus de 2 mois = rejet
 *    — R2421-4 (délégués syndicaux…) et R2421-11 (membres du CSE…), v. 01/01/2018.
 *    Délai en mois, de quantième à quantième (fin de mois → dernier jour du mois). Pas de report week-end :
 *    R1231-1 ne vise que le titre III du livre II de la 1re partie (choix prudent : date la plus tôt).
 *  - Rupture au plus tôt le lendemain du jour de l'autorisation — L1237-15 al. 2.
 *  - Recours hiérarchique contre la décision : 2 mois à compter de la notification ; silence du ministre 4 mois = rejet — R2422-1.
 */
(function (root) {
  'use strict';
  var R = (typeof module === 'object' && module.exports) ? require('./rc-dates.js') : root.RCDates;
  var addDays = R.addDays, parseISO = R.parseISO, ymd = R.ymd;

  function toDate(v, label) {
    if (v === undefined || v === null || v === '') return null;
    var d = typeof v === 'string' ? parseISO(v) : v;
    if (!d) throw new Error('Date invalide : ' + label);
    return d;
  }
  // Ajoute n mois de quantième à quantième ; si le jour n'existe pas, dernier jour du mois.
  function addMonths(date, n) {
    var y = date.getUTCFullYear(), m = date.getUTCMonth() + n, d = date.getUTCDate();
    y += Math.floor(m / 12); m = ((m % 12) + 12) % 12;
    var last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    return ymd(y, m + 1, Math.min(d, last));
  }
  function days(a, b) { return Math.round((b.getTime() - a.getTime()) / 86400000); }

  /**
   * calc(signature, options)
   *  options.reception    : réception de la demande par l'inspection (défaut : 1er jour possible d'envoi)
   *  options.autorisation : date de l'autorisation, si elle est connue
   *  options.convenue     : date de rupture prévue dans la convention
   *  options.refus        : date de notification d'un refus (pour le délai de recours)
   *  options.alsaceMoselle: booléen
   */
  function calc(signature, options) {
    options = options || {};
    var base = R.calc(signature, { alsaceMoselle: !!options.alsaceMoselle });
    var rec = toDate(options.reception, 'réception de la demande');
    var aut = toDate(options.autorisation, 'autorisation');
    var conv = toDate(options.convenue, 'date de rupture prévue');
    var refus = toDate(options.refus, 'notification du refus');
    var alertes = [];

    var receptionParDefaut = !rec;
    if (!rec) rec = base.envoi_au_plus_tot;
    if (rec.getTime() < base.envoi_au_plus_tot.getTime()) {
      alertes.push('La demande est arrivée avant la fin du délai de rétractation. Elle ne pouvait être envoyée qu’à partir du ' +
        R.formatFR(base.envoi_au_plus_tot) + '. L’inspecteur peut la rejeter : renseignez-vous avant d’aller plus loin.');
    }
    var limite = addMonths(rec, 2);
    var refusImplicite = addDays(limite, 1);
    var departSiAutoriseLeDernierJour = addDays(limite, 1);

    var rupture = null;
    if (aut) {
      if (aut.getTime() < rec.getTime()) throw new Error('L’autorisation ne peut pas être antérieure à la réception de la demande.');
      if (aut.getTime() > limite.getTime()) alertes.push('Cette date d’autorisation tombe après le délai de 2 mois. Normalement, le silence a déjà valu refus : vérifiez la date avec l’inspection du travail.');
      rupture = addDays(aut, 1);
      if (conv && conv.getTime() > rupture.getTime()) rupture = conv;
      if (conv && conv.getTime() < addDays(aut, 1).getTime()) alertes.push('La date prévue dans la convention (' + R.formatFR(conv) + ') tombe avant le lendemain de l’autorisation. Le contrat ne peut s’arrêter que le ' + R.formatFR(addDays(aut, 1)) + ' au plus tôt.');
    } else if (conv && conv.getTime() <= limite.getTime()) {
      alertes.push('La date prévue dans la convention (' + R.formatFR(conv) + ') tombe avant la fin du délai de réponse de l’inspecteur. Si l’autorisation arrive tard, le départ sera décalé au lendemain de l’autorisation.');
    }

    var recoursLimite = refus ? addMonths(refus, 2) : null;

    return {
      signature: base.signature,
      fin_retractation: base.fin_retractation,
      retractation_reports: base.retractation_reports,
      envoi_au_plus_tot: base.envoi_au_plus_tot,
      reception: rec,
      reception_par_defaut: receptionParDefaut,
      limite_decision: limite,
      refus_implicite: refusImplicite,
      depart_si_autorise_le_dernier_jour: departSiAutoriseLeDernierJour,
      duree_max_jours: days(base.signature, departSiAutoriseLeDernierJour),
      autorisation: aut,
      rupture: rupture,
      convenue: conv,
      refus: refus,
      recours_limite: recoursLimite,
      alertes: alertes
    };
  }

  function toICS(r) {
    var ev = [
      { date: r.fin_retractation, titre: 'Fin du délai de rétractation (rupture conventionnelle)', description: 'Dernier jour pour se rétracter (L1237-13). Envoi de la demande à l’inspecteur à partir du lendemain.' },
      { date: r.envoi_au_plus_tot, titre: 'Envoi possible de la demande d’autorisation à l’inspecteur du travail', description: 'Cerfa 14599, par courrier ou sur mesdemarches.travail.gouv.fr (L1237-15).' },
      { date: r.limite_decision, titre: 'Dernier jour de réponse de l’inspecteur du travail', description: 'Sans réponse à cette date, la demande est refusée (R2421-4 / R2421-11).' }
    ];
    if (r.rupture) ev.push({ date: r.rupture, titre: 'Fin du contrat (rupture conventionnelle)', description: 'Au plus tôt le lendemain de l’autorisation (L1237-15).' });
    if (r.recours_limite) ev.push({ date: r.recours_limite, titre: 'Dernier jour pour le recours auprès du ministre du Travail', description: '2 mois après la notification du refus (R2422-1).' });
    return R.toICS(ev).replace('Rupture conventionnelle dates', 'Rupture conventionnelle salarie protege');
  }

  var api = { calc: calc, addMonths: addMonths, toICS: toICS, formatFR: R.formatFR, iso: R.iso, parseISO: parseISO };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.RCProtege = api;
})(this);
