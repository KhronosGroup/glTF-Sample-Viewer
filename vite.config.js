import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createLogger, defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { viteStaticCopy } from "vite-plugin-static-copy";

// Generating the full merged sourcemap for the whole bundle is one of the most expensive parts
// of a rebuild, so it can be turned off for fast dev iteration via `SOURCEMAP=false npm run build`.
const sourcemap = process.env.SOURCEMAP !== "false";

// The renderer is consumed as a pre-built bundle (its package `main` points at
// dist/gltf-viewer.module.js), so editing its source does not show up in the app on its own.
// In dev this plugin runs the renderer's rolldown watch build in the background and triggers a
// full reload whenever it rewrites the bundle, so renderer changes appear without restarting
// `npm run dev`.
function rendererWatch() {
    const root = fileURLToPath(new URL(".", import.meta.url));
    const distFile = path.join(root, "glTF-Sample-Renderer", "dist", "gltf-viewer.module.js");

    return {
        name: "gltf-renderer-watch",
        apply: "serve",
        configureServer(server) {
            // Run the renderer's rolldown watch in its own process group so it can be
            // torn down cleanly (npm does not forward signals to its children otherwise).
            const renderer = spawn("npm", ["run", "watch", "-w", "@khronosgroup/gltf-viewer"], {
                cwd: root,
                stdio: "inherit",
                detached: true
            });

            const stop = () => {
                if (renderer.pid) {
                    try {
                        process.kill(-renderer.pid, "SIGTERM");
                    } catch {
                        // Already gone.
                    }
                }
            };

            // Watch the built bundle explicitly: it may resolve through the workspace symlink
            // under node_modules, which Vite's watcher ignores by default.
            server.watcher.add(distFile);
            server.watcher.on("change", (file) => {
                if (path.resolve(file) === distFile) {
                    server.ws.send({ type: "full-reload" });
                }
            });

            server.httpServer?.once("close", stop);
            process.once("SIGINT", stop);
            process.once("SIGTERM", stop);
        }
    };
}

// These wasm files are copied to libs/ below and loaded at runtime, so Vite's warning is expected
const runtimeWasmWarning =
    /new URL\("(physx-js-webidl|mikktspace_bg)\.wasm", import\.meta\.url\) doesn't exist at build time/;
const logger = createLogger();
const warnOnce = logger.warnOnce;
logger.warnOnce = (msg, options) => {
    if (!runtimeWasmWarning.test(msg)) {
        warnOnce(msg, options);
    }
};

export default defineConfig({
    customLogger: logger,
    // The deployed site lives under a subpath (github.khronos.org/glTF-Sample-Viewer-Release/),
    // so emitted asset URLs must be relative. Vite's default of "/" would resolve them against
    // the domain root and 404 every bundle, stylesheet and public asset in production.
    base: "./",
    plugins: [
        rendererWatch(),
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
        include: ["lucide-react"],
        // Don't pre-bundle the renderer: it is served straight from its dist bundle so the
        // rendererWatch plugin can reload the page when that bundle is rebuilt.
        exclude: ["@khronosgroup/gltf-viewer"]
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
