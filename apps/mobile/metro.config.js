const { getDefaultConfig } = require("expo/metro-config");
const path = require("node:path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Without these three lines Metro cannot resolve @memento/core: by default it only
// watches this app's folder and only walks node_modules upward from it.
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];
// Forces resolution through nodeModulesPaths above rather than the default upward walk,
// so a stray copy of a package in an intermediate folder cannot be picked up instead.
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
