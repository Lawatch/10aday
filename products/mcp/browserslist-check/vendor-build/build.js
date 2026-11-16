const fs = require('fs');
const patch = {
  name: 'static-data',
  setup(b) {
    b.onLoad({ filter: /browserslist[\\/]node\.js$/ }, a => {
      let s = fs.readFileSync(a.path, 'utf8');
      const r1 = "require('caniuse-lite/data/regions/' + code + '.js')";
      const r2 = "require('caniuse-lite/data/features/' + name + '.js')";
      if (!s.includes(r1) || !s.includes(r2)) throw new Error('browserslist/node.js changed: patch points not found');
      s = s.replace(r1, "(function(){var x=globalThis.__BL_REGIONS[code];if(!x)throw new Error('no region');return x})()")
           .replace(r2, "(function(){var x=require('caniuse-lite/data/features.js')[name];if(!x)throw new Error('no feature');return x})()");
      // never print the "caniuse-lite is outdated" warning on stderr/stdout
      s = s.replace(/console\.warn\(/g, '(function(){})(');
      return { contents: s, loader: 'js' };
    });
  }
};
require('esbuild').build({
  entryPoints: ['entry.js'], bundle: true, platform: 'node', format: 'cjs', minify: true, legalComments: 'none',
  outfile: process.argv[2] || 'browserslist.bundle.js', target: 'node18', plugins: [patch],
});
