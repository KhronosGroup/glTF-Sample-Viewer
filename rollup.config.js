import commonjs from '@rollup/plugin-commonjs';
import glslify from 'rollup-plugin-glslify';
import resolve from '@rollup/plugin-node-resolve';
import { terser } from "rollup-plugin-terser";
import copy from "rollup-plugin-copy";

export default {
  input: ['source/gltf-sample-viewer.js'],
  external:['gl-matrix', '@bundled-es-modules/axios', 'jpeg-js', 'fast-png'],
  output: [
    {
      file: 'dist/gltf-sample-viewer.js',
      format: 'cjs',
      sourcemap: true
    },
    {
        file: 'dist/gltf-sample-viewer.module.js',
        format: 'esm',
        sourcemap: true,
    }
  ],
  plugins: [
    glslify(),
    terser(),
    resolve({
        browser: true,
        preferBuiltins: false
    }),
    commonjs({
        include: 'node_modules/**'
    }),
    copy({
        targets: [
            { src: [
                "assets/images/lut_charlie.png",
                "assets/images/lut_ggx.png",
                "assets/images/lut_sheen_E.png",
            ], dest: "dist/assets"},
            { src: ["source/libs/*", "!source/libs/hdrpng.js"], dest: "dist/libs"}
        ]
    })
  ]
};
