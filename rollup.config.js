import glslify from 'rollup-plugin-glslify';
import resolve from '@rollup/plugin-node-resolve';
import scss from 'rollup-plugin-scss';
import commonjs from '@rollup/plugin-commonjs';
import copy from 'rollup-plugin-copy';
import del from 'rollup-plugin-delete';
import replace from '@rollup/plugin-replace';
import {wasm} from "@rollup/plugin-wasm";
import sourcemaps from 'rollup-plugin-sourcemaps';
import license from "rollup-plugin-license";
import path from "path"
import fs from "fs"

function copyFiles(from, to, overwrite = false) {
    return {
        name: 'copy-files',
        generateBundle() {
            const log = msg => console.log('\x1b[36m%s\x1b[0m', msg);
            log(`copy files:`);
            if (!fs.existsSync(to)) {
                fs.mkdirSync(to, {recursive: true});
            }
            fs.readdirSync(from).forEach(file => {
                const fromFile = `${from}/${file}`;
                const toFile = `${to}/${file}`;
                if (fs.existsSync(toFile) && !overwrite)
                    return;
                log(`• ${fromFile} → ${toFile}`);
                fs.copyFileSync(
                    path.resolve(fromFile),
                    path.resolve(toFile)
                );
            });
        }
    };
}

function copyFile(from, to, file, overwrite = false) {
    return {
        name: 'copy-file',
        generateBundle() {
            const log = msg => console.log('\x1b[36m%s\x1b[0m', msg);
            if (!fs.existsSync(to)) {
                fs.mkdirSync(to, {recursive: true});
            }
            const fromFile = `${from}/${file}`;
            const toFile = `${to}/${file}`;
            if (fs.existsSync(toFile) && !overwrite)
                return;
            log(`copy file: ${fromFile} → ${toFile}`);
            fs.copyFileSync(
                path.resolve(fromFile),
                path.resolve(toFile)
            );
        }
    };
}

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
            include: ['./glTF-Sample-Renderer/source/Renderer/shaders/*', './glTF-Sample-Renderer/source/shaders/*'],
            compress: false
        }),
        resolve({
            browser: true,
            preferBuiltins: true,
            dedupe: ['gl-matrix', 'jpeg-js', 'fast-png']
        }),
        scss(), // Version 4 is not working
        del({ targets: 'dist/*' }),
        copyFile(".", "./dist", "index.html", true),
        copyFile(".", "./dist", "main.js", true),
        copyFiles("./assets/images", "./dist/assets/images", true),
        copyFiles("./assets/ui", "./dist/assets/ui", true),
        copyFiles("./glTF-Sample-Renderer/source/libs", "./dist/libs", true),
        copyFiles("./glTF-Sample-Renderer/assets/images", "./dist/assets/images", true),
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
