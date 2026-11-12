/*
 * rc-indemnite.js — Indemnité minimale de rupture conventionnelle (CDI, droit privé).
 * Source canonique : products/EXP-001-calculateurs-fr/src/rc-indemnite.js
 * Copie publiée     : docs/rupture-conventionnelle-indemnite/rc-indemnite.js (identique, vérifié par les tests)
 *
 * Règles (vérifiées le 2026-11-12 via code.travail.gouv.fr / legifrance.gouv.fr / travail-emploi.gouv.fr) :
 *  - L'indemnité spécifique de rupture conventionnelle ne peut pas être inférieure à l'indemnité légale de
 *    licenciement — C. trav. art. L1237-13 (renvoi à L1234-9) ; Cass. soc. 3 juin 2015 n° 13-26.799.
 *  - Montant : 1/4 de mois de salaire par année d'ancienneté jusqu'à 10 ans, 1/3 de mois par année au-delà
 *    — C. trav. art. R1234-2 (rédaction du décret n° 2017-1398 du 25 sept. 2017, en vigueur depuis le 27/09/2017).
 *  - Année incomplète : proportionnellement au nombre de mois complets — C. trav. art. R1234-1.
 *  - Salaire de référence : la formule la plus favorable entre la moyenne mensuelle des 12 derniers mois
 *    (ou de tous les mois si moins de 12 mois) et le tiers des 3 derniers mois, les primes annuelles ou
 *    exceptionnelles versées dans ces 3 mois n'étant retenues qu'à due proportion (3/12) — C. trav. art. R1234-4.
 *  - Moins d'un an d'ancienneté : indemnité au prorata des mois de présence (fiche service-public reprise par
 *    le Code du travail numérique ; DARES Résultats n° 43, 2021).
 * Aucune dépendance. Navigateur (window.RCIndemnite) et Node (module.exports).
 */
(function (root) {
  'use strict';
  var DAY = 86400000;
  function parseISO(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || '').trim());
    if (!m) return null;
    var d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    return (d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3]) ? d : null;
  }
  // Ajoute n mois « de date à date ». Si le quantième n'existe pas, on passe au 1er du mois suivant
  // (31 janv. + 1 mois = 1er mars) : choix prudent, un mois n'est compté que lorsqu'il est entièrement écoulé.
  function addMonths(d, n) {
    var y = d.getUTCFullYear(), m = d.getUTCMonth() + n, day = d.getUTCDate();
    var last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    return day <= last ? new Date(Date.UTC(y, m, day)) : new Date(Date.UTC(y, m + 1, 1));
  }
  // Mois complets entre l'entrée (1er jour travaillé) et la fin du contrat (dernier jour, inclus).
  function moisComplets(entree, fin) {
    var end = new Date(fin.getTime() + DAY);
    var n = Math.max(0, (end.getUTCFullYear() - entree.getUTCFullYear()) * 12 + end.getUTCMonth() - entree.getUTCMonth() + 1);
    while (n > 0 && addMonths(entree, n) > end) n--;
    return n;
  }
  function r2(x) { return Math.round(x * 100 + 1e-9) / 100; }

  // Indemnité légale pour un salaire de référence et un nombre de mois complets d'ancienneté.
  function montantLegal(ref, mois) {
    var ans = mois / 12;
    if (ans <= 10) return ref * ans / 4;
    return ref * 10 / 4 + ref * (ans - 10) / 3;
  }

  /*
   * o = { entree:'AAAA-MM-JJ', fin:'AAAA-MM-JJ', moisDeduits:0,
   *       moyenne12: brut mensuel moyen des 12 derniers mois (ou de tous les mois si < 12),
   *       total3: brut total des 3 derniers mois (facultatif), primes3: dont primes annuelles/exceptionnelles (facultatif),
   *       propose: montant proposé (facultatif) }
   */
  function calc(o) {
    var entree = parseISO(o.entree), fin = parseISO(o.fin);
    if (!entree) throw new Error("Date d'entrée invalide.");
    if (!fin) throw new Error('Date de fin du contrat invalide.');
    if (fin < entree) throw new Error("La date de fin du contrat précède la date d'entrée.");
    var ded = Math.max(0, Math.floor(+o.moisDeduits || 0));
    var brut = moisComplets(entree, fin);
    var mois = Math.max(0, brut - ded);
    var m12 = +o.moyenne12 || 0;
    if (!(m12 > 0)) throw new Error('Indiquez le salaire brut mensuel moyen des 12 derniers mois.');
    var t3 = +o.total3 || 0, p3 = Math.max(0, +o.primes3 || 0);
    if (p3 > t3 && t3 > 0) throw new Error('Les primes des 3 derniers mois dépassent le total des 3 derniers mois.');
    var m3 = t3 > 0 ? (t3 - p3 + p3 * 3 / 12) / 3 : null;
    var ref = (m3 !== null && m3 > m12) ? m3 : m12;
    var ans = Math.floor(mois / 12), reste = mois % 12;
    var partA = mois <= 120 ? ref * mois / 48 : ref * 10 / 4;
    var partB = mois <= 120 ? 0 : ref * (mois - 120) / 36;
    var res = {
      mois_brut: brut, mois_deduits: ded, mois: mois, annees: ans, mois_restants: reste,
      moyenne12: r2(m12), moyenne3: m3 === null ? null : r2(m3), formule: ref === m12 ? '12 mois' : '3 mois',
      salaire_reference: r2(ref),
      part_jusqu_10_ans: r2(partA), part_au_dela_10_ans: r2(partB),
      minimum: r2(montantLegal(ref, mois)),
      moins_8_mois: mois < 8, moins_1_an: mois < 12
    };
    if (o.propose !== undefined && o.propose !== null && o.propose !== '' && !isNaN(+o.propose)) {
      res.propose = r2(+o.propose);
      res.ecart = r2(res.propose - res.minimum);
      res.propose_suffisant = res.propose >= res.minimum;
    }
    return res;
  }
  function eur(x) {
    var s = (Math.round(x * 100) / 100).toFixed(2).split('.');
    return s[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ',' + s[1] + ' €';
  }

  var api = { calc: calc, moisComplets: moisComplets, montantLegal: montantLegal, addMonths: addMonths, parseISO: parseISO, eur: eur };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.RCIndemnite = api;
})(this);
