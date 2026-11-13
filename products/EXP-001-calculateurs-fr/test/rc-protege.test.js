// Tests : node products/EXP-001-calculateurs-fr/test/rc-protege.test.js
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const SRC = path.join(__dirname, '..', 'src', 'rc-protege.js');
const PUB = path.join(__dirname, '..', '..', '..', 'docs', 'rupture-conventionnelle-salarie-protege', 'rc-protege.js');
const P = require(SRC);
const D = require(path.join(__dirname, '..', 'src', 'rc-dates.js'));
let passed = 0;
function t(name, fn) { try { fn(); passed++; } catch (e) { console.error('ÉCHEC ' + name + ' : ' + e.message); process.exitCode = 1; } }
const I = d => d && P.iso(d);

t('copie publiée identique', () => assert.strictEqual(fs.readFileSync(SRC, 'utf8'), fs.readFileSync(PUB, 'utf8')));

// Rétractation identique au calculateur n°1 (cas 2 de la fiche : signature 02/11/2026 → fin 17/11/2026).
t('signature 02/11/2026, réception par défaut', () => {
  const r = P.calc('2026-11-02');
  assert.strictEqual(I(r.fin_retractation), '2026-11-17');
  assert.strictEqual(I(r.envoi_au_plus_tot), '2026-11-18');
  assert.strictEqual(I(r.reception), '2026-11-18');
  assert.strictEqual(r.reception_par_defaut, true);
  assert.strictEqual(I(r.limite_decision), '2027-01-18');
  assert.strictEqual(I(r.refus_implicite), '2027-01-19');
  assert.strictEqual(I(r.depart_si_autorise_le_dernier_jour), '2027-01-19');
  assert.strictEqual(r.rupture, null);
  assert.deepStrictEqual(r.alertes, []);
});
// Cas 3 de la fiche : 15e jour = dim. 1er nov. férié → prorogé au lundi 02/11.
t('rétractation prorogée (Toussaint)', () => {
  const r = P.calc('2026-10-17');
  assert.strictEqual(I(r.fin_retractation), '2026-11-02');
  assert.strictEqual(I(r.limite_decision), '2027-01-03');
});
t('fin de mois : 31/12 + 2 mois = 28/02 ; 30/12/2027 → 29/02/2028', () => {
  assert.strictEqual(I(P.addMonths(D.parseISO('2026-12-31'), 2)), '2027-02-28');
  assert.strictEqual(I(P.addMonths(D.parseISO('2027-12-30'), 2)), '2028-02-29');
  assert.strictEqual(I(P.addMonths(D.parseISO('2026-11-30'), 2)), '2027-01-30');
});
t('réception saisie postérieure', () => {
  const r = P.calc('2026-11-02', { reception: '2026-11-23' });
  assert.strictEqual(I(r.limite_decision), '2027-01-23');
  assert.strictEqual(r.reception_par_defaut, false);
});
t('réception trop tôt → alerte', () => {
  const r = P.calc('2026-11-02', { reception: '2026-11-10' });
  assert.strictEqual(r.alertes.length, 1);
});
t('autorisation + date convenue antérieure → lendemain de l’autorisation', () => {
  const r = P.calc('2026-11-02', { reception: '2026-11-20', autorisation: '2026-12-10', convenue: '2026-12-05' });
  assert.strictEqual(I(r.rupture), '2026-12-11');
  assert.strictEqual(r.alertes.length, 1);
});
t('autorisation + date convenue postérieure → date convenue', () => {
  const r = P.calc('2026-11-02', { autorisation: '2026-12-10', convenue: '2026-12-31' });
  assert.strictEqual(I(r.rupture), '2026-12-31');
  assert.deepStrictEqual(r.alertes, []);
});
t('date convenue trop proche sans autorisation → alerte', () => {
  const r = P.calc('2026-11-02', { convenue: '2026-12-31' });
  assert.strictEqual(r.rupture, null);
  assert.strictEqual(r.alertes.length, 1);
  assert.strictEqual(P.calc('2026-11-02', { convenue: '2027-01-20' }).alertes.length, 0);
});
t('autorisation hors délai → alerte ; antérieure à la réception → erreur', () => {
  assert.strictEqual(P.calc('2026-11-02', { autorisation: '2027-01-25' }).alertes.length, 1);
  assert.throws(() => P.calc('2026-11-02', { reception: '2026-11-20', autorisation: '2026-11-19' }));
});
t('recours hiérarchique : refus notifié le 15/01/2027 → 15/03/2027', () => {
  const r = P.calc('2026-11-02', { refus: '2027-01-15' });
  assert.strictEqual(I(r.recours_limite), '2027-03-15');
});
t('dates invalides', () => {
  assert.throws(() => P.calc('2026-02-30'));
  assert.throws(() => P.calc('2026-11-02', { reception: 'abc' }));
});
t('ICS : 3 à 5 événements', () => {
  assert.strictEqual((P.toICS(P.calc('2026-11-02')).match(/BEGIN:VEVENT/g) || []).length, 3);
  assert.strictEqual((P.toICS(P.calc('2026-11-02', { autorisation: '2026-12-10', refus: '2027-01-02' })).match(/BEGIN:VEVENT/g) || []).length, 5);
});
// Oracle indépendant pour addMonths : avance de 2 mois par la date JS locale + recul au dernier jour du mois.
t('addMonths : 20 000 dates contre un oracle', () => {
  let d = D.parseISO('2020-01-01');
  for (let i = 0; i < 20000; i++) {
    const y = d.getUTCFullYear(), m = d.getUTCMonth(), day = d.getUTCDate();
    const target = new Date(Date.UTC(y, m + 2, 1));
    const last = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
    const exp = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), Math.min(day, last)));
    assert.strictEqual(I(P.addMonths(d, 2)), I(exp), I(d));
    // propriété : limite toujours entre 59 et 62 jours après la réception
    const n = Math.round((P.addMonths(d, 2) - d) / 86400000);
    assert.ok(n >= 58 && n <= 62, I(d) + ' ' + n);
    d = D.addDays(d, 1);
  }
});
t('cohérence avec rc-dates sur 2 000 signatures', () => {
  let s = D.parseISO('2025-01-01');
  for (let i = 0; i < 2000; i++) {
    const a = P.calc(s), b = D.calc(s);
    assert.strictEqual(I(a.fin_retractation), I(b.fin_retractation));
    assert.strictEqual(I(a.envoi_au_plus_tot), I(b.envoi_au_plus_tot));
    assert.ok(a.depart_si_autorise_le_dernier_jour > b.rupture_au_plus_tot);
    s = D.addDays(s, 1);
  }
});
console.log(passed + ' tests OK' + (process.exitCode ? ' (avec échecs)' : ''));
