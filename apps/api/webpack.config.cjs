const path = require('node:path')

module.exports = (options) => ({
  ...options,
  // Bundle the ESM entrypoints so Nest's CommonJS output never crosses the
  // incompatible require() boundary in @insforge/shared-schemas 1.x.
  externals: [],
  resolve: {
    ...options.resolve,
    alias: {
      ...options.resolve?.alias,
      '@insforge/sdk$': path.resolve(__dirname, 'node_modules/@insforge/sdk/dist/index.mjs'),
      '@insforge/shared-schemas$': path.resolve(
        __dirname,
        'node_modules/@insforge/shared-schemas/dist/index.js',
      ),
    },
  },
})
