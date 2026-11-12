// Tests : node products/EXP-001-calculateurs-fr/test/chomage-differe.test.js
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const SRC = path.join(__dirname, '..', 'src', 'chomage-differe.js');
const PUB = path.join(__dirname, '..', '..', '..', 'docs', 'chomage-rupture-conventionnelle', 'chomage-differe.js');
const C = require(SRC);
let passed = 0;
function t(name, fn) { try { fn(); passed++; } catch (e) { console.error('ÉCHEC ' + name + ' : ' + e.message); process.exitCode = 1; } }

// 1. Exemple Unédic « Différé congés payés » : fin 30/11, 17 j de différé CP + 7 j → indemnisé à partir du 25/12.
t('unédic CP 17 j', () => {
  const r = C.calc({ fin: '2025-11-30', iccp: 1700, sjr: 100 });
  assert.strictEqual(r.differe_cp, 17); assert.strictEqual(r.fin_differes, '2025-12-17');
  assert.strictEqual(r.debut_indemnisation, '2025-12-25');
});
// 2. Même exemple, inscription tardive le 20/12 → indemnisé à partir du 27/12.
t('unédic inscription tardive', () => {
  const r = C.calc({ fin: '2025-11-30', iccp: 1700, sjr: 100, inscription: '2025-12-20' });
  assert.ok(r.inscription_tardive); assert.strictEqual(r.debut_attente, '2025-12-20'); assert.strictEqual(r.debut_indemnisation, '2025-12-27');
});
// 3. Exemple Unédic 2026 « Nadia » : 1 372 € supra-légaux ÷ 111,8 = 12 jours (12,27 → 12).
t('nadia 12 jours', () => {
  const r = C.calc({ fin: '2026-11-01', indemnite: 1372, legale: 0, inscription: '2026-11-10' });
  assert.strictEqual(r.diviseur, 111.8); assert.strictEqual(r.differe_specifique, 12);
  assert.strictEqual(r.fin_differes, '2026-11-13'); assert.ok(!r.inscription_tardive);
  // Unédic écrit « à partir du 20 novembre » ; convention de l'exemple CP (ci-dessus) → 21/11 (date prudente retenue).
  assert.strictEqual(r.debut_indemnisation, '2026-11-21');
});
// 4. Exemple Unédic 2025 : 460 ÷ 109,6 = 4,20 → 4 jours.
t('2025 4 jours', () => assert.strictEqual(C.calc({ fin: '2025-06-30', indemnite: 460 }).differe_specifique, 4));
// 5. Plafonds : 150 j (spécifique), 30 j (CP).
t('plafonds', () => {
  const r = C.calc({ fin: '2026-01-31', indemnite: 60000, legale: 10000, iccp: 5000, sjr: 80 });
  assert.strictEqual(r.differe_specifique_brut, 447); assert.strictEqual(r.differe_specifique, 150);
  assert.strictEqual(r.differe_cp_brut, 62); assert.strictEqual(r.differe_cp, 30);
  assert.strictEqual(r.differes, 180); assert.strictEqual(r.debut_indemnisation, '2026-08-07'); // 31/01 + 180 + 7 + 1
});
// 6. Indemnité = minimum légal → pas de différé spécifique ; sans CP → 7 jours seulement.
t('minimum légal', () => {
  const r = C.calc({ fin: '2026-03-31', indemnite: 2500, legale: 2500 });
  assert.strictEqual(r.differes, 0); assert.strictEqual(r.fin_differes, null); assert.strictEqual(r.debut_indemnisation, '2026-04-08');
});
// 7. Délai d'attente déjà appliqué dans les 12 mois.
t('sans attente', () => assert.strictEqual(C.calc({ fin: '2026-03-31', attenteDejaAppliquee: true }).debut_indemnisation, '2026-04-01'));
// 8. SJR estimé à partir du brut mensuel : 3 000 × 12 / 365 = 98,63 ; ICCP 2 000 → 20 jours.
t('sjr estimé', () => { const r = C.calc({ fin: '2026-05-31', iccp: 2000, brutMensuel: 3000 }); assert.strictEqual(r.sjr, 98.63); assert.ok(r.sjr_estime); assert.strictEqual(r.differe_cp, 20); });
// 9. Division exacte (pas d'erreur d'arrondi flottant) : 1 118 ÷ 111,8 = 10.
t('division exacte', () => assert.strictEqual(C.calc({ fin: '2026-02-28', indemnite: 1118 }).differe_specifique, 10));
// 10. Année sans diviseur connu → dernier connu, signalé.
t('diviseur inconnu', () => { const r = C.calc({ fin: '2027-02-01', indemnite: 1000 }); assert.strictEqual(r.diviseur, 111.8); assert.ok(!r.diviseur_exact); });
// 11. Erreurs.
t('erreurs', () => {
  assert.throws(() => C.calc({}), /fin du contrat/);
  assert.throws(() => C.calc({ fin: '2026-02-30' }), /fin du contrat/);
  assert.throws(() => C.calc({ fin: '2026-02-01', iccp: 100 }), /salaire/);
  assert.throws(() => C.calc({ fin: '2026-02-01', indemnite: -5 }), /invalide/);
});
// 12. Oracle indépendant (comptage jour par jour) sur des cas aléatoires.
t('oracle jour par jour', () => {
  let seed = 42; const rnd = (n) => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed % n; };
  for (let i = 0; i < 5000; i++) {
    const fin = new Date(Date.UTC(2025, 0, 1) + rnd(730) * 86400000);
    const spec = rnd(200), cp = rnd(40), late = rnd(3) === 0 ? rnd(250) : 0;
    const finS = fin.toISOString().slice(0, 10);
    const insc = new Date(fin.getTime() + (1 + late) * 86400000).toISOString().slice(0, 10);
    const div = fin.getUTCFullYear() === 2025 ? 109.6 : 111.8;
    const r = C.calc({ fin: finS, indemnite: (spec * div + 0.5).toFixed(2), legale: 0, iccp: cp * 50, sjr: 50, inscription: insc });
    // Oracle : on marque chaque jour après la fin du contrat.
    let d = new Date(fin.getTime()), left = Math.min(spec, 150) + Math.min(cp, 30), wait = 7, started = false;
    for (;;) {
      d = new Date(d.getTime() + 86400000); const ds = d.toISOString().slice(0, 10);
      if (left > 0) { left--; continue; }
      if (ds < insc) continue;
      if (wait > 0) { wait--; continue; }
      break;
    }
    assert.strictEqual(r.debut_indemnisation, d.toISOString().slice(0, 10), 'cas ' + i + ' ' + finS);
  }
});
// 13. Copie publiée identique.
t('copie publiée', () => assert.strictEqual(fs.readFileSync(PUB, 'utf8'), fs.readFileSync(SRC, 'utf8')));

console.log(passed + ' tests OK' + (process.exitCode ? ' (avec échecs)' : ''));
