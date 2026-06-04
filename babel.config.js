module.exports = function (api) {
  api.cache(true);
  const isWeb = api.caller((caller) => caller && caller.name === 'babel-loader');
  return {
    presets: ['babel-preset-expo'],
    plugins: isWeb ? [] : ['react-native-reanimated/plugin'],
  };
};