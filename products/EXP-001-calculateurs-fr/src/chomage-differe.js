/*
 * chomage-differe.js — Date de début de l'indemnisation chômage (ARE) après une rupture conventionnelle (CDI).
 * Source canonique : products/EXP-001-calculateurs-fr/src/chomage-differe.js
 * Copie publiée     : docs/chomage-rupture-conventionnelle/chomage-differe.js (identique, vérifié par les tests)
 *
 * Règles (règlement général annexé à la convention d'assurance chômage du 15 novembre 2024 ; fiches Unédic
 * « Différé d'indemnisation spécifique », « Différé congés payés », « Dans quel délai vais-je être indemnisé(e) ? »,
 * consultées via WebSearch le 2026-11-12) :
 *  - Différé congés payés = indemnité compensatrice de congés payés (ICCP) ÷ salaire journalier de référence (SJR),
 *    limité à 30 jours calendaires ; il court à compter du lendemain de la fin du contrat.
 *  - Différé spécifique = nombre entier obtenu en divisant les indemnités de rupture « supra-légales »
 *    (part qui dépasse le minimum légal) par un diviseur annuel : 111,8 pour 2026 (valeur au 01/01/2026, Unédic),
 *    109,6 pour 2025. Limité à 150 jours calendaires (75 jours en cas de motif économique — hors champ de la RC).
 *    Exemples Unédic : 1 372 ÷ 111,8 = 12 jours ; 460 ÷ 109,6 = 4,20 → 4 jours (partie entière).
 *  - Les différés se cumulent. Puis délai d'attente de 7 jours, qui débute après les différés si la personne est
 *    inscrite à France Travail avant leur expiration, sinon à compter de la date d'inscription. Il ne s'applique
 *    qu'une fois par période de 12 mois.
 *  - Convention de comptage reproduite de l'exemple Unédic « Différé congés payés » : fin de contrat le 30/11,
 *    17 jours de différé + 7 jours d'attente = 24 jours à partir du 1er/12 → indemnisation à partir du 25/12 ;
 *    inscription tardive le 20/12 → indemnisation à partir du 27/12.
 *    (L'exemple « Nadia » de la fiche Unédic 2026 annonce le 20/11 pour une fin le 01/11 + 12 + 7 jours, soit un jour
 *    plus tôt que cette convention : la page signale l'écart et retient la date la plus prudente.)
 * Aucune dépendance. Navigateur (window.ChomageDiffere) et Node (module.exports).
 */
(function (root) {
  'use strict';
  var DAY = 86400000;
  // Diviseur du différé spécifique, par année de fin de contrat. Source : Unédic (circulaire annuelle sur le diviseur ;
  // fiche « Différé d'indemnisation spécifique », valeur 2026 = 111,8 ; exemples 2025 = 109,6). Vérifié le 2026-11-12.
  var DIVISEURS = { 2025: 109.6, 2026: 111.8 };
  var PLAFOND_SPECIFIQUE = 150; // jours calendaires (règlement général, art. 21 §2)
  var PLAFOND_CP = 30;          // jours calendaires (règlement général, art. 21 §1)
  var ATTENTE = 7;              // jours (règlement général, art. 22)

  function parseISO(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || '').trim());
    if (!m) return null;
    var d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    return (d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3]) ? d : null;
  }
  function iso(d) { return d.toISOString().slice(0, 10); }
  function add(d, n) { return new Date(d.getTime() + n * DAY); }
  function num(v, name, required) {
    if (v === undefined || v === null || String(v).trim() === '') {
      if (required) throw new Error('Indiquez ' + name + '.');
      return 0;
    }
    var x = Number(String(v).replace(/\s/g, '').replace(',', '.'));
    if (!isFinite(x) || x < 0) throw new Error('Montant invalide : ' + name + '.');
    return x;
  }
  function diviseur(annee) {
    if (DIVISEURS[annee]) return { valeur: DIVISEURS[annee], annee: annee, exact: true };
    var ks = Object.keys(DIVISEURS).map(Number).sort();
    var k = annee > ks[ks.length - 1] ? ks[ks.length - 1] : ks[0];
    return { valeur: DIVISEURS[k], annee: k, exact: false };
  }

  /*
   * o.fin           : date de fin du contrat (AAAA-MM-JJ), obligatoire
   * o.inscription   : date d'inscription à France Travail (facultatif ; par défaut = lendemain de la fin du contrat)
   * o.indemnite     : indemnité de rupture versée (€)
   * o.legale        : indemnité légale minimale (€) — la part au-delà est « supra-légale »
   * o.iccp          : indemnité compensatrice de congés payés (€)
   * o.sjr           : salaire journalier de référence (€) ; à défaut, estimé par o.brutMensuel × 12 ÷ 365
   * o.attenteDejaAppliquee : true si un délai d'attente a déjà été appliqué dans les 12 derniers mois
   */
  function calc(o) {
    var fin = parseISO(o.fin);
    if (!fin) throw new Error('Indiquez la date de fin du contrat.');
    var lendemain = add(fin, 1);
    var insc = o.inscription ? parseISO(o.inscription) : null;
    if (o.inscription && !insc) throw new Error("Date d'inscription invalide.");
    var inscriptionDonnee = !!insc;
    if (!insc) insc = lendemain;

    var indemnite = num(o.indemnite, "l'indemnité versée", false);
    var legale = num(o.legale, "l'indemnité légale", false);
    var iccp = num(o.iccp, "l'indemnité de congés payés", false);
    var sjr = num(o.sjr, 'le salaire journalier de référence', false);
    var brut = num(o.brutMensuel, 'le salaire brut mensuel', false);
    var sjrEstime = false;
    if (!sjr && brut) { sjr = Math.round(brut * 12 / 365 * 100) / 100; sjrEstime = true; }
    if (iccp > 0 && !sjr) throw new Error("Indiquez votre salaire (brut mensuel ou journalier de référence) pour calculer le différé congés payés.");

    var supra = Math.max(0, Math.round((indemnite - legale) * 100) / 100);
    var div = diviseur(fin.getUTCFullYear());
    var specBrut = supra > 0 ? Math.floor(supra / div.valeur + 1e-9) : 0;
    var spec = Math.min(PLAFOND_SPECIFIQUE, specBrut);
    var cpBrut = iccp > 0 ? Math.floor(iccp / sjr + 1e-9) : 0;
    var cp = Math.min(PLAFOND_CP, cpBrut);
    var differes = cp + spec;

    // Dernier jour couvert par les différés (null si aucun différé).
    var finDifferes = differes > 0 ? add(fin, differes) : null;
    var apresDifferes = add(fin, differes + 1); // 1er jour hors différé
    var debutAttente = insc > apresDifferes ? insc : apresDifferes;
    var attente = o.attenteDejaAppliquee ? 0 : ATTENTE;
    var debut = add(debutAttente, attente);

    return {
      fin: iso(fin),
      inscription: iso(insc),
      inscription_donnee: inscriptionDonnee,
      inscription_tardive: insc > apresDifferes,
      supra_legale: supra,
      diviseur: div.valeur,
      diviseur_annee: div.annee,
      diviseur_exact: div.exact,
      differe_specifique_brut: specBrut,
      differe_specifique: spec,
      differe_specifique_plafonne: specBrut > spec,
      sjr: sjr || null,
      sjr_estime: sjrEstime,
      differe_cp_brut: cpBrut,
      differe_cp: cp,
      differe_cp_plafonne: cpBrut > cp,
      differes: differes,
      fin_differes: finDifferes ? iso(finDifferes) : null,
      debut_attente: iso(debutAttente),
      attente: attente,
      fin_attente: attente ? iso(add(debutAttente, attente - 1)) : null,
      debut_indemnisation: iso(debut),
      jours_sans_allocation: Math.round((debut - lendemain) / DAY)
    };
  }

  var api = { calc: calc, parseISO: parseISO, diviseur: diviseur, DIVISEURS: DIVISEURS,
    PLAFOND_SPECIFIQUE: PLAFOND_SPECIFIQUE, PLAFOND_CP: PLAFOND_CP, ATTENTE: ATTENTE };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ChomageDiffere = api;
})(this);
