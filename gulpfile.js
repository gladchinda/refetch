'use strict';

const $webpack = require('webpack');
const webpack = require('webpack-stream');
const TerserPlugin = require('terser-webpack-plugin');
const { src, dest } = require('gulp');

function getWebpackConfig(filename) {
  return {
    mode: 'production',
    target: 'web',
    devtool: 'source-map',
    output: { filename, libraryTarget: 'umd' },
    module: {
      rules: [
        {
          test: /\.jsx?$/,
          exclude: /(node_modules)/,
          loader: 'babel-loader'
          // options: {
          //   presets: [
          //     '@babel/env',
          //     ['minify', { builtIns: false }]
          //   ],

          //   plugins: [
          //     ['@babel/plugin-transform-runtime', { useESModules: false, helpers: true }]
          //   ]
          // }
        }
      ]
    },
    optimization: {
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            compress: { drop_debugger: true, drop_console: true }
          },
          extractComments: false
        })
      ]
    }
  };
}

function build_js() {
  return src('src/index.js')
    .pipe(webpack(getWebpackConfig('refetch.js'), $webpack))
    .pipe(dest('dist'));
}

exports.default = build_js;
