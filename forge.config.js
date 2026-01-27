const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

module.exports = {
  packagerConfig: {
    asar: true,
    prune: true,
    extraResource: ["out"],
    ignore: [
      /^\/\.next($|\/)/,
      /^\/forge-out($|\/)/,
      /^\/out\/make($|\/)/,
      /^\/out\/.*darwin.*($|\/)/,
      /^\/out\/.*win32.*($|\/)/,
      /^\/out\/.*linux.*($|\/)/,
      /^\/out\/.*\.map$/,
      /^\/tests?($|\/)/,
      /^\/docs?($|\/)/,
      /^\/\.git($|\/)/,
    ],
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      platforms: ["win32"],
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      platforms: ["linux"],
    },
    // {
    //   name: '@electron-forge/maker-rpm',
    //   platforms: ["linux"],
    // },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
  outDir: "forge-out",
};
