// Tests : node products/EXP-001-calculateurs-fr/test/rc-temps-partiel.test.js
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const SRC = path.join(__dirname, '..', 'src', 'rc-temps-partiel.js');
const PUB = path.join(__dirname, '..', '..', '..', 'docs', 'indemnite-rupture-conventionnelle-temps-partiel', 'rc-temps-partiel.js');
const T = require(SRC);
const I = require('../src/rc-indemnite.js');
let passed = 0;
function t(name, fn) { try { fn(); passed++; } catch (e) { console.error('ÉCHEC ' + name + ' : ' + e.message); process.exitCode = 1; } }
const near = (a, b) => assert.ok(Math.abs(a - b) < 0.006, a + ' ≠ ' + b);

// 1. Exemple DREETS Auvergne-Rhône-Alpes : 4 ans à temps plein (3 000 €) puis 2 ans à mi-temps (1 500 €) → référence 2 500 €, 6 ans → 3 750 €.
t('DREETS ARA', () => {
  const r = T.calc({ entree: '2020-01-01', fin: '2025-12-31', salaire: 1500, quotite: 50, periodes: [{ type: 'partiel', mois: 24, quotite: 50 }] });
  assert.strictEqual(r.salaire_reference, 2500); assert.strictEqual(r.minimum, 3750); assert.strictEqual(r.calcul_simple, 2250);
});
// 2. Sans période particulière : identique au calculateur n°2.
t('égal n°2', () => {
  for (const [e, f, s] of [['2014-01-01', '2025-12-31', 2000], ['2021-01-01', '2025-12-31', 2000], ['2013-06-01', '2025-12-31', 2000], ['2025-04-01', '2025-12-31', 2400]]) {
    assert.strictEqual(T.calc({ entree: e, fin: f, salaire: s }).minimum, I.calc({ entree: e, fin: f, moyenne12: s }).minimum);
  }
});
// 3. Retour à 80 % après 8 ans à temps plein : un calcul simple sous-estime.
t('80 % en fin de carrière', () => {
  const r = T.calc({ entree: '2016-01-01', fin: '2025-12-31', salaire: 2400, quotite: 80, periodes: [{ type: 'partiel', mois: 24, quotite: 80 }] });
  assert.strictEqual(r.salaire_temps_plein, 3000); near(r.ratio, 0.96); assert.strictEqual(r.salaire_reference, 2880);
  assert.strictEqual(r.minimum, 7200); assert.strictEqual(r.calcul_simple, 6000); assert.strictEqual(r.ecart_calcul_simple, 1200);
});
// 4. Congé parental à temps plein : moitié de la durée ; absences retirées.
t('parental plein + absence', () => {
  const r = T.calc({ entree: '2018-01-01', fin: '2025-12-31', salaire: 2000, periodes: [{ type: 'parental_plein', mois: 12 }, { type: 'absence', mois: 2 }] });
  assert.strictEqual(r.anciennete_mois, 96 - 6 - 2); assert.strictEqual(r.salaire_reference, 2000); near(r.minimum, 2000 / 4 * 88 / 12);
});
// 5. Congé parental à temps partiel (CJUE 2019 / Cass. 2020) : compte comme du temps plein, salaire ramené au temps plein.
t('parental partiel = temps plein', () => {
  const r = T.calc({ entree: '2019-01-01', fin: '2025-12-31', salaire: 1200, quotite: 60, periodes: [{ type: 'parental_partiel', mois: 30 }] });
  assert.strictEqual(r.salaire_reference, 2000); assert.strictEqual(r.minimum, 3500);
});
// 6. Erreurs de saisie.
t('erreurs', () => {
  assert.throws(() => T.calc({ entree: '2020-01-01', fin: '2021-12-31', salaire: 2000, periodes: [{ type: 'partiel', mois: 30, quotite: 50 }] }), /dépassent/);
  assert.throws(() => T.calc({ entree: '2020-01-01', fin: '2021-12-31', salaire: 2000, periodes: [{ type: 'partiel', mois: 3, quotite: 0 }] }), /pourcentage/);
  assert.throws(() => T.calc({ entree: '2020-01-01', fin: '2021-12-31', salaire: 2000, quotite: 120 }), /entre 1 et 100/);
  assert.throws(() => T.calc({ entree: '2020-01-01', fin: '2021-12-31', salaire: 0 }), /salaire/);
  assert.throws(() => T.calc({ entree: '2020-01-01', fin: '2021-12-31', salaire: 2000, periodes: [{ type: 'partiel', mois: 2.5, quotite: 50 }] }), /entier/);
});
// 7. Montant proposé.
t('proposé', () => {
  const r = T.calc({ entree: '2020-01-01', fin: '2025-12-31', salaire: 1500, quotite: 50, periodes: [{ type: 'partiel', mois: 24, quotite: 50 }], propose: 3000 });
  assert.strictEqual(r.propose_suffisant, false); assert.strictEqual(r.ecart, -750);
});
// 8. 20 000 cas aléatoires contre un oracle mois par mois (frise mélangée, barème réécrit à part).
t('oracle 20 000', () => {
  let seed = 7; const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  const iso = d => d.toISOString().slice(0, 10);
  for (let k = 0; k < 20000; k++) {
    const e = new Date(Date.UTC(1995 + Math.floor(rnd() * 30), Math.floor(rnd() * 12), 1 + Math.floor(rnd() * 28)));
    const f = new Date(e.getTime() + Math.floor(rnd() * 30 * 365) * 86400000);
    const brut = I.moisComplets(e, f);
    const types = ['partiel', 'parental_partiel', 'parental_plein', 'absence'];
    const per = []; let left = brut;
    const n = Math.floor(rnd() * 4);
    for (let j = 0; j < n && left > 0; j++) {
      const m = Math.floor(rnd() * (left + 1)); left -= m;
      per.push({ type: types[Math.floor(rnd() * 4)], mois: m, quotite: 10 + Math.floor(rnd() * 91) });
    }
    const qa = 20 + Math.floor(rnd() * 81), sal = 500 + Math.round(rnd() * 600000) / 100;
    // Oracle : une case par mois brut, valeur [poids ancienneté, quotité].
    const months = [];
    per.forEach(p => { for (let i = 0; i < p.mois; i++) months.push(p.type === 'absence' ? [0, 0] : p.type === 'parental_plein' ? [0.5, 1] : p.type === 'partiel' ? [1, p.quotite / 100] : [1, 1]); });
    while (months.length < brut) months.push([1, 1]);
    months.sort(() => rnd() - 0.5);
    let anc = 0, w = 0; months.forEach(([a, q]) => { anc += a; w += a * q; });
    const ref = sal / (qa / 100) * (anc > 0 ? w / anc : 1);
    const y = anc / 12, exp = y <= 10 ? ref * y / 4 : ref * 2.5 + ref * (y - 10) / 3;
    const r = T.calc({ entree: iso(e), fin: iso(f), salaire: sal, quotite: qa, periodes: per });
    if (Math.abs(r.minimum - exp) > 0.006) throw new Error('cas ' + k + ' : ' + r.minimum + ' ≠ ' + exp);
  }
});
// 9. Copie publiée identique.
t('copie publiée', () => assert.strictEqual(fs.readFileSync(PUB, 'utf8'), fs.readFileSync(SRC, 'utf8')));
console.log(passed + ' tests OK' + (process.exitCode ? ' (avec échecs)' : ''));
