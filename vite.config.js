import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { viteStaticCopy } from "vite-plugin-static-copy";

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
        // Not the default .vite/license.md: GitHub Pages may not serve dot folders
        license: { fileName: "licenses.md" },
        rolldownOptions: {
            output: {
                // Keeps the renderer's /*! license banner, which the minifier would otherwise strip
                comments: { legal: true },
                banner: "/*! glTF Sample Viewer | Apache-2.0 | Third-party licenses: licenses.md */"
            }
        }
    }
});
