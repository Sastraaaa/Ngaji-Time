const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Optimize bundle untuk production
config.transformer.minifierConfig = {
  keep_fnames: false,
  mangle: {
    keep_fnames: false,
  },
  compress: {
    drop_console: true, // Remove console.log in production
    dead_code: true,
    conditionals: true,
    evaluate: true,
    booleans: true,
    loops: true,
    unused: true,
    hoist_funs: true,
    keep_fargs: false,
    hoist_vars: false,
    if_return: true,
    join_vars: true,
    side_effects: false,
  },
};

// Tree shaking optimization
config.resolver.platforms = ["native", "android", "ios"];

// Asset optimization
config.transformer.assetPlugins = ["expo-asset/tools/hashAssetFiles"];

module.exports = withNativeWind(config, { input: "./app/global.css" });
