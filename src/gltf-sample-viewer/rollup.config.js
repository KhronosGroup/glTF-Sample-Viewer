import commonjs from 'rollup-plugin-commonjs';
import glslify from 'rollup-plugin-glslify';
import resolve from 'rollup-plugin-node-resolve';
import copy from 'rollup-plugin-copy'

export default {
  input: ['gltf-sample-viewer.js'],
  external:['gl-matrix', 'draco3d'],
  output: [
    {
      file: 'dist/gltf-sample-viewer.js',
      format: 'cjs',
      external: [ 'gl-matrix',  'draco3d']
    },
    {
      file: 'dist/gltf-sample-viewer.module.js',
      format: 'esm',
      external: [ 'gl-matrix',  'draco3d']
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
      })
  ]
};
