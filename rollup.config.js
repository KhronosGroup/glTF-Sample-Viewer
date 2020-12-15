import glslify from 'rollup-plugin-glslify';
import resolve from 'rollup-plugin-node-resolve';
import builtins from 'rollup-plugin-node-builtins';
import copy from 'rollup-plugin-copy';
import wasm from '@rollup/plugin-wasm';

export default {
  input: 'src/main.js',
  output: [
    {
      name: 'SampleViewerApp',
      file: 'dist/GltfSVApp.umd.js',
      format: 'umd',
      sourcemap: true
    }
  ],
  plugins: [
    glslify(),
    resolve({
        browser: true,
        preferBuiltins: true
    }),
    builtins(),
    copy({
        targets: [
          { src: 'node_modules/gltf-sample-viewer/dist/*.wasm', dest: 'dist' }
        ]
      }),
    wasm()
  ]
};
