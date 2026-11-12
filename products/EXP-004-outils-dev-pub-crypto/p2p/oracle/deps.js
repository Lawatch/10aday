// p2p translations of dependency entries + python markers → stdout JSON
const P = require('../p2p.js');
const py = ['^3.8','~3.8','>=3.8','>=3.8.1,<4.0','3.9.*','~2.7 || ^3.6','>=2.7,!=3.0.*,!=3.1.*','3','3.*','<3.12','^3.10.2','!=3.9','>=3.8 <3.13','*','~3.11.4','==3.10','>3.9','<=3.11','^3','~=3.9','~=3.9.1','3.10.4','>=3.9,<3.9.5','!=3.*'];
const deps = [
  ['requests', '^2.31'], ['django', {version: '>=4.2,<5', extras: ['bcrypt']}], ['numpy', {version: '^1.26', python: '>=3.9'}],
  ['pywin32', {version: '^306', platform: 'win32'}], ['uvloop', {version: '^0.19', markers: "sys_platform != 'win32'"}],
  ['tomli', {version: '^2.0', python: '<3.11', markers: "implementation_name == 'cpython' or implementation_name == 'pypy'"}],
  ['foo', [{version: '<=1.9', python: '>=3.6,<3.8'}, {version: '^2.0', python: '^3.8'}]],
  ['bar', {git: 'https://github.com/org/bar.git', tag: 'v1.2.0'}], ['baz', {url: 'https://example.com/baz-1.0.tar.gz'}],
  ['qux', {version: '~=1.4', extras: ['a','b'], python: '~2.7 || ^3.6'}], ['click', '*'], ['six', {version: '^1.16', python: '==3.10'}], ['zz', {version: '>=1', python: '>3.9 || <=2.7'}], ['attrs', '~1.2.3'],
];
const out = { py: py.map(c => ({ c, m: P.pyMarker(c), notes: P.takePyNotes() })), deps: deps.map(([n, v]) => ({ n, v, lines: P.depLines(n, v).lines.map(l => l.req) })) };
process.stdout.write(JSON.stringify(out));
