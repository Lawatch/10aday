/*
 * iccp.js — Indemnité compensatrice de congés payés (ICCP) due au départ (CDI, droit privé, régime légal).
 * Source canonique : products/EXP-001-calculateurs-fr/src/iccp.js
 * Copie publiée     : docs/indemnite-conges-payes-depart/iccp.js (identique, vérifié par les tests)
 *
 * Règles (vérifiées le 2026-11-12 sur code.travail.gouv.fr, textes du Code du travail à jour) :
 *  - Acquisition : 2,5 jours ouvrables par mois de travail effectif, 30 jours ouvrables au plus
 *    — C. trav. art. L3141-3 (version du 10/08/2016).
 *  - Arrêt maladie / accident non professionnel : 2 jours ouvrables par mois, dans la limite de 24 jours
 *    ouvrables par période de référence — art. L3141-5 7° et L3141-5-1 (loi n° 2024-364 du 22/04/2024, version du 24/04/2024).
 *  - Accident du travail, maladie professionnelle, maternité, paternité… : travail effectif (art. L3141-5 1° à 6°).
 *  - 4 semaines ou 24 jours de travail = 1 mois — art. L3141-4. Nombre non entier → entier supérieur — art. L3141-7.
 *  - Période de référence : du 1er juin au 31 mai, à défaut d'accord — art. R3141-4.
 *  - Indemnité : 1/10e de la rémunération brute totale de la période de référence (y compris l'indemnité de
 *    congés de l'année précédente ; périodes d'arrêt maladie non professionnel prises en compte à 80 % de la
 *    rémunération associée), au prorata de la durée du congé dû — art. L3141-24 I (version du 24/04/2024).
 *  - Sans pouvoir être inférieure au salaire qu'aurait perçu le salarié s'il avait travaillé (maintien de salaire)
 *    — art. L3141-24 II. Calcul du maintien : horaire réel du mois, nombre moyen ou nombre réel de jours
 *    ouvrables/ouvrés (fiche « Comment est calculée l'indemnité de congés payés du salarié ? », service-public
 *    reprise par le Code du travail numérique, mise à jour du 06/02/2026, exemple 952,38 € / 960,00 €).
 *  - Au départ, la fraction non prise est payée par l'ICCP selon ces mêmes règles — art. L3141-28.
 * Aucune dépendance. Navigateur (window.ICCP) et Node (module.exports).
 */
(function (root) {
  'use strict';
  var EPS = 1e-9;
  // Jours par an et nombre moyen de jours par mois selon l'unité de décompte.
  var UNITES = {
    ouvrables: { an: 30, parMois: 2.5, maladieParMois: 2, maladieMax: 24, moyenMois: 26 },
    ouvres: { an: 25, moyenMois: 21.67 } // décompte en jours ouvrés : 5/6 des jours ouvrables (25 = 30 × 5/6)
  };

  function num(v, nom, opts) {
    opts = opts || {};
    if (v === undefined || v === null || String(v).trim() === '') {
      if (opts.def !== undefined) return opts.def;
      throw new Error(nom + ' : valeur manquante.');
    }
    var x = typeof v === 'number' ? v : Number(String(v).replace(/\s/g, '').replace(',', '.'));
    if (!isFinite(x) || x < 0) throw new Error(nom + ' : nombre positif attendu.');
    if (opts.max !== undefined && x > opts.max) throw new Error(nom + ' : ' + opts.max + ' au maximum.');
    return x;
  }
  function r2(x) { return Math.round((x + EPS) * 100) / 100; }
  function unite(u) {
    if (u === undefined || u === null || u === '') return 'ouvrables';
    if (!UNITES[u]) throw new Error('Unité inconnue : ' + u);
    return u;
  }

  // Jours acquis sur une période de référence à partir des mois de travail effectif et d'arrêt maladie non pro.
  function acquis(o) {
    o = o || {};
    var u = unite(o.unite);
    var t = num(o.moisTravail, 'Mois de travail', { def: 0, max: 12 });
    var m = num(o.moisMaladie, 'Mois d’arrêt maladie', { def: 0, max: 12 });
    if (t + m > 12 + EPS) throw new Error('Une période de référence compte 12 mois au plus (travail + arrêt maladie).');
    var U = UNITES.ouvrables;
    var travail = U.parMois * t;
    var maladieBrut = U.maladieParMois * m;
    var maladie = Math.min(maladieBrut, U.maladieMax);
    var total = Math.min(travail + maladie, U.an);
    var jours = u === 'ouvrables' ? total : total * 5 / 6;
    return {
      unite: u,
      travail: travail,
      maladie: maladie,
      maladie_plafonnee: maladieBrut > U.maladieMax + EPS,
      exact: r2(jours),
      jours: Math.max(0, Math.ceil(jours - EPS)) // L3141-7 : entier immédiatement supérieur
    };
  }

  // Une période de référence : jours restants à payer, jours acquis, rémunération de la période.
  function periode(p, commun) {
    var restants = num(p.restants, 'Jours restants');
    var acq = num(p.acquis, 'Jours acquis');
    if (restants === 0) return { restants: 0, acquis: acq, base: 0, dixieme: 0, maintien: 0, montant: 0, methode: null };
    if (acq <= 0) throw new Error('Jours acquis : doit être supérieur à 0.');
    if (restants > acq + EPS) throw new Error('Il ne peut pas rester plus de jours (' + restants + ') que de jours acquis (' + acq + ').');
    var brut = num(p.brut, 'Rémunération brute de la période', { def: 0 });
    var mm = num(p.moisMaladie, 'Mois d’arrêt maladie', { def: 0, max: 12 });
    var salaire = commun.salaire;
    var maladie80 = 0.8 * salaire * mm; // L3141-24 I 4°
    var base = brut + maladie80;
    var dixieme = base / 10 * restants / acq;
    var maintien = salaire * restants / commun.joursMois;
    var montant = Math.max(dixieme, maintien);
    return {
      restants: restants, acquis: acq, brut: r2(brut), maladie80: r2(maladie80), base: r2(base),
      dixieme: r2(dixieme), maintien: r2(maintien), montant: r2(montant),
      methode: dixieme > maintien + EPS ? 'dixieme' : (maintien > dixieme + EPS ? 'maintien' : 'egal')
    };
  }

  /*
   * calc({ unite, salaire, joursMois, periodes: [{ restants, acquis, brut, moisMaladie }] })
   *  - salaire : salaire brut mensuel que le salarié aurait perçu en travaillant (sert au maintien et aux 80 %).
   *  - joursMois : jours ouvrables (ou ouvrés) du mois servant au maintien ; défaut = nombre moyen (26 ou 21,67).
   */
  function calc(o) {
    var u = unite(o.unite);
    var salaire = num(o.salaire, 'Salaire brut mensuel');
    var joursMois = num(o.joursMois, 'Jours du mois', { def: UNITES[u].moyenMois });
    if (joursMois <= 0) throw new Error('Jours du mois : doit être supérieur à 0.');
    var commun = { salaire: salaire, joursMois: joursMois };
    var ps = (o.periodes || []).map(function (p) { return periode(p, commun); });
    if (!ps.length) throw new Error('Aucune période de congés saisie.');
    var restants = 0, total = 0;
    ps.forEach(function (p) { restants += p.restants; total += p.montant; });
    if (restants === 0) throw new Error('Aucun jour de congé restant : pas d’indemnité compensatrice.');
    return {
      unite: u, salaire: salaire, joursMois: joursMois, joursMoisDefaut: o.joursMois === undefined || o.joursMois === null || String(o.joursMois).trim() === '',
      periodes: ps, restants: r2(restants), total: r2(total)
    };
  }

  var api = { calc: calc, acquis: acquis, UNITES: UNITES };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ICCP = api;
})(this);
