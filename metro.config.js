if (!Array.prototype.toReversed) {
  Array.prototype.toReversed = function () {
    return this.slice().reverse();
  };
}

const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const path = require("path");

const config = getDefaultConfig(__dirname);

// EXTREMELY CRITICAL FOR REACT NATIVE:
// Bypass the modern 'exports' block in @colyseus/sdk which accidentally evaluates 'ws' and 'crypto-browserify'.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "@colyseus/sdk") {
    return {
      filePath: path.resolve(__dirname, "node_modules/@colyseus/sdk/dist/colyseus.js"),
      type: "sourceFile",
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: "./global.css" });
