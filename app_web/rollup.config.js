import glslify from 'rollup-plugin-glslify';
import resolve from '@rollup/plugin-node-resolve';
import builtins from 'rollup-plugin-node-builtins';
import scss from 'rollup-plugin-scss';
import commonjs from '@rollup/plugin-commonjs';
import copy from 'rollup-plugin-copy';
import alias from '@rollup/plugin-alias';
import replace from '@rollup/plugin-replace';
import json from '@rollup/plugin-json';

export default {
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
        json(),
        glslify({
            include: ['../source/Renderer/shaders/*', '../source/shaders/*'],
            compress: false
        }),
        resolve({
            browser: true,
            preferBuiltins: true,
            dedupe: ['gl-matrix', 'axios', 'jpeg-js', 'fast-png']
        }),
        builtins(),
        scss(),
        copy({
            targets: [
                { src: ["index.html", "main.js"], dest: "dist/" },
                { src: ["../assets/models/2.0", "!../asset/models/.git"], dest: "dist/assets/models" },
                { src: ["../assets/environments/*.hdr", "../assets/environments/*.jpg", "!../asset/environments/.git"], dest: "dist/assets/environments" },
                { src: ["../assets/images"], dest: "dist/assets" },
                { src: ["../assets/ui"], dest: "dist/assets" },
                { src: ["../source/libs/*", "!../source/libs/hdrpng.js"], dest: "dist/libs" }
            ],
            copyOnce: true,
            verbose: true
        }),
        replace({
            'process.env.NODE_ENV': JSON.stringify('production'),
            preventAssignment: true,
        }),
        alias({
            'vue': 'vue/dist/vue.esm.js'
        }),
        commonjs(),
    ]
};
