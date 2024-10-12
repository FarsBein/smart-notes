import type { Configuration } from 'webpack';
import { resolve } from 'path';

import { rules } from './webpack.rules';
import { plugins } from './webpack.plugins';

// Enable modules for css and scss files
rules.push({
  test: /\.module\.(css|scss)$/, // Matches files like *.module.css or *.module.scss
  use: [
    { loader: 'style-loader' },
    {
      loader: 'css-loader',
      options: {
        modules: {
          localIdentName: '[name]__[local]__[hash:base64:5]', // Customizes class names
        },
        sourceMap: true,
      },
    },
    { loader: 'resolve-url-loader' },
    {
      loader: 'postcss-loader',
      options: {
        postcssOptions: {
          plugins: () => [require('autoprefixer')],
        },
      },
    },
    {
      loader: 'sass-loader',
      options: {
        sourceMap: true, // Necessary for resolve-url-loader to work correctly with source maps
      },
    },
  ],
});

// Handle global SCSS (not using modules)
rules.push({
  test: /\.(css|scss)$/,
  exclude: /\.module\.(css|scss)$/, // Exclude .module.scss files
  use: [
    { loader: 'style-loader' },
    {
      loader: 'css-loader',
      options: {
        sourceMap: true,
      },
    },
    { loader: 'resolve-url-loader' },
    {
      loader: 'postcss-loader',
      options: {
        postcssOptions: {
          plugins: () => [require('autoprefixer')],
        },
      },
    },
    {
      loader: 'sass-loader',
      options: {
        sourceMap: true,
      },
    },
  ],
});

export const rendererConfig: Configuration = {
  module: { rules },
  plugins,
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css', '.scss'],
    fallback: {
      "fs": false,
      "path": false,
    },
  },
};
