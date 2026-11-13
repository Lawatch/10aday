/*
 * portabilite-mutuelle.js — Jusqu'à quand la mutuelle (et la prévoyance) d'entreprise reste gratuite après une
 * rupture conventionnelle ou un licenciement, puis jusqu'à quand demander à la garder à titre individuel.
 * Source canonique : products/EXP-001-calculateurs-fr/src/portabilite-mutuelle.js
 * Copie publiée     : docs/mutuelle-apres-rupture-conventionnelle/portabilite-mutuelle.js (identique, vérifié par les tests)
 *
 * Règles (textes lus sur Légifrance le 2026-11-13) :
 *  - Portabilité : Code de la sécurité sociale, art. L911-8 (LEGIARTI000027549338, en vigueur depuis le 17/06/2013).
 *    Maintien gratuit en cas de cessation du contrat non consécutive à une faute lourde ouvrant droit au chômage,
 *    « à compter de la date de cessation du contrat de travail », pendant la période d'indemnisation chômage,
 *    « dans la limite de la durée du dernier contrat de travail » (ou des derniers contrats consécutifs chez le même
 *    employeur), durée « appréciée en mois, le cas échéant arrondie au nombre supérieur, sans pouvoir excéder douze mois ».
 *    S'applique aussi aux ayants droit couverts à la date de cessation.
 *  - Après la portabilité (frais de santé) : loi n° 89-1009 du 31/12/1989 (« loi Évin »), art. 4
 *    (LEGIARTI000027563147, en vigueur depuis le 01/01/2014) : demande de l'ancien salarié privé d'emploi et
 *    bénéficiaire d'un revenu de remplacement « dans les six mois suivant l'expiration de la période durant laquelle
 *    ils bénéficient à titre temporaire du maintien » ; l'assureur adresse sa proposition au plus tard dans les deux
 *    mois à compter de la fin de cette période ; garantie au plus tard le lendemain de la demande, sans questionnaire médical.
 *  - Tarifs du contrat individuel : décret n° 2017-372 du 21/03/2017 (contrats ou adhésions depuis le 01/07/2017) :
 *    1re année ≤ tarif global des actifs ; 2e année ≤ +25 % ; 3e année ≤ +50 %.
 * Calcul « de date à date » : n mois après le 31 → dernier jour du mois si besoin (même convention que delais-contestation.js).
 * Aucune dépendance. Navigateur : window.PortabiliteMutuelle ; Node : module.exports.
 */
(function (root) {
  'use strict';
  var DAY = 86400000;
  var PLAFOND_MOIS = 12; // CSS art. L911-8 1°, « sans pouvoir excéder douze mois » (lu le 2026-11-13)
  var DELAI_EVIN_MOIS = 6; // Loi 89-1009 art. 4 1° (lu le 2026-11-13)
  var DELAI_PROPOSITION_MOIS = 2; // idem, proposition de l'assureur
  function ymd(y, m, d) { return new Date(Date.UTC(y, m - 1, d)); }
  function iso(date) { return date.toISOString().slice(0, 10); }
  function parseISO(s) {
    if (s instanceof Date) return isNaN(s) ? null : s;
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || '').trim());
    if (!m) return null;
    var d = ymd(+m[1], +m[2], +m[3]);
    return iso(d) === m[0] ? d : null;
  }
  function daysInMonth(y, m) { return new Date(Date.UTC(y, m, 0)).getUTCDate(); }
  function addMonths(date, n) {
    var y = date.getUTCFullYear(), m = date.getUTCMonth() + 1 + n;
    y += Math.floor((m - 1) / 12); m = ((m - 1) % 12 + 12) % 12 + 1;
    return ymd(y, m, Math.min(date.getUTCDate(), daysInMonth(y, m)));
  }
  function addDays(date, n) { return new Date(date.getTime() + n * DAY); }
  function diffDays(a, b) { return Math.round((b.getTime() - a.getTime()) / DAY); }

  var JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  var MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  function formatFR(date) {
    var d = date.getUTCDate();
    return JOURS[date.getUTCDay()] + ' ' + (d === 1 ? '1er' : d) + ' ' + MOIS[date.getUTCMonth()] + ' ' + date.getUTCFullYear();
  }

  /**
   * Durée du contrat (entrée → fin incluse) en mois entiers et jours, puis arrondie au mois supérieur.
   * Ex. 01/01 → 04/05 = 4 mois et 4 jours → 5 mois.
   */
  function dureeContrat(entree, fin) {
    var lendemain = addDays(fin, 1);
    var mois = 0;
    while (addMonths(entree, mois + 1).getTime() <= lendemain.getTime()) mois++;
    var jours = diffDays(addMonths(entree, mois), lendemain);
    return { mois: mois, jours: jours, arrondi: mois + (jours > 0 ? 1 : 0) };
  }

  /**
   * calc(o)
   *  o.entree    : date d'entrée dans l'entreprise (début du dernier contrat, ou du premier de contrats qui se suivent
   *                sans interruption chez le même employeur) — obligatoire
   *  o.fin       : dernier jour du contrat (date de rupture) — obligatoire
   *  o.arret     : date où le chômage s'arrête (reprise d'un emploi, fin des droits) — facultatif
   *  o.aujourdhui: date du jour — pour « jours restants »
   */
  function calc(o) {
    o = o || {};
    var entree = parseISO(o.entree);
    if (!entree) throw new Error("Indiquez une date d'entrée dans l'entreprise valide.");
    var fin = parseISO(o.fin);
    if (!fin) throw new Error('Indiquez une date de fin de contrat valide.');
    if (fin.getTime() < entree.getTime()) throw new Error("La fin du contrat doit être après la date d'entrée.");
    var arret = o.arret ? parseISO(o.arret) : null;
    if (o.arret && !arret) throw new Error("Date d'arrêt du chômage invalide.");
    var today = o.aujourdhui ? parseISO(o.aujourdhui) : null;
    if (!today) { var n = new Date(); today = ymd(n.getFullYear(), n.getMonth() + 1, n.getDate()); }

    var duree = dureeContrat(entree, fin);
    var mois = Math.min(duree.arrondi, PLAFOND_MOIS);
    var debut = addDays(fin, 1); // premier jour sans contrat : la couverture continue sans coupure
    var finMax = addDays(addMonths(debut, mois), -1); // dernier jour couvert au plus tard
    var alertes = [];
    var finReelle = finMax, coupeeParArret = false;
    if (arret) {
      if (arret.getTime() <= fin.getTime()) alertes.push('La date d’arrêt du chômage devrait être après la fin du contrat : elle n’est pas prise en compte.');
      else if (arret.getTime() <= finMax.getTime()) { finReelle = arret; coupeeParArret = true; }
    }
    var courte = duree.mois < 6; // repère : ouvrir des droits au chômage demande en général 6 mois de travail (130 jours ou 910 heures) sur 24 mois
    var limiteEvin = addMonths(finReelle, DELAI_EVIN_MOIS);
    return {
      entree: entree, fin: fin, arret: arret, aujourdhui: today,
      duree: duree, mois: mois, plafonne: duree.arrondi > PLAFOND_MOIS,
      debut: debut, fin_max: finMax, fin_portabilite: finReelle, coupee_par_arret: coupeeParArret,
      jours_restants: diffDays(today, finReelle), terminee: diffDays(today, finReelle) < 0,
      proposition_assureur: addMonths(finReelle, DELAI_PROPOSITION_MOIS),
      limite_evin: limiteEvin, jours_evin: diffDays(today, limiteEvin),
      contrat_court: courte, alertes: alertes
    };
  }

  function toICS(r) {
    var pad = function (d) { return iso(d).replace(/-/g, ''); };
    var ev = [];
    function add(id, date, titre, desc) {
      ev.push('BEGIN:VEVENT', 'UID:mutuelle-' + id + '-' + pad(date) + '@10aday', 'DTSTAMP:20260101T000000Z',
        'DTSTART;VALUE=DATE:' + pad(date), 'DTEND;VALUE=DATE:' + pad(addDays(date, 1)),
        'SUMMARY:' + titre, 'DESCRIPTION:' + desc, 'END:VEVENT');
    }
    add('rappel', addMonths(r.fin_portabilite, -1), 'Dans 1 mois : fin de la mutuelle d\'entreprise gratuite (' + iso(r.fin_portabilite) + ')',
      'Portabilité CSS art. L911-8. Pensez à une autre mutuelle ou demandez le maintien individuel (loi Evin\\, avant le ' + iso(r.limite_evin) + ').');
    add('evin', addMonths(r.limite_evin, -1), 'Dans 1 mois : date limite pour garder la mutuelle à titre individuel (' + iso(r.limite_evin) + ')',
      'Loi 89-1009 art. 4 : demande dans les 6 mois après la fin de la portabilité. Date indicative.');
    return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//10aday//Portabilite mutuelle//FR', 'CALSCALE:GREGORIAN'].concat(ev, ['END:VCALENDAR']).join('\r\n') + '\r\n';
  }

  var api = { calc: calc, dureeContrat: dureeContrat, addMonths: addMonths, parseISO: parseISO, iso: iso, formatFR: formatFR, toICS: toICS, PLAFOND_MOIS: PLAFOND_MOIS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.PortabiliteMutuelle = api;
})(this);
