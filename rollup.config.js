import commonjs from '@rollup/plugin-commonjs';
import glslify from 'rollup-plugin-glslify';
import resolve from '@rollup/plugin-node-resolve';
import copy from "rollup-plugin-copy";


export default {
    input: ['source/gltf-sample-viewer.js'],
    output: [
        {
            file: 'dist/gltf-viewer.js',
            format: 'cjs',
            sourcemap: true
        },
        {
            file: 'dist/gltf-viewer.module.js',
            format: 'esm',
            sourcemap: true,
        }
    ],
    plugins: [
        glslify(),
        resolve({
            browser: true,
            preferBuiltins: false,
            dedupe: ['gl-matrix', 'axios', 'jpeg-js', 'fast-png']
        }),
        copy({
            targets: [
                {
                    src: [
                        "assets/images/lut_charlie.png",
                        "assets/images/lut_ggx.png",
                        "assets/images/lut_sheen_E.png",
                    ], dest: "dist/assets"
                },
                { src: ["source/libs/*", "!source/libs/hdrpng.js"], dest: "dist/libs" }
            ]
        }),
        commonjs(),
    ]
};
