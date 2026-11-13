// Tests : node products/EXP-001-calculateurs-fr/test/delais-contestation.test.js
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const SRC = path.join(__dirname, '..', 'src', 'delais-contestation.js');
const PUB = path.join(__dirname, '..', '..', '..', 'docs', 'delais-contestation-rupture', 'delais-contestation.js');
const D = require(SRC);
let passed = 0;
function t(name, fn) { try { fn(); passed++; } catch (e) { console.error('ÉCHEC ' + name + ' : ' + e.message); process.exitCode = 1; } }
const lim = (r, id) => D.iso(r.delais.find(d => d.id === id).limite);

// Date à date (C. proc. civ. art. 641) : exemple usuel homologation 11/07/2024 → 11/07/2025.
t('RC : 12 mois de date à date', () => {
  const r = D.calc({ fin: '2024-07-12', homologation: '2024-07-11', aujourdhui: '2024-08-01' });
  assert.strictEqual(lim(r, 'rc'), '2025-07-11');
});
t('fin de mois : 31 août + 6 mois = 28 février (année non bissextile)', () => assert.strictEqual(D.iso(D.addMonths(D.parseISO('2026-08-31'), 6)), '2027-02-28'));
t('fin de mois : 31 août + 6 mois = 29 février (année bissextile)', () => assert.strictEqual(D.iso(D.addMonths(D.parseISO('2027-08-31'), 6)), '2028-02-29'));
t('29 février + 12 mois = 28 février', () => assert.strictEqual(D.iso(D.addMonths(D.parseISO('2028-02-29'), 12)), '2029-02-28'));
t('31 mars − 1 mois = 28 février', () => assert.strictEqual(D.iso(D.addMonths(D.parseISO('2027-03-31'), -1)), '2027-02-28'));
t('passage d\'année : 15/11 + 6 mois = 15/05', () => assert.strictEqual(D.iso(D.addMonths(D.parseISO('2026-11-15'), 6)), '2027-05-15'));

t('cas complet : RC 2026', () => {
  const r = D.calc({ fin: '2026-12-09', homologation: '2026-12-08', stc: '2026-12-09', aujourdhui: '2026-11-13' });
  assert.strictEqual(lim(r, 'rc'), '2027-12-08');
  assert.strictEqual(lim(r, 'stc'), '2027-06-09');
  assert.strictEqual(lim(r, 'salaire'), '2029-12-09');
  assert.strictEqual(lim(r, 'execution'), '2028-12-09');
  assert.strictEqual(lim(r, 'discrimination'), '2031-12-09');
  assert.strictEqual(D.iso(r.salaires_depuis), '2023-12-09');
  assert.strictEqual(r.prochain.id, 'stc');
  assert.strictEqual(r.delais.find(d => d.id === 'stc').jours_restants, 208);
  assert.deepStrictEqual(r.alertes, []);
  assert.strictEqual(r.connaissance_par_defaut, true);
});
t('sans homologation ni STC : 3 délais', () => {
  const r = D.calc({ fin: '2026-01-15', aujourdhui: '2026-11-13' });
  assert.deepStrictEqual(r.delais.map(d => d.id), ['salaire', 'execution', 'discrimination']);
});
t('date de découverte antérieure : délais avancés', () => {
  const r = D.calc({ fin: '2026-06-30', connaissance: '2025-03-10', aujourdhui: '2026-11-13' });
  assert.strictEqual(lim(r, 'execution'), '2027-03-10');
  assert.strictEqual(lim(r, 'salaire'), '2028-03-10');
  assert.strictEqual(r.connaissance_par_defaut, false);
});
t('délai dépassé', () => {
  const r = D.calc({ fin: '2025-01-10', homologation: '2025-01-09', stc: '2025-01-10', aujourdhui: '2026-11-13' });
  const rc = r.delais.find(d => d.id === 'rc');
  assert.strictEqual(rc.depasse, true);
  assert.strictEqual(r.delais.find(d => d.id === 'stc').depasse, true);
  assert.strictEqual(r.prochain.id, 'execution');
});
t('jour limite = aujourd\'hui : pas dépassé, 0 jour', () => {
  const r = D.calc({ fin: '2025-11-14', homologation: '2025-11-13', aujourdhui: '2026-11-13' });
  const rc = r.delais.find(d => d.id === 'rc');
  assert.strictEqual(rc.jours_restants, 0); assert.strictEqual(rc.depasse, false);
});
t('alertes de cohérence', () => {
  const r = D.calc({ fin: '2026-12-09', homologation: '2026-12-10', stc: '2026-12-01', aujourdhui: '2026-11-13' });
  assert.strictEqual(r.alertes.length, 2);
});
t('erreurs de saisie', () => {
  assert.throws(() => D.calc({}), /fin de contrat/);
  assert.throws(() => D.calc({ fin: '2026-02-30' }), /fin de contrat/);
  assert.throws(() => D.calc({ fin: '2026-02-10', stc: 'x' }), /solde/);
});
t('week-end signalé', () => {
  const r = D.calc({ fin: '2026-12-09', stc: '2026-12-12', aujourdhui: '2026-11-13' }); // 12/06/2027 = samedi
  const s = r.delais.find(d => d.id === 'stc');
  assert.strictEqual(lim(r, 'stc'), '2027-06-12'); assert.strictEqual(s.week_end, true);
});
t('formatFR', () => assert.strictEqual(D.formatFR(D.parseISO('2027-12-01')), 'mercredi 1er décembre 2027'));
t('ICS : un rappel 1 mois avant chaque date limite', () => {
  const r = D.calc({ fin: '2026-12-09', homologation: '2026-12-08', aujourdhui: '2026-11-13' });
  const ics = D.toICS(r.delais);
  assert.strictEqual((ics.match(/BEGIN:VEVENT/g) || []).length, 4);
  assert.ok(ics.includes('DTSTART;VALUE=DATE:20271108'));
  assert.ok(/\r\n$/.test(ics));
});
// Contrôle indépendant de addMonths contre un calcul naïf sur 20 000 cas.
t('addMonths vs oracle naïf (20 000 cas)', () => {
  for (let i = 0; i < 20000; i++) {
    const y = 2000 + (i % 40), m = 1 + (i * 7) % 12, d = 1 + (i * 13) % 31, n = (i * 11) % 73 - 12;
    const dim = new Date(Date.UTC(y, m, 0)).getUTCDate(); if (d > dim) continue;
    let ty = y, tm = m + n; while (tm > 12) { tm -= 12; ty++; } while (tm < 1) { tm += 12; ty--; }
    const tdim = new Date(Date.UTC(ty, tm, 0)).getUTCDate();
    const exp = `${ty}-${String(tm).padStart(2, '0')}-${String(Math.min(d, tdim)).padStart(2, '0')}`;
    const got = D.iso(D.addMonths(D.ymd(y, m, d), n));
    if (got !== exp) throw new Error(`${y}-${m}-${d} + ${n} : ${got} ≠ ${exp}`);
  }
});
t('copie publiée identique', () => assert.strictEqual(fs.readFileSync(PUB, 'utf8'), fs.readFileSync(SRC, 'utf8')));
console.log(passed + ' tests OK' + (process.exitCode ? ' (avec échecs)' : ''));
