import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import license from "rollup-plugin-license";

// Generating the full merged sourcemap for the whole bundle is one of the most expensive parts
// of a rebuild, so it can be turned off for fast dev iteration via `SOURCEMAP=false npm run build`.
const sourcemap = process.env.SOURCEMAP !== "false";

// Renderer-sourced static files (PhysX/mikktspace wasm libs, LUT images) are copied into
// public/libs and public/assets/images by the predev/prebuild npm scripts, since Vite's
// public/ dir can't be populated from another package's build output at Vite build time.
export default defineConfig({
    // The deployed site lives under a subpath (github.khronos.org/glTF-Sample-Viewer-Release/),
    // so emitted asset URLs must be relative. Vite's default of "/" would resolve them against
    // the domain root and 404 every bundle, stylesheet and public asset in production.
    base: "./",
    plugins: [react(), tailwindcss()],
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
