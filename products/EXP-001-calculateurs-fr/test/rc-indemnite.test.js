// Tests : node products/EXP-001-calculateurs-fr/test/rc-indemnite.test.js
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const SRC = path.join(__dirname, '..', 'src', 'rc-indemnite.js');
const PUB = path.join(__dirname, '..', '..', '..', 'docs', 'rupture-conventionnelle-indemnite', 'rc-indemnite.js');
const I = require(SRC);
let passed = 0;
function t(name, fn) { try { fn(); passed++; } catch (e) { console.error('ÉCHEC ' + name + ' : ' + e.message); process.exitCode = 1; } }

// 1. Exemples officiels (travail-emploi.gouv.fr, « L'indemnité légale de licenciement ») : salaire de référence 2 000 €.
t('ministère 5 ans', () => assert.strictEqual(I.calc({ entree: '2021-01-01', fin: '2025-12-31', moyenne12: 2000 }).minimum, 2500));
// Le ministère affiche 6 333,32 € (666,66 × 2 tronqué) ; valeur exacte 5 000 + 4 000/3 = 6 333,33 €.
t('ministère 12 ans', () => assert.strictEqual(I.calc({ entree: '2014-01-01', fin: '2025-12-31', moyenne12: 2000 }).minimum, 6333.33));
// 2. Années incomplètes : 12 ans 7 mois, 2 000 € → 5 000 + 2000/3 × (2 + 7/12) = 6 722,22 €.
t('12 ans 7 mois', () => {
  const r = I.calc({ entree: '2013-06-01', fin: '2025-12-31', moyenne12: 2000 });
  assert.strictEqual(r.annees, 12); assert.strictEqual(r.mois_restants, 7); assert.strictEqual(r.minimum, 6722.22);
});
// 3. Moins d'un an : 9 mois, 2 400 € → 2400/4 × 9/12 = 450 €.
t('9 mois', () => { const r = I.calc({ entree: '2025-04-01', fin: '2025-12-31', moyenne12: 2400 }); assert.strictEqual(r.mois, 9); assert.strictEqual(r.minimum, 450); assert.ok(!r.moins_8_mois); });
t('5 mois', () => { const r = I.calc({ entree: '2025-08-01', fin: '2025-12-31', moyenne12: 2400 }); assert.strictEqual(r.minimum, 250); assert.ok(r.moins_8_mois); });
// 4. Mois complets : bornes.
t('mois complets', () => {
  const m = (a, b) => I.moisComplets(I.parseISO(a), I.parseISO(b));
  assert.strictEqual(m('2020-03-01', '2020-03-30'), 0);
  assert.strictEqual(m('2020-03-01', '2020-03-31'), 1);
  assert.strictEqual(m('2020-03-15', '2020-04-13'), 0);
  assert.strictEqual(m('2020-03-15', '2020-04-14'), 1);
  assert.strictEqual(m('2015-03-01', '2026-03-31'), 133);
  assert.strictEqual(m('2020-01-31', '2020-02-28'), 0);
  assert.strictEqual(m('2020-01-31', '2020-02-29'), 1);
  assert.strictEqual(m('2026-01-01', '2026-01-01'), 0);
});
// 5. Salaire de référence : formule des 3 mois plus favorable, prime annuelle proratisée.
t('ref 3 mois', () => {
  // 3 derniers mois : 2 500 × 3 + prime de 1 200 → (7500 + 300)/3 = 2 600 > moyenne 12 mois 2 300.
  const r = I.calc({ entree: '2016-01-01', fin: '2025-12-31', moyenne12: 2300, total3: 8700, primes3: 1200 });
  assert.strictEqual(r.salaire_reference, 2600); assert.strictEqual(r.formule, '3 mois'); assert.strictEqual(r.minimum, 6500);
});
t('ref 12 mois', () => { const r = I.calc({ entree: '2016-01-01', fin: '2025-12-31', moyenne12: 2300, total3: 6600 }); assert.strictEqual(r.formule, '12 mois'); assert.strictEqual(r.minimum, 5750); });
// 6. Mois déduits et comparaison au montant proposé.
t('déduction', () => { const r = I.calc({ entree: '2014-01-01', fin: '2025-12-31', moyenne12: 2000, moisDeduits: 24 }); assert.strictEqual(r.mois, 120); assert.strictEqual(r.minimum, 5000); });
t('proposé', () => {
  const r = I.calc({ entree: '2021-01-01', fin: '2025-12-31', moyenne12: 2000, propose: 2400 });
  assert.strictEqual(r.propose_suffisant, false); assert.strictEqual(r.ecart, -100);
});
// 7. Erreurs.
t('erreurs', () => {
  assert.throws(() => I.calc({ entree: '2025-12-31', fin: '2025-01-01', moyenne12: 2000 }));
  assert.throws(() => I.calc({ entree: '2025-02-30', fin: '2025-12-01', moyenne12: 2000 }));
  assert.throws(() => I.calc({ entree: '2025-01-01', fin: '2025-12-01' }));
});
// 8. Oracle indépendant (années + mois en arithmétique entière, pas de Date) sur 20 000 cas aléatoires.
t('oracle', () => {
  let seed = 42; const rnd = n => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed % n; };
  for (let k = 0; k < 20000; k++) {
    const mois = rnd(500), ref = 1000 + rnd(9000) + rnd(100) / 100;
    const a = Math.floor(mois / 12), m = mois % 12;
    let exp = a < 10 ? (a * ref / 4 + m * ref / 48) : (10 * ref / 4 + (a - 10) * ref / 3 + m * ref / 36);
    const got = I.montantLegal(ref, mois);
    assert.ok(Math.abs(got - exp) < 1e-6, mois + ' mois, ' + ref + ' : ' + got + ' ≠ ' + exp);
  }
});
// 9. Mois complets via dates = oracle entier quand l'entrée est un 1er du mois.
t('dates 1er du mois', () => {
  for (let y = 2000; y < 2026; y++) for (let mo = 1; mo <= 12; mo++) {
    const n = (y * 7 + mo * 13) % 300;
    const e = new Date(Date.UTC(y, mo - 1, 1)), f = new Date(Date.UTC(y, mo - 1 + n, 0));
    if (n === 0) continue;
    assert.strictEqual(I.moisComplets(e, f), n);
  }
});
t('copie publiée identique', () => assert.strictEqual(fs.readFileSync(PUB, 'utf8'), fs.readFileSync(SRC, 'utf8')));
console.log(passed + ' tests OK' + (process.exitCode ? ' (avec échecs)' : ''));
