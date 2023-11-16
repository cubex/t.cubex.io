import postcss from 'rollup-plugin-postcss';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import postcssComments from 'postcss-discard-comments';
import autoprefixer from 'autoprefixer';
import copy from 'rollup-plugin-copy';

const production = !process.env.ROLLUP_WATCH;

const postcssPlugins = [
  autoprefixer(),
  postcssComments({'removeAll': true})
];

export default {
  input: 'assets/index.ts',
  output: {
    file: 'resources/core.js',
    name: 'main.js',
    format: 'iife',
    sourcemap: !production
  },
  plugins: [
    resolve(),
    typescript({'sourceMap': !production}),
    commonjs(),
    postcss({
      extract: true,
      minimize: production,
      sourceMap: !production,
      plugins: postcssPlugins
    }),
    copy({
      targets: [
        {src: 'assets/img/*', dest: 'resources/img'},
        {src: 'assets/font/*', dest: 'resources/font'}
      ]
    }),
    production && terser({format: {comments: false}})
  ]
};
