import glslify from 'rollup-plugin-glslify';
import resolve from 'rollup-plugin-node-resolve';
import builtins from 'rollup-plugin-node-builtins';
import scss from 'rollup-plugin-scss';

export default {
  input: 'src/main.js',
  output: [
    {
      name: 'SampleViewerApp',
      file: 'dist/GltfSVApp.umd.js',
      format: 'umd',
      sourcemap: true,
      external: [ 'gl-matrix',  '@bundled-es-modules/axios']
    }
  ],
  plugins: [
    glslify({include: ['../src/Renderer/shaders/*']}),
    resolve({
        browser: true,
        preferBuiltins: true
    }),
    builtins(),
    scss()
  ]
};
