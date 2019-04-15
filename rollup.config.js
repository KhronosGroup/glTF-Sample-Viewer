import commonjs from 'rollup-plugin-commonjs';
import glslify from 'rollup-plugin-glslify';
import resolve from 'rollup-plugin-node-resolve';

export default {
  input: 'src/main.js',
  output: [
    {
      file: 'dist/gltf-reference-viewer.js',
      format: 'cjs'
    },
    {
      file: 'dist/gltf-reference-viewer.module.js',
      format: 'esm'
    },
    {
      name: 'gltf_rv',
      file: 'dist/gltf-reference-viewer.umd.js',
      format: 'umd',
      sourcemap: true
    }
  ],
  plugins: [
    glslify(),
    resolve(),
    commonjs()
  ]
};
