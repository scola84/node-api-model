import buble from 'rollup-plugin-buble';

export default {
  dest: './dist/api-model.js',
  entry: 'index.js',
  format: 'cjs',
  external: [
    '@scola/error',
    'async/eachOf',
    'async/parallel',
    'async/series',
    'events',
    'odiff',
    'sha1',
    'string_decoder'
  ],
  plugins: [
    buble()
  ]
};
