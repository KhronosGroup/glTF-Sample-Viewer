import glslify from 'rollup-plugin-glslify';
import resolve from 'rollup-plugin-node-resolve';
import builtins from 'rollup-plugin-node-builtins';
import scss from 'rollup-plugin-scss';
import commonjs from 'rollup-plugin-commonjs';
import copy from 'rollup-plugin-copy'

export default {
  input: 'src/main.js',
  output: [
    {
      name: 'SampleViewerApp',
      file: 'dist/GltfSVApp.umd.js',
      format: 'umd',
      sourcemap: true,
      external: [ 'gl-matrix', 'axios', 'jpeg-js', 'fast-png']
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
    scss(),
    copy({
        targets: [
            { src: ["index.html", "styles.css", "ui.css"], dest: "dist/"},
            { src: ["../assets/models/2.0", "!../asset/models/.git"], dest: "dist/assets/models"},
            { src: ["../assets/environments/*.hdr", "!../asset/environments/.git"], dest: "dist/assets/environments"},
            { src: ["../assets/images"], dest: "dist/assets/images"},
            { src: ["../assets/ui"], dest: "dist/assets/ui"},
            { src: ["../source/libs/*", "!../source/libs/hdrpng.js"], dest: "dist/libs"}
        ]
    })
  ]
};
