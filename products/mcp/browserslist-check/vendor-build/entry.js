require('./regions-map.js');
const browserslist = require('browserslist');
const FEATURES = require('caniuse-lite/data/features.js');
module.exports = {
  browserslist,
  agents: require('caniuse-lite/dist/unpacker/agents').agents,
  unpackFeature: require('caniuse-lite/dist/unpacker/feature').default,
  FEATURES,
  REGIONS: globalThis.__BL_REGIONS,
  VERSIONS: { browserslist: require('browserslist/package.json').version, 'caniuse-lite': require('caniuse-lite/package.json').version, 'baseline-browser-mapping': '2.11.37' }
};
