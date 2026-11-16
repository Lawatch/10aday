'use strict';
// Compares engine.js with the real npm code.
//   node test.js --fixtures          recorded answers of the real npm (fixtures.json), no network needed
//   ORACLE=<dir> node test.js N SEED live random cases against npm-packlist + @npmcli/arborist installed in <dir>
//   ORACLE=<dir> node test.js --record N SEED   rewrite fixtures.json
//   NPM_PACK=1 ... also runs the real "npm pack --dry-run --json" on each case (slow, end-to-end check)
const fs = require('fs'), os = require('os'), path = require('path'), cp = require('child_process');
const E = require('./engine.js');

function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
function gen(r) {
  const pick = a => a[Math.floor(r() * a.length)];
  const NAMES = ['index.js', 'cli.js', 'main.mjs', 'util.ts', 'types.d.ts', 'README.md', 'readme.txt', 'Readme', 'README.md~', 'LICENSE', 'license.md',
    'LICENCE', 'COPYING', 'CHANGELOG.md', 'notes.txt', '.env', '.env.local', '.npmrc', '.DS_Store', '._x', 'a.orig', '.x.swp', 'x.swp',
    'npm-debug.log', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'secret.pem', 'data.json', 'a*b.js', 'Makefile', '.eslintrc', 'tsconfig.json',
    'image.PNG', 'foo.test.js', '.lock-wscript', '.wafpickle-1', 'config.gypi', 'package.json'];
  const DIRS = ['lib', 'src', 'dist', 'test', 'tests', 'docs', 'build', 'bin', 'node_modules', '.git', '.github', 'archived-packages', 'CVS', 'coverage',
    '@scope', 'Lib', 'sub', 'fixtures', '.DS_Store', '._d'];
  const paths = new Set();
  const dirs = [''];
  const nd = 1 + Math.floor(r() * 6);
  for (let i = 0; i < nd; i++) {
    const parent = pick(dirs); const d = (parent ? parent + '/' : '') + pick(DIRS);
    if (dirs.indexOf(d) < 0 && d.split('/').length <= 3) dirs.push(d);
  }
  const nf = 3 + Math.floor(r() * 14);
  for (let i = 0; i < nf; i++) paths.add((function () { const d = pick(dirs); return (d ? d + '/' : '') + pick(NAMES); })());
  for (const d of dirs) if (d && r() < 0.5) paths.add(d + '/' + pick(NAMES));
  // no file may also be a folder
  for (const p of Array.from(paths)) if (dirs.indexOf(p) >= 0) paths.delete(p);
  for (const p of Array.from(paths)) { const parts = p.split('/'); for (let i = 1; i < parts.length; i++) if (paths.has(parts.slice(0, i).join('/'))) paths.delete(p); }
  paths.delete('package.json');
  const RULES = ['*.log', 'test', 'test/', '/test', 'tests/**', '*.ts', '!types.d.ts', 'src', '/src/', 'dist', '!dist', '!dist/**', '*.md', '!README.md',
    '.env', '.env*', '**/fixtures', 'docs/', 'lib/*.mjs', '!lib', '*', '!*.js', 'build', '/build/', '!.npmrc', '!node_modules', '# comment', '',
    '  spaced.txt  ', 'Lib', '*.PNG', 'sub/**/x', 'coverage', '!@scope', '@scope/', 'notes.txt', '/index.js', '!/LICENSE', '*.json', '!package.json', '.github',
    '\\#x', 'readme*', '!.gitignore', '**', 'a?b.js', '[lt]est', 'x/../lib', 'lib/', '!lib/', '*.swp'];
  const ignore = {};
  const nIg = Math.floor(r() * 4);
  for (let i = 0; i < nIg; i++) {
    const d = pick(dirs); const name = r() < 0.5 ? '.npmignore' : '.gitignore';
    const lines = []; const n = 1 + Math.floor(r() * 5);
    for (let j = 0; j < n; j++) lines.push(pick(RULES));
    const p = (d ? d + '/' : '') + name;
    if (dirs.indexOf(p) >= 0) continue;
    ignore[p] = lines.join(r() < 0.15 ? '\r\n' : '\n') + (r() < 0.5 ? '\n' : '');
    paths.delete(p);
  }
  const pkg = { name: r() < 0.3 ? '@me/pkg' : 'pkg', version: '1.0.0' };
  if (r() < 0.6) {
    const FILES = ['lib', 'lib/', './lib', 'dist', 'dist/*', 'dist/**', 'src/*.js', 'index.js', './index.js', '/index.js', 'cli.js', '*.js', 'bin', 'docs',
      '!test', '!lib/notes.txt', 'missing', 'lib/index.js', 'types.d.ts', '*.md', 'README.md', '@scope', 'sub', '.env', 'node_modules', 'CHANGELOG.md',
      'lib/**/*.js', '!*.ts', 'build/config.gypi', 'test/', 'index.js/'];
    const n = Math.floor(r() * 5); pkg.files = [];
    for (let i = 0; i < n; i++) pkg.files.push(pick(FILES));
  }
  if (r() < 0.4) pkg.main = pick(['index.js', './index.js', 'lib/index.js', 'missing.js', 'dist/main.mjs', 'lib']);
  if (r() < 0.3) pkg.bin = pick(['cli.js', './cli.js', { tool: 'bin/cli.js' }, { a: './lib/cli.js', b: '../x.js' }, ['bin/cli.js'], { 'x:y': 'cli.js' }]);
  if (r() < 0.08) {
    pkg.workspaces = pick([['sub'], ['lib', 'src'], ['packages/*']]);
    for (const d of dirs) if (d && r() < 0.5 && !paths.has(d + '/package.json')) { ignore[d + '/package.json'] = JSON.stringify({ name: 'w' + d.length, version: '1.0.0' }); }
  }
  for (const p of Array.from(paths)) if (/(^|\/)package\.json$/.test(p)) { paths.delete(p); ignore[p] = JSON.stringify({ name: 'inner', version: '1.0.0', files: ['x'] }); }
  if (r() < 0.1) pkg.browser = pick(['dist/main.mjs', 'index.js']);
  return { package_json: pkg, paths: Array.from(paths), ignore_files: ignore };
}

function materialise(c) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'npc-'));
  const root = path.join(dir, 'package'); fs.mkdirSync(root);
  const write = (p, content) => { const f = path.join(root, p); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, content); };
  for (const p of c.paths) write(p, 'x');
  for (const p of Object.keys(c.ignore_files)) write(p, c.ignore_files[p]);
  write('package.json', JSON.stringify(c.package_json));
  return { dir, root };
}
async function oracle(c, mods) {
  const { dir, root } = materialise(c);
  try {
    const tree = await new mods.Arborist({ path: root }).loadActual();
    const list = await mods.packlist(tree, { path: root });
    let npm = null;
    if (process.env.NPM_PACK) {
      const out = cp.execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts', '--silent'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
      npm = JSON.parse(out)[0].files.map(f => f.path).sort();
    }
    return { list: list.map(f => f.replace(/^\.\//, '')), npm };
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}
function ours(c) { return E.pack(c).included; }
const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

async function main() {
  const args = process.argv.slice(2);
  if (args[0] === '--fixtures') {
    const fx = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures.json'), 'utf8'));
    let bad = 0;
    for (const f of fx.cases) { const got = ours(f.input); if (!same(got, f.expected)) { bad++; if (bad < 4) console.log('MISMATCH', JSON.stringify(f.input), '\n ours', got, '\n npm ', f.expected); } }
    console.log('fixtures: ' + fx.cases.length + ' cases, ' + bad + ' mismatches');
    process.exit(bad ? 1 : 0);
  }
  const record = args[0] === '--record'; if (record) args.shift();
  const N = +args[0] || 300, SEED = +args[1] || 7;
  const req = m => require(require.resolve(m, { paths: [process.env.ORACLE] }));
  const mods = { Arborist: req('@npmcli/arborist'), packlist: req('npm-packlist') };
  const r = rng(SEED); let bad = 0, files = 0, npmBad = 0; const cases = [];
  for (let i = 0; i < N; i++) {
    const c = gen(r);
    let o; try { o = await oracle(c, mods); } catch (e) { continue; }
    const got = ours(c); files += c.paths.length;
    if (!same(got, o.list)) { bad++; if (bad <= 3) console.log('MISMATCH', JSON.stringify(c), '\n ours', got, '\n npm ', o.list); }
    if (o.npm && !same(got.slice().sort(), o.npm)) { npmBad++; if (npmBad <= 3) console.log('NPM PACK MISMATCH', JSON.stringify(c), '\n ours', got.slice().sort(), '\n npm ', o.npm); }
    if (record) cases.push({ input: c, expected: o.list });
  }
  console.log('live: ' + N + ' cases, ' + files + ' files, ' + bad + ' mismatches vs npm-packlist' + (process.env.NPM_PACK ? ', ' + npmBad + ' vs real npm pack' : ''));
  if (record) fs.writeFileSync(path.join(__dirname, 'fixtures.json'), JSON.stringify({ oracle: 'npm-packlist 9.0.0 + @npmcli/arborist 8 (npm 10.9)', cases }));
  process.exit(bad || npmBad ? 1 : 0);
}
main();
