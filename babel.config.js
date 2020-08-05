module.exports = {
  presets: [['@babel/env'], ['minify', { builtIns: false }]],

  plugins: [
    ['@babel/plugin-transform-runtime', { useESModules: true, helpers: false }]
  ]
};
