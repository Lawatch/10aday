// Tests : node products/EXP-001-calculateurs-fr/test/iccp.test.js
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const SRC = path.join(__dirname, '..', 'src', 'iccp.js');
const PUB = path.join(__dirname, '..', '..', '..', 'docs', 'indemnite-conges-payes-depart', 'iccp.js');
const I = require(SRC);
let passed = 0;
function t(name, fn) { try { fn(); passed++; } catch (e) { console.error('ÉCHEC ' + name + ' : ' + e.message); process.exitCode = 1; } }

// 1. Exemple officiel (fiche service-public / Code du travail numérique, 06/02/2026) :
//    24 000 € sur la période (2 000 €/mois), 2 semaines de congés, mois de 21 jours ouvrés.
//    Maintien = 2 000 × 10 / 21 = 952,38 € ; 1/10e = 2 400 × 10/25 = 960,00 € → 960,00 €.
t('exemple officiel en jours ouvrés', () => {
  const r = I.calc({ unite: 'ouvres', salaire: 2000, joursMois: 21, periodes: [{ restants: 10, acquis: 25, brut: 24000 }] });
  assert.strictEqual(r.periodes[0].maintien, 952.38);
  assert.strictEqual(r.periodes[0].dixieme, 960);
  assert.strictEqual(r.periodes[0].methode, 'dixieme');
  assert.strictEqual(r.total, 960);
});
// 2. Même exemple en jours ouvrables : (24 000 / 10) × 12/30 = 960,00 €.
t('exemple officiel en jours ouvrables', () => {
  const r = I.calc({ unite: 'ouvrables', salaire: 2000, joursMois: 25.2, periodes: [{ restants: 12, acquis: 30, brut: 24000 }] });
  assert.strictEqual(r.periodes[0].dixieme, 960);
  assert.strictEqual(r.total, 960);
});
// 3. Augmentation récente : le maintien l'emporte.
t('maintien plus favorable après augmentation', () => {
  const r = I.calc({ salaire: 2600, periodes: [{ restants: 13, acquis: 30, brut: 24000 }] }); // défaut ouvrables, 26 j/mois
  assert.strictEqual(r.joursMois, 26); assert.ok(r.joursMoisDefaut);
  assert.strictEqual(r.periodes[0].maintien, 1300); // 2 600 × 13 / 26
  assert.strictEqual(r.periodes[0].dixieme, 1040); // 2 400 × 13/30
  assert.strictEqual(r.periodes[0].methode, 'maintien');
  assert.strictEqual(r.total, 1300);
});
// 4. Acquisition : 2,5 j/mois, arrondi à l'entier supérieur (L3141-7), plafond 30.
t('acquisition travail', () => {
  assert.strictEqual(I.acquis({ moisTravail: 5 }).jours, 13); // 12,5 → 13
  assert.strictEqual(I.acquis({ moisTravail: 12 }).jours, 30);
  assert.strictEqual(I.acquis({ moisTravail: 0 }).jours, 0);
  assert.strictEqual(I.acquis({ moisTravail: 4, unite: 'ouvres' }).jours, 9); // 10 × 5/6 = 8,33 → 9
  assert.strictEqual(I.acquis({ moisTravail: 12, unite: 'ouvres' }).jours, 25);
});
// 5. Arrêt maladie non professionnel : 2 j/mois, 24 j max par période (L3141-5-1).
t('acquisition maladie', () => {
  const a = I.acquis({ moisTravail: 6, moisMaladie: 6 });
  assert.strictEqual(a.travail, 15); assert.strictEqual(a.maladie, 12); assert.strictEqual(a.jours, 27);
  const b = I.acquis({ moisMaladie: 12 });
  assert.strictEqual(b.maladie, 24); assert.strictEqual(b.jours, 24); assert.ok(!b.maladie_plafonnee);
  const c = I.acquis({ moisTravail: 11, moisMaladie: 1 }); // 27,5 + 2 = 29,5 → 30
  assert.strictEqual(c.jours, 30);
  assert.throws(() => I.acquis({ moisTravail: 8, moisMaladie: 6 }), /12 mois/);
});
// 6. Mois d'arrêt maladie : rémunération prise en compte à 80 % dans la base du 1/10e (L3141-24 I 4°).
t('base 1/10e avec maladie à 80 %', () => {
  // 6 mois travaillés à 2 000 € (12 000 €) + 6 mois d'arrêt → 0,8 × 2 000 × 6 = 9 600 € ; base 21 600 €.
  const r = I.calc({ salaire: 2000, periodes: [{ restants: 27, acquis: 27, brut: 12000, moisMaladie: 6 }] });
  const p = r.periodes[0];
  assert.strictEqual(p.maladie80, 9600); assert.strictEqual(p.base, 21600);
  assert.strictEqual(p.dixieme, 2160);
  assert.strictEqual(p.maintien, 2076.92); // 2 000 × 27 / 26
  assert.strictEqual(r.total, 2160);
});
// 7. Deux périodes (reliquat N-1 + période en cours) : on additionne, chacune avec sa méthode.
t('deux périodes', () => {
  const r = I.calc({ salaire: 2600, periodes: [
    { restants: 13, acquis: 13, brut: 13000 }, // en cours : 1 300 vs 1 300 → égal
    { restants: 5, acquis: 30, brut: 30000 }    // reliquat : 500 vs 2 600 × 5/26 = 500 → égal
  ] });
  assert.strictEqual(r.periodes[0].methode, 'egal');
  assert.strictEqual(r.total, 1800); assert.strictEqual(r.restants, 18);
});
// 8. Période sans jour restant ignorée ; aucune période restante → erreur.
t('zéro jour', () => {
  const r = I.calc({ salaire: 2000, periodes: [{ restants: 0, acquis: 30, brut: 0 }, { restants: 2, acquis: 20, brut: 20000 }] });
  assert.strictEqual(r.periodes[0].montant, 0); assert.strictEqual(r.total, 200);
  assert.throws(() => I.calc({ salaire: 2000, periodes: [{ restants: 0, acquis: 30 }] }), /Aucun jour/);
});
// 9. Saisies invalides.
t('erreurs', () => {
  assert.throws(() => I.calc({ salaire: 2000, periodes: [{ restants: 31, acquis: 30, brut: 1 }] }), /plus de jours/);
  assert.throws(() => I.calc({ salaire: '', periodes: [{ restants: 1, acquis: 30 }] }), /Salaire/);
  assert.throws(() => I.calc({ salaire: -5, periodes: [{ restants: 1, acquis: 30 }] }), /positif/);
  assert.throws(() => I.calc({ salaire: 2000, unite: 'heures', periodes: [] }), /Unité/);
  assert.strictEqual(I.calc({ salaire: '2 000,50', periodes: [{ restants: '1', acquis: '26', brut: '0' }] }).total, 76.94); // 2 000,50 ÷ 26
});
// 10. Propriété : le montant retenu n'est jamais inférieur au maintien ni au 1/10e (5 000 cas aléatoires).
t('montant = max des deux méthodes', () => {
  let seed = 42; const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  for (let i = 0; i < 5000; i++) {
    const acq = 1 + Math.floor(rnd() * 30), rest = Math.floor(rnd() * (acq + 1)) || 1;
    const sal = 1500 + Math.round(rnd() * 5000), brut = Math.round(rnd() * 60000), mm = Math.floor(rnd() * 6);
    const r = I.calc({ salaire: sal, periodes: [{ restants: rest, acquis: acq, brut, moisMaladie: mm }] });
    const p = r.periodes[0];
    const d = (brut + 0.8 * sal * mm) / 10 * rest / acq, m = sal * rest / 26;
    assert.ok(Math.abs(p.montant - Math.max(d, m)) < 0.006, 'cas ' + i);
    assert.ok(p.montant >= p.dixieme && p.montant >= p.maintien);
  }
});
// 11. Copie publiée identique à la source.
t('copie publiée identique', () => {
  assert.strictEqual(fs.readFileSync(PUB, 'utf8'), fs.readFileSync(SRC, 'utf8'));
});
console.log(passed + ' tests OK' + (process.exitCode ? ' (avec échecs)' : ''));
