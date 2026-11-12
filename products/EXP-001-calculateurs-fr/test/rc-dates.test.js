// Tests du calculateur : node products/EXP-001-calculateurs-fr/test/rc-dates.test.js
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const SRC = path.join(__dirname, '..', 'src', 'rc-dates.js');
const PUB = path.join(__dirname, '..', '..', '..', 'docs', 'rupture-conventionnelle-dates', 'rc-dates.js');
const R = require(SRC);
let passed = 0;
function t(name, fn) { fn(); passed++; }

// 1. Les 4 cas de test de la fiche EXP-001 (tableau « Cas de test »).
const CAS = [
  ['2015-02-26', '2015-03-15', '2015-03-13', '2015-04-01', '2015-04-01', '2015-04-02'], // notice DREETS Normandie
  ['2026-11-02', null,         '2026-11-17', '2026-12-05', '2026-12-07', '2026-12-08'], // = travail-industrie.com
  ['2026-10-17', null,         '2026-11-02', '2026-11-21', '2026-11-23', '2026-11-24'],
  ['2026-04-21', null,         '2026-05-06', '2026-05-28', '2026-05-28', '2026-05-29'],
];
for (const [s, rec, fr, fib, fi, rup] of CAS) {
  t('cas ' + s, () => {
    const r = R.calc(s, { reception: rec || undefined });
    assert.strictEqual(R.iso(r.fin_retractation), fr, s + ' fin rétractation');
    assert.strictEqual(R.iso(r.fin_instruction_brute), fib, s + ' fin instruction brute');
    assert.strictEqual(R.iso(r.fin_instruction), fi, s + ' fin instruction prudente');
    assert.strictEqual(R.iso(r.rupture_au_plus_tot), rup, s + ' rupture');
  });
}

// 2. Jours fériés connus.
t('Pâques', () => {
  for (const [y, e] of [[2015, '2015-04-05'], [2024, '2024-03-31'], [2025, '2025-04-20'], [2026, '2026-04-05'], [2027, '2027-03-28'], [2038, '2038-04-25']])
    assert.strictEqual(R.iso(R.easter(y)), e);
});
t('fériés 2026', () => {
  const h = Object.keys(R.holidays(2026)).sort();
  assert.deepStrictEqual(h, ['2026-01-01', '2026-04-06', '2026-05-01', '2026-05-08', '2026-05-14', '2026-05-25', '2026-07-14', '2026-08-15', '2026-11-01', '2026-11-11', '2026-12-25']);
  assert.strictEqual(Object.keys(R.holidays(2026, true)).length, 13);
  assert.ok(R.holidays(2026, true)['2026-04-03'] && R.holidays(2026, true)['2026-12-26']);
});
t('Alsace-Moselle décale la fin', () => {
  // Instruction couvrant le 26/12 : le régime local doit retarder la fin d'au moins 1 jour.
  const g = R.calc('2026-11-25'), am = R.calc('2026-11-25', { alsaceMoselle: true });
  assert.ok(am.fin_instruction_brute > g.fin_instruction_brute);
});
t('dates invalides', () => {
  assert.strictEqual(R.parseISO('2026-02-31'), null);
  assert.strictEqual(R.parseISO('abc'), null);
  assert.throws(() => R.calc('2026-02-30'));
});
t('formatFR', () => {
  assert.strictEqual(R.formatFR(R.parseISO('2026-11-01')), 'dimanche 1er novembre 2026');
  assert.strictEqual(R.formatFR(R.parseISO('2026-12-07')), 'lundi 7 décembre 2026');
});
t('ics', () => {
  const ics = R.toICS([{ date: R.parseISO('2026-12-07'), titre: 'Fin, test; ok' }]);
  assert.ok(ics.includes('DTSTART;VALUE=DATE:20261207') && ics.includes('DTEND;VALUE=DATE:20261208') && ics.includes('Fin\\, test\\; ok'));
});
t('fuseau horaire sans effet', () => {
  // Les calculs sont en UTC : on vérifie un changement d'heure (fin mars / fin octobre).
  assert.strictEqual(R.iso(R.calc('2026-03-20').fin_retractation), '2026-04-07'); // 4 avr. samedi → lundi 6 férié → 7
});

// 3. Comparaison exhaustive avec l'oracle Python (2015-2032, réception par défaut + réception décalée).
t('oracle', () => {
  const data = JSON.parse(execFileSync('python3', ['-I', path.join(__dirname, 'oracle_dump.py')], { maxBuffer: 64 << 20 }));
  const keys = ['fin_retractation', 'envoi_au_plus_tot', 'reception', 'fin_instruction_brute', 'fin_instruction', 'rupture_au_plus_tot'];
  for (const o of data) {
    const r = R.calc(o.signature, { reception: o.reception || undefined });
    for (const k of keys) assert.strictEqual(R.iso(r[k]), o[k], `${o.signature}/${o.reception} ${k}`);
  }
  console.log('  oracle : ' + data.length + ' combinaisons identiques');
});

// 4. La copie publiée dans docs/ est identique à la source.
t('copie publiée', () => assert.strictEqual(fs.readFileSync(PUB, 'utf8'), fs.readFileSync(SRC, 'utf8')));

console.log('OK — ' + passed + ' tests');
