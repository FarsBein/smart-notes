import type { Configuration } from 'webpack';
import { resolve } from 'path';

import { rules } from './webpack.rules';
import { plugins } from './webpack.plugins';

rules.push({
  test: /\.(css|scss)$/,
  use: [
    { loader: 'style-loader' },
    {
      loader: 'css-loader',
      options: {
        sourceMap: true
      }
    },
    { loader: 'resolve-url-loader' },
    {
      loader: 'postcss-loader',
      options: {
        postcssOptions: {
          plugins: () => [require('autoprefixer')]
        }
      }
    },
    { loader: 'sass-loader' }
  ]
});

export const rendererConfig: Configuration = {
  module: { rules },
  plugins,
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css', '.scss']
  }
};