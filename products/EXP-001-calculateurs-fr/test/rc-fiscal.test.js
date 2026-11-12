// Tests : node products/EXP-001-calculateurs-fr/test/rc-fiscal.test.js
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const SRC = path.join(__dirname, '..', 'src', 'rc-fiscal.js');
const PUB = path.join(__dirname, '..', '..', '..', 'docs', 'rupture-conventionnelle-impot-csg', 'rc-fiscal.js');
const F = require(SRC);
let passed = 0;
function t(name, fn) { try { fn(); passed++; } catch (e) { console.error('ÉCHEC ' + name + ' : ' + e.message); process.exitCode = 1; } }
function eq(r, exp) { for (const k of Object.keys(exp)) assert.strictEqual(r[k], exp[k], k + ' = ' + r[k] + ' (attendu ' + exp[k] + ')'); }

// Cas chiffrés à la main (PASS 2026 = 48 060 € ; 2 PASS = 96 120 ; 6 PASS = 288 360 ; 10 PASS = 480 600).
t('cas courant : CSG sur la part au-delà du légal', () => eq(F.calc({ indemnite: 20000, legal: 8000, remuneration: 40000 }),
  { exonere_ir: 20000, imposable_ir: 0, exonere_cotisations: 20000, base_cotisations: 0, exonere_csg: 8000, base_csg: 12000, csg: 1104, crds: 60, csg_crds: 1164, net_avant_impot: 18836, csg_deductible: 816 }));
t('indemnité = minimum légal : rien à payer', () => eq(F.calc({ indemnite: 10000, legal: 10000, remuneration: 30000 }),
  { exonere_ir: 10000, base_cotisations: 0, base_csg: 0, csg_crds: 0, net_avant_impot: 10000 }));
t('au-delà de 2 PASS et de 2 × salaire', () => eq(F.calc({ indemnite: 150000, legal: 30000, remuneration: 60000 }),
  { critere_a: 120000, exonere_ir: 120000, imposable_ir: 30000, exonere_cotisations: 96120, base_cotisations: 53880, exonere_csg: 30000, base_csg: 120000, csg: 11040, crds: 600 }));
t('plus de 10 PASS : tout soumis à cotisations et CSG', () => eq(F.calc({ indemnite: 500000, legal: 100000, remuneration: 100000 }),
  { critere_a: 250000, exonere_ir: 250000, plus_10_pass: true, exonere_cotisations: 0, base_cotisations: 500000, exonere_csg: 0, base_csg: 500000 }));
t('critère a plafonné à 6 PASS', () => eq(F.calc({ indemnite: 400000, legal: 50000, remuneration: 200000 }),
  { critere_a: 288360, critere_a_plafonne: true, exonere_ir: 288360, imposable_ir: 111640, exonere_cotisations: 96120, exonere_csg: 50000, base_csg: 350000 }));
t('montant conventionnel au-delà de 6 PASS : non plafonné pour l\'IR', () => eq(F.calc({ indemnite: 350000, legal: 300000, remuneration: 0 }),
  { critere_a: 175000, critere_retenu: 'b', exonere_ir: 300000, exonere_cotisations: 96120, exonere_csg: 96120 }));
t('droit à la retraite : imposable, cotisations limitées comme a/b', () => eq(F.calc({ indemnite: 20000, legal: 8000, remuneration: 40000, retraite: true }),
  { exonere_ir: 0, imposable_ir: 20000, exonere_cotisations: 20000, exonere_csg: 8000, base_csg: 12000 }));
t('droit à la retraite, 50 % : cotisations limitées au plus élevé de a/b', () => eq(F.calc({ indemnite: 30000, legal: 5000, remuneration: 0, retraite: true }),
  { exonere_ir: 0, exonere_cotisations: 15000, base_cotisations: 15000, exonere_csg: 5000 }));
t('PASS 2025', () => eq(F.calc({ indemnite: 150000, legal: 30000, remuneration: 60000, annee: 2025 }),
  { pass: 47100, exonere_cotisations: 94200, base_cotisations: 55800 }));
t('rémunération non saisie signalée', () => { assert.strictEqual(F.calc({ indemnite: 1, legal: 1 }).remuneration_fournie, false); assert.strictEqual(F.calc({ indemnite: 1, legal: 1, remuneration: '0' }).remuneration_fournie, true); });
t('saisies invalides', () => {
  assert.throws(() => F.calc({ legal: 1000 }));
  assert.throws(() => F.calc({ indemnite: 1000, legal: -1 }));
  assert.throws(() => F.calc({ indemnite: 1000, legal: 1000, annee: 2019 }));
  assert.strictEqual(F.calc({ indemnite: '1 000,50', legal: '1000' }).indemnite, 1000.5);
});

// Contrôle indépendant : oracle écrit par branches (lecture littérale des textes), 20 000 cas aléatoires.
function oracle(I, L, R, retraite, pass) {
  let a = 2 * R; if (I / 2 > a) a = I / 2; if (a > 6 * pass) a = 6 * pass;
  const ab = L > a ? L : a;
  let ir = 0; if (!retraite) ir = I < ab ? I : ab;
  let cot = 0;
  if (I <= 10 * pass) { const base = retraite ? (I < ab ? I : ab) : ir; cot = base < 2 * pass ? base : 2 * pass; }
  let csg = 0; if (I <= 10 * pass) csg = L < cot ? L : cot;
  return [ir, cot, csg];
}
let seed = 42; const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
t('20 000 cas vs oracle', () => {
  for (let i = 0; i < 20000; i++) {
    const I = Math.round(rnd() * 700000), L = Math.round(rnd() * I * 1.3), R = Math.round(rnd() * 250000), ret = rnd() < 0.2, an = rnd() < 0.5 ? 2025 : 2026;
    const r = F.calc({ indemnite: I, legal: L, remuneration: R, retraite: ret, annee: an });
    const [ir, cot, csg] = oracle(I, L, R, ret, F.PASS[an]);
    assert.strictEqual(r.exonere_ir, Math.round(ir * 100) / 100, 'IR ' + [I, L, R, ret, an]);
    assert.strictEqual(r.exonere_cotisations, Math.round(cot * 100) / 100, 'cot ' + [I, L, R, ret, an]);
    assert.strictEqual(r.exonere_csg, Math.round(csg * 100) / 100, 'csg ' + [I, L, R, ret, an]);
    assert.ok(r.exonere_csg <= r.exonere_cotisations && r.exonere_cotisations <= I);
  }
});
t('copie publiée identique', () => assert.strictEqual(fs.readFileSync(PUB, 'utf8'), fs.readFileSync(SRC, 'utf8')));
console.log(passed + ' tests OK' + (process.exitCode ? ' (avec échecs)' : ''));
