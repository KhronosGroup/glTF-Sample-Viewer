import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
import license from "rollup-plugin-license";

// Generating the full merged sourcemap for the whole bundle is one of the most expensive parts
// of a rebuild, so it can be turned off for fast dev iteration via `SOURCEMAP=false npm run build`.
const sourcemap = process.env.SOURCEMAP !== "false";

export default defineConfig({
    // The deployed site lives under a subpath (github.khronos.org/glTF-Sample-Viewer-Release/),
    // so emitted asset URLs must be relative. Vite's default of "/" would resolve them against
    // the domain root and 404 every bundle, stylesheet and public asset in production.
    base: "./",
    plugins: [
        react(),
        tailwindcss(),
        // The renderer builds these URLs at runtime from plain strings (ResourceLoader's
        // `libPath`, the LUT paths, PhysX's emscripten `locateFile`), so Vite never sees them
        // as imports and cannot emit them. They have to exist verbatim under these paths.
        viteStaticCopy({
            // stripBase flattens the match: without it the source's own directory path is
            // recreated under dest, giving dist/libs/glTF-Sample-Renderer/dist/libs/...
            targets: [
                {
                    src: "glTF-Sample-Renderer/dist/libs/*",
                    dest: "libs",
                    rename: { stripBase: true }
                },
                {
                    src: "glTF-Sample-Renderer/dist/assets/*",
                    dest: "assets/images",
                    rename: { stripBase: true }
                }
            ]
        })
    ],
    resolve: {
        // Leftover from before gl-matrix/jpeg-js/fast-png were audited: root no longer imports
        // gl-matrix directly, but jpeg-js/fast-png dedupe stays in case that ever changes.
        dedupe: ["jpeg-js", "fast-png"]
    },
    // lucide-react ships one module per icon. Without pre-bundling it, the dev
    // server discovers new icons panel by panel, re-runs dependency optimisation
    // and reloads the page each time.
    optimizeDeps: {
        include: ["lucide-react"]
    },
    build: {
        outDir: "dist",
        emptyOutDir: true,
        sourcemap,
        rollupOptions: {
            output: {
                // The minifier strips the rollup-plugin-license banner unless legal comments
                // are explicitly kept; without this the whole third-party attribution block
                // silently disappears from the production bundle.
                comments: { legal: true }
            },
            plugins: [
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
        }
    }
});
