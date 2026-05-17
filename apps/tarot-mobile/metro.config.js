const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

const rootNodeModules = path.resolve(workspaceRoot, "node_modules");

// react/react-native must resolve to a single copy — block root versions
config.resolver.blockList = [
  new RegExp(
    `^${rootNodeModules.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/react/.*`
  ),
  new RegExp(
    `^${rootNodeModules.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/react-native/.*`
  ),
];

// Force all react/react-native imports (including those from root-hoisted packages) to app-local copy
config.resolver.extraNodeModules = {
  "react":        path.resolve(projectRoot, "node_modules/react"),
  "react-native": path.resolve(projectRoot, "node_modules/react-native"),
};

module.exports = config;
