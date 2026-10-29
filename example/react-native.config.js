const path = require('path');

const root = path.resolve(__dirname, '../packages/react-native-performance-kit');
const pkg = require(path.join(root, 'package.json'));

module.exports = {
  dependencies: {
    [pkg.name]: {
      root,
      platforms: {
        // Codegen script incorrectly fails without this
        // So we explicitly specify the platforms with empty object
        ios: {},
        android: {},
      },
    },
  },
};
