/*
 * rc-temps-partiel.js — Indemnité minimale de rupture conventionnelle quand la carrière dans l'entreprise
 * mêle temps plein, temps partiel, congé parental et absences non comptées (CDI, droit privé).
 * Source canonique : products/EXP-001-calculateurs-fr/src/rc-temps-partiel.js
 * Copie publiée     : docs/indemnite-rupture-conventionnelle-temps-partiel/rc-temps-partiel.js (identique, vérifié par les tests)
 * Dépend de rc-indemnite.js (moisComplets, montantLegal) : window.RCIndemnite ou require('./rc-indemnite.js').
 *
 * Règles (textes lus le 2026-11-13 sur code.travail.gouv.fr) :
 *  - Plancher = indemnité légale de licenciement (L1237-13), barème 1/4 puis 1/3 (R1234-2), mois complets (R1234-1).
 *  - L3123-5 dernier al. : l'indemnité du salarié « ayant été occupé à temps complet et à temps partiel dans la même
 *    entreprise » est calculée « proportionnellement aux périodes d'emploi accomplies selon l'une et l'autre de ces
 *    deux modalités ». L'ancienneté, elle, se décompte comme à temps complet (L3123-5 al. 4).
 *    Méthode retenue (DREETS Auvergne-Rhône-Alpes, notice de calcul ; Legisocial) : salaire de référence pondéré =
 *    salaire équivalent temps plein × Σ(quotité × durée) / durée totale, puis barème légal sur l'ancienneté totale.
 *    Exemple DREETS : 4 ans à 3 000 € + 2 ans à mi-temps (1 500 €) → référence 2 500 €.
 *  - L1225-54 (v. 11/03/2023) : congé parental d'éducation à temps plein compté pour moitié dans l'ancienneté ;
 *    congé parental à temps partiel assimilé à du travail effectif.
 *  - CJUE 8 mai 2019, Praxair MRC, C-486/18 ; Cass. soc. 18 mars 2020, n° 16-27.825 : en congé parental à temps
 *    partiel, l'indemnité se calcule sur la rémunération à temps plein → quotité 100 % pour ces mois.
 *  - L1234-11 et fiche service-public reprise par le Code du travail numérique (« Comment calculer l'ancienneté… ») :
 *    ne comptent pas maladie non professionnelle, accident de trajet, activité partielle, congé sans solde,
 *    congé sabbatique, congé création d'entreprise, grève, mise à pied (sauf convention plus favorable).
 * Aucune dépendance externe. Navigateur (window.RCTempsPartiel) et Node (module.exports).
 */
(function (root) {
  'use strict';
  var I = (typeof module === 'object' && module.exports) ? require('./rc-indemnite.js') : root.RCIndemnite;
  function r2(x) { return Math.round(x * 100 + 1e-9) / 100; }
  function num(x) { var n = +String(x === undefined || x === null ? '' : x).replace(',', '.'); return isFinite(n) ? n : NaN; }

  var TYPES = {
    partiel: 'Temps partiel',
    parental_partiel: 'Congé parental à temps partiel',
    parental_plein: 'Congé parental à temps plein',
    absence: 'Absence non comptée'
  };

  /*
   * o = { entree:'AAAA-MM-JJ', fin:'AAAA-MM-JJ',
   *       salaire: salaire brut mensuel de référence (formule 12 ou 3 mois, R1234-4) réellement perçu,
   *       quotite: temps de travail (%) pendant ces mois de référence (100 = temps plein),
   *       periodes: [{ type:'partiel', mois:24, quotite:80 }, { type:'parental_plein', mois:12 },
   *                  { type:'parental_partiel', mois:18 }, { type:'absence', mois:3 }],
   *       propose: montant proposé (facultatif) }
   * Les mois non couverts par une période sont réputés travaillés à temps plein.
   */
  function calc(o) {
    var entree = I.parseISO(o.entree), fin = I.parseISO(o.fin);
    if (!entree) throw new Error("Date d'entrée invalide.");
    if (!fin) throw new Error('Date de fin du contrat invalide.');
    if (fin < entree) throw new Error("La date de fin du contrat précède la date d'entrée.");
    var sal = num(o.salaire);
    if (!(sal > 0)) throw new Error('Indiquez le salaire brut mensuel de référence.');
    var qa = (o.quotite === undefined || o.quotite === '' || o.quotite === null) ? 100 : num(o.quotite);
    if (!(qa > 0 && qa <= 100)) throw new Error('Le temps de travail actuel doit être compris entre 1 et 100 %.');
    var brut = I.moisComplets(entree, fin);
    var per = (o.periodes || []).map(function (p, i) {
      var m = num(p.mois);
      if (!TYPES[p.type]) throw new Error('Type de période inconnu (ligne ' + (i + 1) + ').');
      if (!(m >= 0) || Math.floor(m) !== m) throw new Error('Durée invalide à la ligne ' + (i + 1) + ' : indiquez un nombre entier de mois.');
      var q = 100;
      if (p.type === 'partiel') {
        q = num(p.quotite);
        if (!(q > 0 && q <= 100)) throw new Error('Temps partiel de la ligne ' + (i + 1) + ' : indiquez un pourcentage entre 1 et 100.');
      }
      return { type: p.type, libelle: TYPES[p.type], mois: m, quotite: q };
    }).filter(function (p) { return p.mois > 0; });
    var somme = per.reduce(function (s, p) { return s + p.mois; }, 0);
    if (somme > brut) throw new Error('Les périodes saisies (' + somme + ' mois) dépassent votre ancienneté totale (' + brut + ' mois complets).');

    // Ancienneté retenue et « mois pondérés » (quotité × mois) pour le salaire de référence.
    var anc = brut, pond = 0, tempsPlein = brut - somme;
    per.forEach(function (p) {
      if (p.type === 'absence') { anc -= p.mois; p.compte = 0; p.pondere = 0; }
      else if (p.type === 'parental_plein') { anc -= p.mois / 2; p.compte = p.mois / 2; p.pondere = p.mois / 2; }
      else { p.compte = p.mois; p.pondere = p.mois * p.quotite / 100; }
      pond += p.pondere;
    });
    pond += tempsPlein;
    var ratio = anc > 0 ? pond / anc : 1;
    var etp = sal * 100 / qa;
    var ref = etp * ratio;
    var res = {
      mois_brut: brut, mois_temps_plein: tempsPlein, periodes: per,
      anciennete_mois: anc, annees: Math.floor(anc / 12), mois_restants: anc - 12 * Math.floor(anc / 12),
      salaire_saisi: r2(sal), quotite_actuelle: qa, salaire_temps_plein: r2(etp),
      mois_ponderes: pond, ratio: ratio, salaire_reference: r2(ref),
      minimum: r2(I.montantLegal(ref, anc)),
      // Ce que donne un calcul « simple » : salaire actuel, ancienneté brute, sans rien d'autre.
      calcul_simple: r2(I.montantLegal(sal, brut))
    };
    res.ecart_calcul_simple = r2(res.minimum - res.calcul_simple);
    if (o.propose !== undefined && o.propose !== null && o.propose !== '' && !isNaN(num(o.propose))) {
      res.propose = r2(num(o.propose));
      res.ecart = r2(res.propose - res.minimum);
      res.propose_suffisant = res.propose >= res.minimum;
    }
    return res;
  }

  var api = { calc: calc, TYPES: TYPES };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.RCTempsPartiel = api;
})(this);
