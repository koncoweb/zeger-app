// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Ensure platform-specific extensions are resolved correctly
// This allows .web.tsx files to be used for web platform
config.resolver.sourceExts = [
  ...config.resolver.sourceExts,
  'web.tsx',
  'web.ts',
  'web.jsx',
  'web.js',
];

module.exports = config;
