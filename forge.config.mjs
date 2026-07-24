/**
 * Electron Forge Configuration — VAG Bounded Demo
 *
 * Packages the bounded demo as a Windows desktop app.
 * No GitHub publisher, no auto-update, no telemetry.
 * Status: UNSIGNED_TEST_DISTRIBUTABLE until code-signing is configured.
 */

export default {
  packagerConfig: {
    name: 'VAGBoundedDemo',
    executableName: 'VAGBoundedDemo',
    appVersion: '0.1.0',
    asar: true,
    // Only package necessary files
    ignore: [
      /^\/\.git/,
      /^\/\.github/,
      /^\/\.kiro/,
      /^\/test\//,
      /^\/tools\//,
      /^\/docs\//,
      /^\/examples\//,
      /^\/node_modules\/(?!(?:electron|@electron))/,
      /^\/AGENTS\.md$/,
      /^\/CONTRIBUTING\.md$/,
      /^\/SECURITY\.md$/,
      /^\/NOTICE\.md$/,
      /^\/NOTICE$/,
      /\.test\.mjs$/,
      /\.test\.ts$/,
    ],
    // Windows-specific
    win32metadata: {
      CompanyName: 'Schell Systems',
      ProductName: 'VAG Bounded Demo',
      FileDescription: 'VAG Bounded Demo — Local demonstration of bounded gateway verification',
      InternalName: 'VAGBoundedDemo',
    },
  },
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'VAGBoundedDemo',
        title: 'VAG Bounded Demo',
        description: 'VAG Bounded Demo — Local bounded gateway verification demonstration',
        authors: 'Pascal Schell – Schell Systems',
        // No certificate configured — UNSIGNED_TEST_DISTRIBUTABLE
        // certificateFile: undefined,
        // certificatePassword: undefined,
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['win32', 'linux'],
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
  ],
};
