const path = require('path');
const { getConfig } = require('react-native-builder-bob/babel-config');

const root = path.resolve(__dirname, '../packages/react-native-performance-kit');
const pkg = require(path.join(root, 'package.json'));

module.exports = function (api) {
  api.cache(true);

  return getConfig(
    {
      presets: ['babel-preset-expo'],
    },
    { root, pkg }
  );
};
