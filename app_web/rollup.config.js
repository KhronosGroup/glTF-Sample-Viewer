import glslify from 'rollup-plugin-glslify';
import resolve from '@rollup/plugin-node-resolve';
import builtins from 'rollup-plugin-node-builtins';
import scss from 'rollup-plugin-scss';
import commonjs from '@rollup/plugin-commonjs';
import copy from 'rollup-plugin-copy';
import replace from '@rollup/plugin-replace';
import json from '@rollup/plugin-json';
import {wasm} from "@rollup/plugin-wasm";

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
        json(), // To include model json file
        glslify({
            include: ['../source/Renderer/shaders/*', '../source/shaders/*'],
            compress: false
        }),
        resolve({
            browser: true,
            preferBuiltins: true,
            dedupe: ['gl-matrix', 'jpeg-js', 'fast-png']
        }),
        builtins(), // Needed for loading assets
        scss(), // Version 4 is not working
        copy({
            targets: [
                { src: ["index.html", "main.js"], dest: "dist/" },
                { src: ["../assets/models/Models", "!../asset/models/.git"], dest: "dist/assets/models" },
                { src: ["../assets/environments/*.hdr", "../assets/environments/*.jpg", "!../asset/environments/.git"], dest: "dist/assets/environments" },
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
    ]
};
