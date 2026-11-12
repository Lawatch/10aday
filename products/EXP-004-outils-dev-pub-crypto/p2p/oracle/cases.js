// Generates constraint cases and p2p.js translations → stdout JSON
const P = require('../p2p.js');
const vs = ['0','1','2','0.0','0.1','0.2','1.0','1.2','1.4','2.0','2024.1','0.0.0','0.0.3','0.2.3','1.2.3','1.4.2','2.0.0','1.2.3.4','0.0.0.1','1.0.0rc1','1.2.3-beta.1','1.2.3b2','1.2.post1','1!1.2','1.2.dev0','1.2.3a1.dev2','1.2.3+local','1.2+abc.1','1.2.3-1','1.2.3.post2.dev1','v2.0','01.02'];
const ops = ['^','~','~=','','==','=','!=','>','>=','<','<=','<>'];
const cs = new Set(['*','x','X','*.*','v1.2','1.x','1.2.*','==1.2.*','!=1.2.*','1.*','!=1.*','1.2.3.*','>=1.2.*','dev','>=dev',
  '>=1,<2','>=1.2 <2','>= 1.2, < 2','^1.2 || ^2.0','^1.2|^2','~1.2 || >=3','^1.2,!=1.5.0','>=1.2,<2.0,!=1.4.*','^1.2,','>1.2 , <1.9','* || ^1',
  '^1.2 ~1.2.5','>=1.0.0rc1,<2','1.2 - 2.0','^ 1.2','~= 1.4','>=2.7,!=3.0.*,!=3.1.*','^1.2.3+local','==1.2.3+abc','<2.0.0a1']);
for (const o of ops) for (const v of vs) cs.add(o + v);
const out = [];
for (const c of cs) {
  try { const r = P.constraint(c); out.push({ c, spec: r.spec, groups: r.groups.map(g => g.join(',')), notes: r.notes }); }
  catch (e) { out.push({ c, error: e.message }); }
}
process.stdout.write(JSON.stringify(out));
