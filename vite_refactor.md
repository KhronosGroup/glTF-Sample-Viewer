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

Migration complete as of 2026-09-22. `npm run dev`, `npm run build` + `npm run preview` all
verified working (Vite dev server, production build, and preview server smoke-tested in a
real browser: tabs/dropdowns/sliders render via Buefy, WebGL2 context initializes, canvas
renders the model with IBL lighting, GitHub link injection in `mounted()` works).

Correction: an earlier revision of this log claimed the canvas render was smoke-tested. It
was not — the app bootstrap was never invoked at all (see the "entry point never invoked"
entry below), so the canvas was solid black from commit `3a33064d` until it was fixed. The
UI-panel half of that claim was accurate; the canvas half was not. Canvas rendering is now
genuinely verified via a headless-browser screenshot showing the DamagedHelmet model lit by
the environment IBL.

Issues hit and fixed along the way:

- **Buefy Next + Vite pre-bundling**: no issues. Works out of the box, no special config
  needed beyond the standard `@vitejs/plugin-vue`.
- **Two orphan `</b-field>` closing tags in the old HTML** (Display tab's exposure slider,
  Validator tab) — browsers silently tolerated the mismatched tags in the old runtime-
  compiled markup, but Vue's strict SFC parser treats it as a hard syntax error. Fixed by
  removing the stray closing tags (DOM output unchanged).
- **Static `src="assets/..."` attributes and the subpath-deployment regression.** Vite's SFC
  compiler statically resolves literal (non-dynamic) `src="..."` attributes as module imports
  relative to the `.vue` file's location. The first attempt at fixing this made every asset
  path root-absolute (`/assets/ui/...`) so Vite would treat them as public asset URLs. That
  worked locally and was badly wrong for production: the site is deployed to a *subpath*
  (`github.khronos.org/glTF-Sample-Viewer-Release/`), and main's Rollup build had always
  emitted *relative* paths, which work at any depth. Served from a subpath, root-absolute
  URLs resolve against the domain root instead — verified by serving the build under a
  subpath, where the JS, CSS and `libs/libktx.js` all 404'd and the page came up completely
  blank (no canvas, no tabs, empty body). The `Publish_to_Github_Pages.yml` workflow would
  have deployed exactly that. Fixed properly by restoring main's relative-path behaviour:
  `base: "./"` in `vite.config.js` (so Vite emits `./assets/...` for the tags it injects),
  `template: { transformAssetUrls: false }` on `@vitejs/plugin-vue` (so the SFC compiler stops
  trying to resolve literal `src` attributes as module imports), and all 26 `/assets/...`
  references in `App.vue` plus the two in `index.html` reverted to relative. Verified working
  from the dev server, from the site root, and from a subpath — 14/14 images load, zero 404s
  and zero console errors in all three.
- **Real mount-order bug surfaced by the SFC conversion**: the `<canvas>` element used to be
  static HTML in `index.html`, always present at page load regardless of Vue mount order.
  After converting it to `CanvasUI.vue`, it only exists once `canvasUI.mount()` runs. `App`
  was mounting first and its `mounted()` hook called
  `document.getElementById('canvas').getContext(...)` before the canvas existed, throwing on
  load. Fixed by mounting `canvasUI` before `appCreated` in `ui.js`.
- **`.wasm` runtime resolution warning** (`physx-js-webidl.wasm`, `mikktspace_bg.wasm`
  "could not be resolved at build time and remain runtime URLs") appears during `vite build`
  but is harmless — the actual runtime loading path uses a hardcoded relative
  `"./libs/physx-js-webidl.wasm"` string (via `locateFile`), not the static import Vite
  warns about; this matches the pre-Vite behavior where root's `wasm()` Rollup plugin was
  already confirmed to be a no-op for this exact reason.
- **Pre-existing latent bugs, since fixed**: Vue dev warnings for `noUI` (typo for `noUi`),
  `environmentLicense` (never defined in `data()`), and `tabContent` (typo for
  `tabContentHidden`, in the Validator tab's header) being accessed but undefined. These
  were already broken in the original runtime-compiled template/data — the SFC conversion
  just made Vue's warnings about them visible in the dev console (same runtime behavior
  either way, `undefined` in the template just became empty/falsy). Fixed by aligning the
  template/`beforeMount` on the `noUi` data key, correcting the `tabContent` typo to
  `tabContentHidden`, and adding `environmentLicense` to `data()` so `uimodel.js`'s
  `this.app.environmentLicense = ...` assignment is actually reactive.
- **Buefy `BTooltip` prop-type warning on the IBL Intensity / Exposure sliders**: their
  `custom-formatter` callbacks returned a `Number`, but `BSlider`/`BSliderThumb` forward
  the formatted value straight into `BTooltip`'s `label` prop, which is typed `String`.
  Fixed by wrapping both formatters' return values in `String(...)`.
- **Entry point never invoked — the black-canvas regression.** Pre-migration there were two
  distinct `main.js` files: `src/main.js` (which only ever *exported* the bootstrap as
  `export default async () => {...}`) and a tiny root-level `main.js` shim that Rollup copied
  into `dist/`, containing just `import main from "./GltfSVApp.js"; main();`. That shim was
  the *only* call site for the bootstrap. Commit `3a33064d` deleted the shim and repointed
  `index.html` at `/src/main.js` directly, on the assumption that the shim was merely a
  filename bridge. It wasn't — it was the invocation. Importing an ES module runs its
  top-level statements, but `export default async () => {...}` only *defines* the function,
  so nothing ran: no `GltfView`/state creation, no model-index or environment fetches, and no
  `requestAnimationFrame` loop. The canvas stayed at its default 300x150 and rendered solid
  black, with zero console errors and zero network requests to give the game away. Fixed by
  making `src/main.js` self-invoke (`const main = async () => {...}; export default main;
  main();`), which is the normal idiom for a Vite HTML entry — entry modules are expected to
  have side effects. The `export default` is retained because `package.json`'s `main`/`module`
  fields still point at this file.
- **License banner was silently dropped from the production bundle.** This is the item the
  "Anticipated issues" section above flagged, and it did regress. `rollup-plugin-license`
  *does* still run correctly under Vite 8 (which bundles with rolldown, not Rollup) and the
  banner is generated — but rolldown's minifier stripped it, so the shipped bundle carried no
  third-party attribution at all. Confirmed by building with `--minify false`, where the
  banner reappears. Fixed with two changes: `@license` added as the first line of
  `LICENSE_BANNER.txt`, and `build.rollupOptions.output.comments = { legal: true }` in
  `vite.config.js`. Both are needed — the marker alone is not enough, because Vite's default
  is to strip legal comments. Verified: the minified bundle again carries the banner with all
  13 attributed packages.
- **Banner dependency list diff (main vs Vite), after the fix**: 13 packages vs main's 16.
  The only three dropped are `vue`, `@vue/compiler-core` and `@vue/compiler-dom` — the
  runtime template compiler, which is legitimately no longer bundled (step 6). Vue itself is
  still attributed via `@vue/runtime-core`/`runtime-dom`/`reactivity`/`shared`, same MIT
  license and same 3.5.10 version, so no attribution was actually lost.
- Noted-but-not-fixed items from before the migration started (gl-matrix double bundling
  possibility, preferBuiltins mismatch) don't apply anymore — gl-matrix was already
  externalized in the renderer and preferBuiltins aligned in earlier cleanup commits (see
  `/memories/repo/vite-migration-notes.md`).

## Verifying the Vite build against main's Rollup build

Byte-identical output is impossible (different bundler, minifier, chunking and hashed
filenames), so equivalence was established on the properties that actually matter. Method:
build `main` in a throwaway `git worktree` (its submodule pin is identical to this branch's,
so the renderer can be symlinked and `npm install --ignore-scripts` used to skip the
expensive preinstall), build this branch, then compare.

What is guaranteed to match, and was verified:

- **Copied static assets are byte-identical.** All 31 files under `assets/images`,
  `assets/ui` and `libs` (LUT PNGs, SVG icons, `libktx.js`, all `.wasm`) match by sha256.
  These pass through both builds untouched, so any difference here is a real defect.
- **The runtime module inventory is equivalent.** Compared via the `sources` arrays of both
  builds' sourcemaps, which is bundler-agnostic. Raw counts differ a lot (385 vs 166) but
  that is representation, not content: Vite resolves `@khronosgroup/gltf-viewer` to its
  prebuilt `dist/gltf-viewer.module.js` (one source entry) whereas Rollup walked the
  renderer's source tree (200+ entries). Verified the code is genuinely present by grepping
  both bundles for distinctive string literals, which survive minification —
  `event/onStart`, `flow/branch`, `meshopt`, `IHDR`, `KHR_draco_mesh_compression` etc. all
  appear in both. The rxjs path difference (`rxjs/src` vs `rxjs/_esm5`) is a sourcemap
  attribution artifact of `rollup-plugin-sourcemaps2`, same library and version.
- **CSS is equivalent**: 1236 of ~1237 class/id selectors shared; the handful of apparent
  differences are hex colour literals reformatted by the CSS minifier.
- **`index.html`**: meta tags and the inline bootstrap script are identical; all four
  external CDN references (Draco, Google Fonts, Material Design Icons, FontAwesome) are
  present in both. The remaining diff is the migration itself (markup moved into SFCs, asset
  paths gained a leading `/`, hashed bundle tags replace the fixed `GltfSVApp.*` names).
- **Runtime behaviour matches**: both builds served and driven headless render a 1300x900
  canvas with WebGL2, fetch the same 10 remote assets, report zero console/page errors, and
  produce visually identical screenshots.

Expected differences that are *not* defects: bundle size (7.8 MB → 4.0 MB, because main was
never minified — its Rollup config has no terser), hashed filenames and chunk splitting, the
dropped root `main.js` shim, and the dropped Vue runtime compiler. That last one is safe
only because no runtime template compilation remains: main's `index.html` had two
`text/x-template` blocks, and this branch has none.

Re-running this comparison is worthwhile after any future bundler or major dependency
upgrade — it is what surfaced the silently-dropped license banner above.

One thing the comparison did *not* catch on its own, because both builds were served from a
root: asset paths must stay relative for the subpath deployment. Serve `dist/` from a
subdirectory and load it before trusting a build, e.g.

    mkdir -p /tmp/t/glTF-Sample-Viewer-Release && cp -R dist/. /tmp/t/glTF-Sample-Viewer-Release/
    python3 -m http.server 8080 --directory /tmp/t
    # then open http://localhost:8080/glTF-Sample-Viewer-Release/

A blank page with 404s for `assets/*.js` means something reintroduced root-absolute URLs.

