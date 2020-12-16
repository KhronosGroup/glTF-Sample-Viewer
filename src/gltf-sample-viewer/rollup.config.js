import commonjs from 'rollup-plugin-commonjs';
import glslify from 'rollup-plugin-glslify';
import resolve from 'rollup-plugin-node-resolve';
import copy from 'rollup-plugin-copy'
import wasm from '@rollup/plugin-wasm'

export default {
  input: ['gltf-sample-viewer.js'],
  output: [
    {
      file: 'dist/gltf-sample-viewer.js',
      format: 'cjs',
      external:['gl-matrix', 'draco3d'],
    },
    {
        file: 'dist/gltf-sample-viewer.module.js',
        format: 'esm',
        external: [ 'gl-matrix']
    }
  ],
  plugins: [
    glslify(),
    resolve(),
    commonjs(),
    copy({
        targets: [
          { src: 'libs/libktx.wasm', dest: 'dist' }
        ]
      }),
    wasm()
  ]
};
