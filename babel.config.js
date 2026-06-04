module.exports = function (api) {
  const isWeb = api.caller((caller) => caller && caller.name === 'babel-loader');
  return {
    presets: ['babel-preset-expo'],
    plugins: isWeb ? [] : ['react-native-reanimated/plugin'],
  };
};