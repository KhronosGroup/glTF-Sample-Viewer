import glslify from 'rollup-plugin-glslify';
import resolve from 'rollup-plugin-node-resolve';
import builtins from 'rollup-plugin-node-builtins';
import scss from 'rollup-plugin-scss';
import commonjs from 'rollup-plugin-commonjs';

export default {
  input: 'src/main.js',
  output: [
    {
      name: 'SampleViewerApp',
      file: 'dist/GltfSVApp.umd.js',
      format: 'umd',
      sourcemap: true,
      external: [ 'gl-matrix',  '@bundled-es-modules/axios', 'jpeg-js', 'fast-png']
    }
  ],
  plugins: [
    commonjs({

    }),
    glslify({include: ['../source/Renderer/shaders/*', '../source/shaders/*']}),
    resolve({
        browser: true,
        preferBuiltins: true
    }),
    builtins(),
    scss()
  ]
};
