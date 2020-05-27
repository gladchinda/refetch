const babel = require('@rollup/plugin-babel').default;
const terser = require('rollup-plugin-terser').terser;
const filesize = require('rollup-plugin-filesize');

module.exports = {
  input: 'src/index.js',
  output: {
    file: 'dist/refetch.js',
    format: 'umd',
    name: 'refetch',
    sourcemap: true,
    noConflict: true
  },
  plugins: [babel({ babelHelpers: 'bundled' }), terser(), filesize()]
};
