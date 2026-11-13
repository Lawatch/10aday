/*
 * delais-contestation.js — Dates limites pour contester après la fin d'un CDI (rupture conventionnelle surtout).
 * Source canonique : products/EXP-001-calculateurs-fr/src/delais-contestation.js
 * Copie publiée     : docs/delais-contestation-rupture/delais-contestation.js (doit rester identique, vérifié par les tests)
 *
 * Règles (textes lus le 2026-11-13 sur code.travail.gouv.fr) :
 *  - Rupture conventionnelle : recours « avant l'expiration d'un délai de douze mois à compter de la date
 *    d'homologation de la convention », à peine d'irrecevabilité — C. trav. art. L1237-14 al. 4.
 *  - Reçu pour solde de tout compte : dénonciation « dans les six mois qui suivent sa signature » ;
 *    au-delà, libératoire pour les sommes qui y sont mentionnées — C. trav. art. L1234-20.
 *  - Salaires (rappels, heures supplémentaires, primes) : 3 ans à compter du jour où l'on a connu ou aurait dû
 *    connaître les faits ; contrat rompu → sommes des 3 années précédant la rupture — C. trav. art. L3245-1.
 *  - Exécution du contrat : 2 ans à compter de la connaissance des faits — C. trav. art. L1471-1 al. 1.
 *    Rupture (hors délais plus courts : RC = L1237-14) : 12 mois à compter de la notification — L1471-1 al. 2.
 *  - Discrimination : 5 ans à compter de la révélation — C. trav. art. L1134-5.
 *    Harcèlement (L1152-1, L1153-1 exclus de L1471-1) : droit commun, 5 ans — C. civ. art. 2224.
 * Calcul « de date à date » : un délai en mois expire le jour du dernier mois qui porte le même quantième que le
 * point de départ ; à défaut (31 → mois de 30 jours, 29 février), le dernier jour du mois (C. proc. civ. art. 641).
 * On n'applique PAS de report week-end / férié : on affiche la date la plus prudente.
 * Aucune dépendance. Navigateur : window.DelaisContestation ; Node : module.exports.
 */
(function (root) {
  'use strict';
  var DAY = 86400000;
  function ymd(y, m, d) { return new Date(Date.UTC(y, m - 1, d)); }
  function iso(date) { return date.toISOString().slice(0, 10); }
  function parseISO(s) {
    if (s instanceof Date) return isNaN(s) ? null : s;
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || '').trim());
    if (!m) return null;
    var d = ymd(+m[1], +m[2], +m[3]);
    return iso(d) === m[0] ? d : null;
  }
  function daysInMonth(y, m) { return new Date(Date.UTC(y, m, 0)).getUTCDate(); } // m : 1-12
  // Ajoute n mois « de date à date » (même quantième, sinon dernier jour du mois).
  function addMonths(date, n) {
    var y = date.getUTCFullYear(), m = date.getUTCMonth() + 1 + n;
    y += Math.floor((m - 1) / 12); m = ((m - 1) % 12 + 12) % 12 + 1;
    return ymd(y, m, Math.min(date.getUTCDate(), daysInMonth(y, m)));
  }
  function diffDays(a, b) { return Math.round((b.getTime() - a.getTime()) / DAY); }

  var JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  var MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  function formatFR(date) {
    var d = date.getUTCDate();
    return JOURS[date.getUTCDay()] + ' ' + (d === 1 ? '1er' : d) + ' ' + MOIS[date.getUTCMonth()] + ' ' + date.getUTCFullYear();
  }

  function delai(id, titre, depart, mois, texte, explication) {
    return { id: id, titre: titre, depart: depart, mois: mois, limite: addMonths(depart, mois), texte: texte, explication: explication };
  }

  /**
   * calc(o)
   *  o.fin          : date de fin du contrat (obligatoire)
   *  o.homologation : date d'homologation de la rupture conventionnelle (facultatif ; RC seulement)
   *  o.stc          : date de signature du reçu pour solde de tout compte (facultatif)
   *  o.connaissance : date où vous avez découvert le problème (facultatif, défaut : fin du contrat)
   *  o.aujourdhui   : date du jour (défaut : maintenant) — pour « jours restants »
   */
  function calc(o) {
    o = o || {};
    var fin = parseISO(o.fin);
    if (!fin) throw new Error('Indiquez une date de fin de contrat valide.');
    var hom = o.homologation ? parseISO(o.homologation) : null;
    if (o.homologation && !hom) throw new Error("Date d'homologation invalide.");
    var stc = o.stc ? parseISO(o.stc) : null;
    if (o.stc && !stc) throw new Error('Date de signature du solde de tout compte invalide.');
    var con = o.connaissance ? parseISO(o.connaissance) : null;
    if (o.connaissance && !con) throw new Error('Date de découverte invalide.');
    var today = o.aujourdhui ? parseISO(o.aujourdhui) : null;
    if (!today) { var n = new Date(); today = ymd(n.getFullYear(), n.getMonth() + 1, n.getDate()); }

    var alertes = [];
    if (hom && hom.getTime() >= fin.getTime()) alertes.push("La date d'homologation devrait être antérieure à la fin du contrat (la rupture a lieu au plus tôt le lendemain de l'homologation).");
    if (stc && stc.getTime() < fin.getTime()) alertes.push('Le solde de tout compte est en principe signé le jour du départ ou après : vérifiez la date saisie.');
    var connaissanceParDefaut = !con;
    if (!con) con = fin;

    var liste = [];
    if (hom) liste.push(delai('rc', 'Contester la rupture conventionnelle', hom, 12, 'C. trav. art. L1237-14',
      "Pour demander l'annulation de la convention (consentement forcé, erreur, pression…) ou contester l'homologation, devant le conseil de prud'hommes. Le délai court à partir de l'homologation, même tacite."));
    if (stc) liste.push(delai('stc', 'Dénoncer le reçu pour solde de tout compte', stc, 6, 'C. trav. art. L1234-20',
      "Pour remettre en cause une somme inscrite sur le reçu signé. Lettre recommandée à l'employeur. Passé ce délai, vous ne pouvez plus réclamer ces sommes-là ; les sommes absentes du reçu restent soumises aux délais ci-dessous."));
    liste.push(delai('salaire', 'Réclamer des salaires impayés', con, 36, 'C. trav. art. L3245-1',
      'Heures supplémentaires, primes, rappels de salaire, congés payés. Vous pouvez réclamer les sommes dues sur les 3 années précédant la fin du contrat.'));
    liste.push(delai('execution', 'Agir sur un problème pendant le contrat', con, 24, 'C. trav. art. L1471-1',
      'Par exemple : manquement à la sécurité, absence de formation, mauvaise classification. Hors salaires, discrimination et harcèlement.'));
    liste.push(delai('discrimination', 'Agir pour discrimination ou harcèlement', con, 60, 'C. trav. art. L1134-5 ; C. civ. art. 2224',
      "Discrimination : 5 ans à partir de sa révélation. Harcèlement moral ou sexuel : 5 ans (droit commun), généralement à partir du dernier fait."));

    liste.forEach(function (d) {
      d.jours_restants = diffDays(today, d.limite);
      d.depasse = d.jours_restants < 0;
      d.week_end = d.limite.getUTCDay() === 0 || d.limite.getUTCDay() === 6;
    });
    var ouverts = liste.filter(function (d) { return !d.depasse; }).sort(function (a, b) { return a.limite - b.limite; });

    return {
      fin: fin, homologation: hom, stc: stc, connaissance: con, connaissance_par_defaut: connaissanceParDefaut,
      aujourdhui: today, delais: liste, prochain: ouverts[0] || null,
      salaires_depuis: addMonths(fin, -36), alertes: alertes
    };
  }

  function toICS(delais) {
    var pad = function (s) { return s.replace(/-/g, ''); };
    var esc = function (s) { return String(s).replace(/[\\;,]/g, function (c) { return '\\' + c; }).replace(/\n/g, '\\n'); };
    var lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//10aday//Delais de contestation//FR', 'CALSCALE:GREGORIAN'];
    delais.forEach(function (d) {
      var rappel = addMonths(d.limite, -1);
      lines.push('BEGIN:VEVENT', 'UID:delai-' + d.id + '-' + pad(iso(d.limite)) + '@10aday', 'DTSTAMP:20260101T000000Z',
        'DTSTART;VALUE=DATE:' + pad(iso(rappel)), 'DTEND;VALUE=DATE:' + pad(iso(new Date(rappel.getTime() + DAY))),
        'SUMMARY:' + esc('Dans 1 mois : fin du délai « ' + d.titre + ' » (' + iso(d.limite) + ')'),
        'DESCRIPTION:' + esc(d.texte + ' — date limite indicative, vérifiez avec un conseil.'), 'END:VEVENT');
    });
    lines.push('END:VCALENDAR');
    return lines.join('\r\n') + '\r\n';
  }

  var api = { calc: calc, addMonths: addMonths, parseISO: parseISO, iso: iso, ymd: ymd, formatFR: formatFR, toICS: toICS };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.DelaisContestation = api;
})(this);
