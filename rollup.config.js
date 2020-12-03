import commonjs from 'rollup-plugin-commonjs';
import glslify from 'rollup-plugin-glslify';
import resolve from 'rollup-plugin-node-resolve';
import scss from 'rollup-plugin-scss'

export default {
  input: 'src/main.js',
  output: [
    {
      file: 'dist/gltf-sample-viewer.js',
      format: 'cjs'
    },
    {
      file: 'dist/gltf-sample-viewer.module.js',
      format: 'esm'
    },
    {
      name: 'gltfSampleViewer',
      file: 'dist/gltf-sample-viewer.umd.js',
      format: 'umd',
      sourcemap: true
    }
  ],
  plugins: [
    glslify(),
    resolve(),
    commonjs(),
    scss() // will output compiled styles to output.css
  ]
};
