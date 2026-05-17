const path = require("path");

const presetPath = path.resolve(
  __dirname,
  "node_modules/expo/node_modules/babel-preset-expo"
);

module.exports = function (api) {
  api.cache(true);
  return {
    presets: [[presetPath, { reanimated: false }]],
    plugins: [],
  };
};
