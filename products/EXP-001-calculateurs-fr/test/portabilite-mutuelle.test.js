// Tests : node products/EXP-001-calculateurs-fr/test/portabilite-mutuelle.test.js
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const SRC = path.join(__dirname, '..', 'src', 'portabilite-mutuelle.js');
const PUB = path.join(__dirname, '..', '..', '..', 'docs', 'mutuelle-apres-rupture-conventionnelle', 'portabilite-mutuelle.js');
const P = require(SRC);
let passed = 0;
function t(name, fn) { try { fn(); passed++; } catch (e) { console.error('ÉCHEC ' + name + ' : ' + e.message); process.exitCode = 1; } }
const I = d => P.iso(d);

// Exemple publié par un assureur (magnolia.fr) : CDD de 4 mois et 4 jours → 5 mois de portabilité.
t('4 mois et 4 jours → 5 mois', () => {
  const r = P.calc({ entree: '2026-01-01', fin: '2026-05-04', aujourdhui: '2026-05-05' });
  assert.deepStrictEqual([r.duree.mois, r.duree.jours, r.mois], [4, 4, 5]);
  assert.strictEqual(I(r.debut), '2026-05-05');
  assert.strictEqual(I(r.fin_portabilite), '2026-10-04');
});
t('4 mois pile → 4 mois (pas d\'arrondi)', () => {
  const r = P.calc({ entree: '2026-01-01', fin: '2026-04-30', aujourdhui: '2026-05-01' });
  assert.deepStrictEqual([r.duree.mois, r.duree.jours, r.mois], [4, 0, 4]);
  assert.strictEqual(I(r.fin_portabilite), '2026-08-31');
});
t('contrat de 10 jours → 1 mois', () => {
  const r = P.calc({ entree: '2026-03-01', fin: '2026-03-10', aujourdhui: '2026-03-11' });
  assert.strictEqual(r.mois, 1);
  assert.strictEqual(I(r.fin_portabilite), '2026-04-10');
  assert.strictEqual(r.contrat_court, true);
});
t('4 ans d\'ancienneté → plafond 12 mois', () => {
  const r = P.calc({ entree: '2022-09-01', fin: '2026-12-08', aujourdhui: '2026-11-13' });
  assert.strictEqual(r.mois, 12);
  assert.strictEqual(r.plafonne, true);
  assert.strictEqual(I(r.debut), '2026-12-09');
  assert.strictEqual(I(r.fin_portabilite), '2027-12-08');
  assert.strictEqual(I(r.limite_evin), '2028-06-08');
  assert.strictEqual(I(r.proposition_assureur), '2028-02-08');
  assert.strictEqual(r.contrat_court, false);
});
t('fin au 31 mars, 12 mois → 31 mars suivant', () => {
  const r = P.calc({ entree: '2020-01-01', fin: '2026-03-31', aujourdhui: '2026-04-01' });
  assert.strictEqual(I(r.fin_portabilite), '2027-03-31');
});
t('exactement 12 mois → 12, non plafonné', () => {
  const r = P.calc({ entree: '2025-12-09', fin: '2026-12-08' });
  assert.deepStrictEqual([r.mois, r.plafonne], [12, false]);
});
t('reprise d\'emploi avant la fin → portabilité coupée', () => {
  const r = P.calc({ entree: '2020-01-01', fin: '2026-12-08', arret: '2027-04-01', aujourdhui: '2026-12-10' });
  assert.strictEqual(r.coupee_par_arret, true);
  assert.strictEqual(I(r.fin_portabilite), '2027-04-01');
  assert.strictEqual(I(r.fin_max), '2027-12-08');
  assert.strictEqual(I(r.limite_evin), '2027-10-01');
});
t('arrêt après la fin théorique → sans effet', () => {
  const r = P.calc({ entree: '2020-01-01', fin: '2026-12-08', arret: '2028-01-15' });
  assert.strictEqual(r.coupee_par_arret, false);
  assert.strictEqual(I(r.fin_portabilite), '2027-12-08');
});
t('arrêt avant la fin du contrat → alerte, ignoré', () => {
  const r = P.calc({ entree: '2020-01-01', fin: '2026-12-08', arret: '2026-11-01' });
  assert.strictEqual(r.alertes.length, 1);
  assert.strictEqual(r.coupee_par_arret, false);
});
t('jours restants', () => {
  const r = P.calc({ entree: '2026-01-01', fin: '2026-04-30', aujourdhui: '2026-08-01' });
  assert.strictEqual(r.jours_restants, 30);
  assert.strictEqual(r.terminee, false);
});
t('entrée le 31 janvier, fin le 27 février → 1 mois', () => {
  const r = P.calc({ entree: '2026-01-31', fin: '2026-02-27' });
  assert.strictEqual(r.mois, 1);
});
t('erreurs de saisie', () => {
  assert.throws(() => P.calc({ entree: '2026-05-01', fin: '2026-04-30' }));
  assert.throws(() => P.calc({ entree: '', fin: '2026-04-30' }));
  assert.throws(() => P.calc({ entree: '2026-01-01', fin: '2026-02-30' }));
});
t('fichier .ics : 2 rappels', () => {
  const r = P.calc({ entree: '2022-09-01', fin: '2026-12-08' });
  const ics = P.toICS(r);
  assert.strictEqual((ics.match(/BEGIN:VEVENT/g) || []).length, 2);
  assert.ok(ics.includes('DTSTART;VALUE=DATE:20271108'));
  assert.ok(ics.includes('DTSTART;VALUE=DATE:20280508'));
});

// Oracle indépendant : on avance jour par jour, en comptant un mois chaque fois qu'on franchit le même quantième
// (ou le dernier jour du mois quand le quantième n'existe pas). Durée arrondie = nombre de mois entamés.
function oracleMois(entreeISO, finISO) {
  const e = new Date(entreeISO + 'T00:00:00Z');
  const f = new Date(finISO + 'T00:00:00Z');
  const lendemain = new Date(f.getTime() + 86400000);
  let k = 0;
  for (;;) {
    const y = e.getUTCFullYear(), m = e.getUTCMonth() + k; // m 0-based, peut dépasser 11
    const yy = y + Math.floor(m / 12), mm = m % 12;
    const dim = new Date(Date.UTC(yy, mm + 1, 0)).getUTCDate();
    const borne = new Date(Date.UTC(yy, mm, Math.min(e.getUTCDate(), dim)));
    if (borne.getTime() >= lendemain.getTime()) return k;
    k++;
  }
}
t('20 000 cas aléatoires contre l\'oracle', () => {
  let seed = 42; const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  const base = Date.UTC(2015, 0, 1);
  for (let i = 0; i < 20000; i++) {
    const e = new Date(base + Math.floor(rnd() * 4000) * 86400000);
    const f = new Date(e.getTime() + Math.floor(rnd() * 900) * 86400000);
    const r = P.calc({ entree: P.iso(e), fin: P.iso(f) });
    const attendu = Math.min(oracleMois(P.iso(e), P.iso(f)), 12);
    if (r.mois !== attendu) throw new Error(P.iso(e) + ' → ' + P.iso(f) + ' : ' + r.mois + ' ≠ ' + attendu);
    if (r.fin_portabilite.getTime() < f.getTime()) throw new Error('fin avant le contrat');
  }
});
t('copie publiée identique à la source', () => {
  assert.strictEqual(fs.readFileSync(PUB, 'utf8'), fs.readFileSync(SRC, 'utf8'));
});

console.log(passed + ' tests OK' + (process.exitCode ? ' (avec échecs)' : ''));
