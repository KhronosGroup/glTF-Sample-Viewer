import commonjs from 'rollup-plugin-commonjs';
import glslify from 'rollup-plugin-glslify';
import resolve from 'rollup-plugin-node-resolve';

export default {
  input: ['gltf-sample-viewer.js'],
  output: [
    {
      file: '../npm_package/gltf-sample-viewer.js',
      format: 'cjs',
      external:['gl-matrix', '@bundled-es-modules/axios', 'jpeg-js', 'fast-png'],
    },
    {
        file: '../npm_package/gltf-sample-viewer.module.js',
        format: 'esm',
        external: [ 'gl-matrix',  '@bundled-es-modules/axios', 'jpeg-js', 'fast-png']
    }
  ],
  plugins: [
    glslify(),
    resolve(),
    commonjs({
        include: 'node_modules/**'
    })
  ]
};
