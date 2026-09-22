import resolve from "@rollup/plugin-node-resolve";
import scss from "rollup-plugin-scss";
import commonjs from "@rollup/plugin-commonjs";
import del from "rollup-plugin-delete";
import replace from "@rollup/plugin-replace";
import sourcemaps from "rollup-plugin-sourcemaps2";
import license from "rollup-plugin-license";
import path from "path";
import fs from "fs";

function copyFiles(from, to, overwrite = false) {
    return {
        name: "copy-files",
        generateBundle() {
            const log = (msg) => console.log("\x1b[36m%s\x1b[0m", msg);
            log(`copy files:`);
            if (!fs.existsSync(to)) {
                fs.mkdirSync(to, { recursive: true });
            }
            fs.readdirSync(from).forEach((file) => {
                const fromFile = `${from}/${file}`;
                const toFile = `${to}/${file}`;
                if (fs.existsSync(toFile) && !overwrite) return;
                log(`• ${fromFile} → ${toFile}`);
                fs.copyFileSync(path.resolve(fromFile), path.resolve(toFile));
            });
        }
    };
}

function copyFile(from, to, file, overwrite = false) {
    return {
        name: "copy-file",
        generateBundle() {
            const log = (msg) => console.log("\x1b[36m%s\x1b[0m", msg);
            if (!fs.existsSync(to)) {
                fs.mkdirSync(to, { recursive: true });
            }
            const fromFile = `${from}/${file}`;
            const toFile = `${to}/${file}`;
            if (fs.existsSync(toFile) && !overwrite) return;
            log(`copy file: ${fromFile} → ${toFile}`);
            fs.copyFileSync(path.resolve(fromFile), path.resolve(toFile));
        }
    };
}

// Generating the full merged sourcemap for the whole bundle is one of the most expensive parts
// of a rebuild (it re-walks every included module on every build, not just changed ones), so it
// can be turned off for fast dev iteration via `SOURCEMAP=false npm run dev:fast`.
const sourcemap = process.env.SOURCEMAP !== "false";

export default {
    strictDeprecations: true,
    input: "src/main.js",
    output: [
        {
            name: "SampleViewerApp",
            file: "dist/GltfSVApp.js",
            format: "esm",
            sourcemap
        }
    ],
    plugins: [
        resolve({
            browser: true,
            preferBuiltins: true,
            dedupe: ["gl-matrix", "jpeg-js", "fast-png"]
        }),
        scss({
            // Version 4 is not working
            quietDeps: true // silence legacy-API deprecation warnings from bulma (node_modules)
        }),
        del({ targets: "dist/*" }),
        copyFile(".", "./dist", "index.html", true),
        copyFile(".", "./dist", "main.js", true),
        copyFiles("./assets/images", "./dist/assets/images", true),
        copyFiles("./assets/ui", "./dist/assets/ui", true),
        copyFiles("./glTF-Sample-Renderer/dist/libs", "./dist/libs", true),
        copyFiles("./glTF-Sample-Renderer/dist/assets", "./dist/assets/images", true),
        replace({
            "process.env.NODE_ENV": JSON.stringify("production"), // This resolves an issue with vue
            preventAssignment: true
        }),
        commonjs(),
        sourcemaps(),
        license({
            banner: {
                content: {
                    file: "LICENSE_BANNER.txt"
                }
            },
            thirdParty: {
                includeSelf: true
            }
        })
    ]
};
