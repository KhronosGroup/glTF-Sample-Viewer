# Vite migration plan (root app only — glTF-Sample-Renderer submodule is untouched)

Scope: replace Rollup with Vite for the `gltf-sample-viewer-example` app (this repo's
root package). The renderer submodule keeps its own independent Rollup build
(see `/memories/repo/vite-migration-notes.md` for why: it's a separately published
npm package built from a git submodule).

Starting point: all known dead/duplicated build-config issues in the root Rollup
setup were already fixed prior to this migration (glslify/wasm no-ops, gl-matrix
double bundling, unused deps, preferBuiltins mismatch — see git log). Root's Rollup
config, post-cleanup, only needs: `@rollup/plugin-node-resolve`, `@rollup/plugin-commonjs`,
`rollup-plugin-scss`, `rollup-plugin-delete`, `rollup-plugin-license`,
`rollup-plugin-sourcemaps2`, `@rollup/plugin-replace`, plus two custom copy-file plugins.
Neither `glslify` nor `wasm()` were ever needed at the root level — good news for the
migration, since Vite's default asset handling doesn't need to replicate those.

## Steps (one commit each)

1. This plan doc.
2. Add `vite` + `@vitejs/plugin-vue` devDependencies, scaffold an initial `vite.config.js`
   (not yet wired into scripts).
3. Convert the two named templates (`#toggleButtonTemplate`, `#jsonToUITemplate`) from
   `index.html` `<script type="text/x-template">` blocks into real SFCs
   (`src/ui/components/ToggleButton.vue`, `src/ui/components/JsonToUiTemplate.vue`).
   Update `src/ui/ui.js` to import + register them instead of string-template lookup.
4. Convert the large root `#app` markup (~400 lines of Bulma/Buefy templated UI in
   `index.html`) plus its `data()/watch/computed/methods` (currently inline in
   `appCreated` in `src/ui/ui.js`) into `src/ui/App.vue`. `index.html`'s `<div id="app">`
   becomes an empty mount point again.
5. Convert the second, smaller Vue root (`#canvasUI`, mounted separately, wraps just the
   `<canvas>` element) into `src/ui/CanvasUI.vue`.
6. Switch `src/ui/ui.js` back to `import { createApp } from "vue"` (runtime-only build) —
   no longer need the full/cjs build now that templates are precompiled SFCs. Try dropping
   the `replace({ "process.env.NODE_ENV": ... })` hack in the Rollup/Vite config (it existed
   only to satisfy the full Vue build's runtime env checks) and confirm the build still
   works without it.
7. Move `assets/images`, `assets/ui`, and the renderer's copied `libs`/LUT files under a
   Vite `public/` directory (or keep a custom small plugin for the two renderer-sourced
   copies, since `public/` can't pull files from another package's build output at build time).
8. Write the final `vite.config.js`: `@vitejs/plugin-vue`, `resolve.dedupe` for
   `jpeg-js`/`fast-png` (leftover from Rollup config), `build.rollupOptions.plugins` for
   `rollup-plugin-license` (Vite's prod build is Rollup-based, so this plugin still works
   as-is), sourcemap config, and the custom cross-package copy plugin from step 7.
9. Update `package.json` scripts: `dev`/`build`/`preview` via `vite`; drop
   `concurrently`/`http-server`/`tail -f /dev/null` process-juggling in favor of Vite's
   single dev server process; drop now-unneeded Rollup packages
   (`rollup`, `rollup-plugin-scss`, `rollup-plugin-delete`, `rollup-plugin-sourcemaps2`,
   `@rollup/plugin-node-resolve`, `@rollup/plugin-commonjs`, `@rollup/plugin-replace` if the
   NODE_ENV hack is dropped in step 6). Keep `rollup-plugin-license` (still used via
   `build.rollupOptions.plugins`).
10. Test `vite` (dev server) and `vite build` + `vite preview`; fix fallout; record findings
    below.

## Anticipated issues / things to verify

- **Buefy Next (`@ntohq/buefy-next`) + Vite esbuild pre-bundling.** Untested with Vite so
  far. It's a CJS/UMD-ish package today handled via `@rollup/plugin-commonjs`; Vite's
  esbuild-based dependency pre-bundling *should* handle this automatically, but needs a
  real smoke test (opening every tab, dialogs, toasts, dropdowns, sliders).
- **Dynamic `:src="...svg"` bindings won't get Vite's build-time asset URL rewriting.**
  Vite only rewrites *static* `src="./x.png"` attributes in `.vue` templates at compile
  time. This app uses many `v-bind:src="[condition ? 'assets/ui/Foo.svg' : ...]"` dynamic
  expressions (see the tab icons in the old `#app` template) — these are runtime string
  concatenations, not statically analyzable, so Vite leaves them alone. As long as these
  assets live under `public/assets/ui/...` (served from site root) exactly like today's
  `dist/assets/ui/...`, this should keep working unchanged — but it must be verified, not
  assumed, since it's an easy thing to silently break.
- **Two separate Vue root apps mounted in one page** (`#app` and `#canvasUI`) is unusual
  but not a problem — becomes two separate SFC trees + two `createApp().mount()` calls.
- **`index.html` as a real Vite entry.** Today `index.html` is copied byte-for-byte into
  `dist/` and hardcodes `<script src="main.js">` / `<link href="GltfSVApp.css">`. Vite
  processes `index.html` as the build entry directly and injects hashed asset URLs — the
  custom `copyFile(".", "./dist", "index.html", true)` Rollup plugin goes away, but the
  `<script type="module" src="main.js">` tag needs to point at `/src/main.js` for Vite's
  dev server to pick it up, and the external CDN `<script>`/`<link>` tags (Draco decoder,
  Material Design Icons, FontAwesome, Google Fonts, `libs/libktx.js`) stay untouched.
- **`libs/libktx.js` and Draco decoder are loaded as global `<script>` tags, not ES
  modules.** They're copied from `glTF-Sample-Renderer/dist/libs`, unrelated to Vite's
  module graph — should keep working as long as they still land at `dist/libs/...` (or
  `public/libs/...` symlinked/copied) as they do today.
- **`NODE_OPTIONS=--max-old-space-size=4096`** was needed for Rollup's expensive
  sourcemap-merging watch rebuilds — expected to be unnecessary for Vite's dev server;
  keep it for the production `vite build` script until proven otherwise.
- **SCSS**: Vite has built-in Sass support (no plugin needed), but double-check the
  `quietDeps`-equivalent option to silence Bulma's legacy Dart Sass API deprecation
  warnings (currently silenced via `rollup-plugin-scss`'s `quietDeps: true`).
- **`rollup-plugin-license`'s `includeSelf: true`** banner generation needs to keep
  scanning the *same* final dependency graph — worth diffing the generated banner
  before/after migration to make sure nothing silently dropped out of the license report.

## Findings / log (updated as work proceeds)

- (empty so far — filled in as each step lands)
