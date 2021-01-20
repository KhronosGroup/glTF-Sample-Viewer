import commonjs from '@rollup/plugin-commonjs';
import glslify from 'rollup-plugin-glslify';
import resolve from '@rollup/plugin-node-resolve';

export default {
  input: ['gltf-sample-viewer.js'],
  external:['gl-matrix', '@bundled-es-modules/axios', 'jpeg-js', 'fast-png'],
  output: [
    {
      file: '../npm_package/gltf-sample-viewer.js',
      format: 'cjs',
      sourcemap: true
    },
    {
        file: '../npm_package/gltf-sample-viewer.module.js',
        format: 'esm',
        sourcemap: true,
    }
  ],
  plugins: [
    glslify(),
    resolve({
        browser: true,
        preferBuiltins: false
    }),
    commonjs({
        include: 'node_modules/**'
    })
  ]
};
