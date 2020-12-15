import commonjs from 'rollup-plugin-commonjs';
import glslify from 'rollup-plugin-glslify';
import resolve from 'rollup-plugin-node-resolve';
import builtins from 'rollup-plugin-node-builtins';
import wasm from '@rollup/plugin-wasm';

export default {
  input: 'src/main.js',
  output: [
    {
      file: 'dist/GltfSVApp.module.js',
      format: 'esm'
    },
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
        include: 'node_modules/gltf-sample-viewer/dist/*.wasm',
        extensions: [".js", ".wasm"],
        preferBuiltins: true
    }),
    builtins(),
    wasm()
  ]
};
