/*
 * rc-fiscal.js — Indemnité de rupture conventionnelle : part imposable, part soumise à cotisations, CSG/CRDS (côté salarié).
 * Source canonique : products/EXP-001-calculateurs-fr/src/rc-fiscal.js
 * Copie publiée     : docs/rupture-conventionnelle-impot-csg/rc-fiscal.js (identique, vérifié par les tests)
 *
 * Règles (textes en vigueur lus sur legifrance.gouv.fr le 2026-11-12) :
 *  - Impôt sur le revenu — CGI art. 80 duodecies, 1, 6° (version en vigueur depuis le 16/02/2025, loi n° 2025-127) :
 *    salarié qui n'est pas en droit de bénéficier d'une pension de retraite d'un régime obligatoire → n'est pas imposable
 *    la fraction de l'indemnité qui n'excède pas :
 *      a) soit 2 × la rémunération annuelle brute de l'année civile précédant la rupture, ou 50 % de l'indemnité si ce seuil
 *         est supérieur, « dans la limite de six fois le plafond [PASS] en vigueur à la date de versement » ;
 *      b) soit le montant de l'indemnité de licenciement prévue par la convention collective / l'accord ou, à défaut, par la loi
 *         (pas de plafond en PASS dans le texte).
 *    On retient le plus élevé des deux (lecture usuelle de « soit… soit… », reprise par l'administration).
 *    Salarié en droit de bénéficier d'une pension de retraite : le 6° ne s'applique pas → indemnité entièrement imposable.
 *  - Cotisations de sécurité sociale — CSS art. L242-1, II, 7° (version en vigueur depuis le 31/12/2025, loi n° 2025-1403) :
 *    exclusion de l'assiette, dans la limite de 2 PASS, de la part non imposable au titre de l'art. 80 duodecies ;
 *    indemnité d'un montant supérieur à 10 PASS → intégralement assujettie. Pour un salarié en droit de bénéficier d'une
 *    pension de retraite, même limite de 2 PASS « dans la limite des montants prévus aux a et b du 6° », même si imposable.
 *  - CSG / CRDS — CSS art. L136-1-1, III, 5° a) (version en vigueur depuis le 22/10/2026, décret n° 2026-973) :
 *    exclusion dans la limite du plus petit de : (i) le montant légal ou conventionnel (le plus élevé), (ii) le montant exclu
 *    des cotisations (L242-1, II, 7°). Indemnité > 10 PASS → intégralement assujettie. Pas d'abattement pour frais
 *    professionnels sur ces indemnités (le III 1° a) de L136-1-1 est abrogé).
 *    Taux : CSG 9,2 % (CSS L136-8, I, 1°) dont 6,8 % déductible ; CRDS 0,5 % (ordonnance n° 96-50, art. 19).
 *  - PASS : 47 100 € (2025), 48 060 € (2026, arrêté du 22/12/2025, JO du 23/12/2025).
 *  - La contribution patronale spécifique due par l'employeur (CSS L137-12) n'est pas à la charge du salarié : non calculée.
 * Hors périmètre : montant des cotisations salariales sur la part > 2 PASS (dépend des autres salaires de l'année),
 * mandataires sociaux, fonction publique, rupture conventionnelle collective, licenciement.
 * Aucune dépendance. Navigateur (window.RCFiscal) et Node (module.exports).
 */
(function (root) {
  'use strict';
  var PASS = { 2025: 47100, 2026: 48060 };
  var CSG = 0.092, CSG_DED = 0.068, CRDS = 0.005;

  function r2(x) { return Math.round(x * 100 + 1e-9) / 100; }
  function num(v, name, required) {
    if (v === undefined || v === null || String(v).trim() === '') {
      if (required) throw new Error(name + ' : montant manquant.');
      return 0;
    }
    var n = Number(String(v).replace(/\s/g, '').replace(',', '.'));
    if (!isFinite(n) || n < 0) throw new Error(name + ' : montant invalide.');
    return n;
  }

  /*
   * o = { indemnite: montant brut versé, legal: indemnité légale ou conventionnelle de licenciement (la plus élevée),
   *       remuneration: rémunération annuelle brute de l'année civile précédant la rupture,
   *       annee: année de versement (2025 ou 2026), retraite: true si en droit de bénéficier d'une pension de retraite }
   */
  function calc(o) {
    var I = num(o.indemnite, "Indemnité versée", true);
    var L = num(o.legal, 'Indemnité légale ou conventionnelle', true);
    var R = num(o.remuneration, 'Rémunération annuelle brute', false);
    var annee = +o.annee || 2026;
    var pass = PASS[annee];
    if (!pass) throw new Error('Année de versement non prise en charge (2025 ou 2026).');
    var retraite = !!o.retraite;

    var critereA = Math.min(Math.max(2 * R, I / 2), 6 * pass); // 6° a)
    var plafondNonImposable = Math.max(critereA, L);            // le plus élevé de a) et b)
    var exonereIR = retraite ? 0 : Math.min(I, plafondNonImposable);
    var plus10 = I > 10 * pass;
    var exonereCot = plus10 ? 0 : Math.min(retraite ? Math.min(I, plafondNonImposable) : exonereIR, 2 * pass);
    var exonereCsg = plus10 ? 0 : Math.min(L, exonereCot);
    var baseCsg = I - exonereCsg;
    var csg = r2(baseCsg * CSG), crds = r2(baseCsg * CRDS);

    return {
      indemnite: r2(I), legal: r2(L), remuneration: r2(R),
      remuneration_fournie: !(o.remuneration === undefined || o.remuneration === null || String(o.remuneration).trim() === ''), annee: annee, pass: pass, retraite: retraite,
      critere_a: r2(critereA), critere_a_plafonne: Math.max(2 * R, I / 2) > 6 * pass,
      critere_retenu: L >= critereA ? 'b' : 'a',
      plafond_non_imposable: r2(plafondNonImposable),
      exonere_ir: r2(exonereIR), imposable_ir: r2(I - exonereIR),
      plus_10_pass: plus10,
      exonere_cotisations: r2(exonereCot), base_cotisations: r2(I - exonereCot),
      exonere_csg: r2(exonereCsg), base_csg: r2(baseCsg),
      csg: csg, crds: crds, csg_crds: r2(csg + crds), csg_deductible: r2(baseCsg * CSG_DED),
      // CSG non déductible + CRDS : réintégrées dans le revenu imposable.
      csg_crds_non_deductibles: r2(baseCsg * (CSG - CSG_DED + CRDS)),
      net_avant_impot: r2(I - csg - crds), // hors cotisations salariales éventuelles (si base_cotisations > 0)
      sous_le_minimum: I < L
    };
  }

  function eur(x) {
    var s = (Math.round(x * 100) / 100).toFixed(2).split('.');
    return s[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ',' + s[1] + ' €';
  }

  var api = { calc: calc, eur: eur, PASS: PASS, TAUX: { CSG: CSG, CSG_DED: CSG_DED, CRDS: CRDS } };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.RCFiscal = api;
})(this);
