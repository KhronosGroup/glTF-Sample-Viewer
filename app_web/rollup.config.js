import glslify from 'rollup-plugin-glslify';
import resolve from '@rollup/plugin-node-resolve';
import scss from 'rollup-plugin-scss';
import commonjs from '@rollup/plugin-commonjs';
import copy from 'rollup-plugin-copy';
import replace from '@rollup/plugin-replace';
import {wasm} from "@rollup/plugin-wasm";
import sourcemaps from 'rollup-plugin-sourcemaps';
import license from "rollup-plugin-license"

export default {
    strictDeprecations: true,
    input: 'src/main.js',
    output: [
        {
            name: 'SampleViewerApp',
            file: 'dist/GltfSVApp.js',
            format: 'esm',
            sourcemap: true
        }
    ],
    plugins: [
        wasm(),
        glslify({
            include: ['../source/Renderer/shaders/*', '../source/shaders/*'],
            compress: false
        }),
        resolve({
            browser: true,
            preferBuiltins: true,
            dedupe: ['gl-matrix', 'jpeg-js', 'fast-png']
        }),
        scss(), // Version 4 is not working
        copy({
            targets: [
                { src: ["index.html", "main.js"], dest: "dist/" },
                { src: ["../assets/images"], dest: "dist/assets" },
                { src: ["../assets/ui"], dest: "dist/assets" },
                { src: ["../source/libs/*", "!../source/libs/hdrpng.js"], dest: "dist/libs" }
            ],
            copyOnce: true,
            verbose: true
        }),
        replace({
            'process.env.NODE_ENV': JSON.stringify('production'), // This resolves an issue with vue
            preventAssignment: true,
        }),
        commonjs(),
        sourcemaps(),
        license({
            banner: {
                content: {
                    file: 'LICENSE_BANNER.txt',
                }
            },
            thirdParty:{
                includeSelf: true
            }
        })
    ]
};
