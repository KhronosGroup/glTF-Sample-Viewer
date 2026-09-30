# Vue → React refactor plan

Goal: replace Vue/Buefy with React in the root web app, then remove RxJS.

## Scope

In scope: `src/` (`main.js`, `logic/uimodel.js`, `ui/**`), `index.html`, `vite.config.js`, `package.json`, `eslint.config.js`.

Out of scope: `glTF-Sample-Renderer/`. It is a framework-agnostic ES module package consumed as `@khronosgroup/gltf-viewer` and must not be touched. If something in the renderer blocks a step, stop and raise it rather than patching across the boundary.

Current size: `App.vue` 1222 lines, `main.js` 755, `uimodel.js` 610, `sass.scss` 489, plus `ui.js`, `CanvasUI.vue`, `ToggleButton.vue`, `JsonToUiTemplate.vue`.

## Decisions

**Stay on Vite. Do not move to Next.js.**
The app is a single-page, client-only WebGL viewer with no routing and no server. Next.js adds SSR guards, `basePath` configuration, and a replacement for `rollup-plugin-license`, and buys nothing. Staying on Vite keeps `base: "./"`, which is load-bearing — see "Subpath deployment" below.

**Keep Bulma. Drop only Buefy.**
`sass.scss` imports Bulma utilities, customizes `$colors`, then imports `bulma` and `buefy`. Bulma is plain CSS and works unchanged with React. Only the Buefy import (line 65) and the `<b-*>` component markup need replacing. This keeps most of the 489-line stylesheet intact and is the single biggest de-risking choice available.

**Zustand (vanilla) for state.**
Must be usable outside React: the rAF loop and `uimodel.js` both read and write state with no React in scope. Use `zustand/vanilla` `createStore`, with the React binding added only where components consume it.

**Do not plan a standalone "drop RxJS" milestone.**
RxJS usage splits three ways and each has a different answer — see Phase 1, Phase 3, Phase 4.

## Phase 0 — Load orchestration fix (still Vue) — DONE

Self-contained in `main.js`. Verifiable by hand today. Survives the migration untouched.

`mergeMap` ran both loads to completion, and the correction turned out to be larger than
swapping the operator: the state-applying side effects lived inside the promise chain
(`loadGltf().then(...)`), not in the observable, so unsubscribing would not have stopped
them. Concurrent loads corrupted each other's texture state, leaving the visible model
untextured.

glTF loads cannot be cancelled once started, so they are now queued, and a load whose id
is no longer the latest applies nothing. Validation does use `switchMap`, which is enough
there because it returns its result through the stream instead of mutating shared state.
`share()` on `gltfLoaded` is load-bearing and was preserved: it has three subscribers.

## Phase 1 — Introduce the store, renderer→UI direction only (still Vue) — DONE

This is the real design work and all of it survives the migration.

Migrate the ~108 `this.app.x = ...` writes in `uimodel.js` to `store.setState`. These are values the renderer pushes *into* the UI: `scenes`, `cameras`, `animations`, `graphs`, `materialVariants`, `statistics`, `validationReport`, `validationReportDescription`, `disabledAnimations`, `models`, `flavours`, `environments`, `environmentLicense`, `assetCopyright`, `assetGenerator`, `xmp`, `hasPhysics`, `customEvents`.

Add a small `shallowRef` + `store.subscribe` adapter so the existing Vue template keeps reading them. The adapter is throwaway; everything else is kept.

**Leave the ~45 Subjects and the template alone.** Every control is double-bound (`v-model="ibl"` *and* `v-on:input="iblChanged.next(...)"`). Rewriting that direction means editing ~45 template lines that JSX deletes anyway.

**Hard scope limit.** Only state that `main.js` or `uimodel.js` writes. Display-only state stays in Vue until Phase 3: `activeTabIndex`, `activeTab`, `tabContentHidden`, `isMobile`, `uiVisible`, `noUi`, `customEventValues`, `environmentVisiblePrefState`, `volumeEnabledPrefState`, the loading/toast handles.

Do not let the store try to own `state.renderingParameters` or any other renderer-owned mutable object. The store holds UI state; subscriptions push values into renderer state. Keep that boundary explicit.

Exit criteria: app behaves identically; `uimodel.js` no longer holds a reference to the Vue instance for these fields.

## Phase 2 — Add React alongside Vue

React cannot replace Vue in one commit without leaving the app unrunnable in between, so
both plugins run side by side until the last component is ported.

- Add `react`, `react-dom`, `@vitejs/plugin-react`, `eslint-plugin-react`,
  `eslint-plugin-react-hooks`. Keep `vue`, `@vitejs/plugin-vue` and Buefy for now.
- `vite.config.js`: register the React plugin next to the Vue one. Everything else stays —
  `base: "./"`, `dedupe`, the scss `quietDeps`, and the `rollup-plugin-license` banner all
  survive because Vite is Rollup-based.
- `eslint.config.js`: add React + hooks plugins, extend globs to `.jsx`. **Expect a burst of
  new lint errors** — the current flat config lints only `.js`, so all `.vue` script blocks
  are presently unlinted. Budget for this.
- `.prettierrc` scripts: extend globs from `src/**/*.js` to include `.jsx`.
- Keep `predev`/`prebuild`/`sync:renderer-assets` unchanged. Output stays `dist/`, so the
  Pages workflow is unchanged.

Vue, `@vitejs/plugin-vue`, Buefy, `index.html`'s second mount point and
`src/ui/viewer_store_mixin.js` are removed at the end of Phase 3, not here.

## Phase 3 — Component migration

Order: shell → canvas → panels, one tab at a time.

**Entry + canvas.** `CanvasUI.vue` becomes a `<Canvas>` with a ref. Drop the two-app mount-order hack in `ui.js` — it exists only because `App`'s `mounted()` needs `#canvas` to already exist. Drop `CanvasUI`'s dead `@mousemove="mouseMove"` handler and unused `timer`. Consolidate the two separate `canvas.getContext("webgl2")` calls (`main.js` and `App.vue` `mounted()`) into one.

**`main.js`** moves into a `useEffect` with real teardown: `cancelAnimationFrame`, unsubscribe everything, remove canvas listeners, dispose WebGL/PhysX. Develop with StrictMode **on** — it double-invokes effects and will surface exactly the leaks this code currently has.

**`App.vue` → tab panels.** Do not port 1:1. Split into a tabs shell plus Models, Display/Lighting, Validation, Animation, Graphs/Interactivity, Physics, Advanced.

**Buefy component mapping** (counts from current usage): `b-switch` 29, `b-field` 26, `b-select` 10, `b-input` 9, `b-tab-item` 8, `b-slider-tick` 8, `b-tooltip` 6, `b-slider` 2, `b-radio` 2, and one each of `b-tabs`, `b-dropdown`, `b-dropdown-item`, `b-checkbox`, `b-button`, `b-icon`, `b-collapse`. With Bulma retained, most become plain markup with Bulma classes; only tabs, slider, tooltip, dropdown and collapse need real components or small hand-rolled ones.

**`$buefy.toast` / `$buefy.loading`** are called imperatively from `main.js` and from the `console.warn`/`console.error` override in `ui.js`. Replace with a toast library that exposes a module-level API callable from non-React code.

**Small components.** `ToggleButton.vue` → controlled button; drop its internal `isOn` duplicate state and the imperative `setState()` method. `JsonToUiTemplate.vue` → self-referencing recursive function component.

**Subjects die here.** As each panel is rewritten in JSX it writes to the store directly, so the corresponding Subject, its no-op `.pipe()` in `uimodel.js`, and its `listenForRedraw` call in `main.js` become deletions rather than rewrites. 48 no-op `.pipe()` calls and 41 `listenForRedraw` calls go this way.

Preserve the `startWith` seeding behaviour for `tonemap`, `debugchannel`, `clearColor`, `hdr`. The store gives the initial *value* for free, but the *side effect* that writes it into `state.renderingParameters` must still fire once at init. Easy to lose silently.

## Phase 4 — Pointer gestures

Independent of everything above; can land at any point.

`getInputObservables` uses `mergeMap` + `pairwise` + `takeUntil` for `mouseOrbit`, `mousePan`, `dragZoom`, `touchOrbit`, `touchZoom`. This is the only place RxJS earns its keep. Two options:

1. Keep RxJS solely for this (bump to v7 — `pluck` is used once and is removed in v8).
2. Rewrite to Pointer Events with `setPointerCapture`. This collapses the duplicated mouse/touch paths, removes the `mouseup`-on-`document` + `mouseleave` capture workaround, and fixes the inconsistency where `dragZoom` uses `movementY` while the touch path uses computed deltas. Likely *smaller* than the RxJS version.

Note that `dragSmoother` in `main.js` already dumps every emission into an imperative pulse buffer, so the stream semantics are discarded one line downstream regardless.

Option 2 removes the last RxJS dependency.

## Cross-cutting things to watch

**Subpath deployment.** The site is served from a subpath. `base: "./"` must stay. The renderer resolves assets **document-relative at runtime**, outside the bundler: `libPath = "./libs/"` and `lut_sheen_E_file: "assets/images/..."` in `resource_loader.js`, `locateFile: () => "./libs/physx-js-webidl.wasm"` in `PhysX.js`, plus `new URL(..., import.meta.url)` for the splat sort worker and mikktspace wasm. Also `<script src="libs/libktx.js">` in `index.html` and `assets/ui/...` image paths in `App.vue`. None of these go through Vite. The page must continue to be served at a URL ending in `/`.

**`v-html` → security.** `environmentLicense` is built from **fetched remote license text** and injected as HTML. Porting it to `dangerouslySetInnerHTML` carries the XSS vector forward. Build it as JSX from parsed parts instead. `getValidationCounter()` / `getValidationInfoDiv()` also return HTML strings; convert both to components.

**The render loop must not use React.** It reads state synchronously every frame. Use `store.getState()` inside the loop, never hooks or subscriptions. In particular `app.loadingComponent !== undefined` is currently read in the rAF loop to suppress redraws — that Buefy handle must become a plain boolean in the store.

**DOM manipulation to unwind (13 sites in `App.vue`).** Injecting a GitHub logo `<a><img>` into Buefy's generated tab `<ul>`; stripping the `input` class off the colour picker; `navElement.style.width = "100px"`; mobile `marginTop` fixup; manual `is-active` class add/remove for collapsible tabs; `getElementById("customEventForm").checkValidity()`. Most of these exist to work around Buefy's markup and should simply disappear rather than be reimplemented.

**Global side effects install once.** The `console.warn`/`console.error` override and `window.onerror` in `ui.js` must be installed once at module scope or in a guarded effect with restore-on-cleanup — not per mount.

**Two icon systems.** Buefy `b-icon` uses Material Design Icons; the drop overlay uses FontAwesome (`fas fa-folder-open`). Both load from CDN in `index.html`. Removing Buefy is a chance to consolidate, and to self-host rather than depend on two CDNs.

**Ordering dependency.** `main.js` sets `app.supportsFloatingPointFramebuffer` before UI logic runs. That must land in the store before the relevant control renders.

**No test safety net.** `npm test` now runs Playwright. The specs assert on the rendered
canvas rather than on markup so they stay meaningful across the rewrite; framework-specific
selectors are confined to `tests/viewer.js`. Run `npm test` after every step, and
`npm run test:update-snapshots` only when a canvas change is intended.
**RxJS version.** `rxjs@^6.6.7` is past EOL. If any RxJS survives past Phase 3, bump to 7.x.

## Manual QA checklist

Run after each phase.

- Default model loads; model and flavour dropdowns; rapid switching mid-load
- Drag-and-drop: glTF, glb, folder with external buffers/textures, `.hdr`
- Orbit / pan / zoom, mouse and touch; input smoothing on and off
- Scene and camera selection; material variants; animations incl. disjoint handling
- Environment switching, HDR upload, environment licence text, rotation, blur, clear colour
- Validation tab: error/warning/info counters, ignored-warning case, report download
- Interactivity graphs, custom events; physics tab, collider/joint debug, reset, step
- Canvas capture, camera export
- URL params: `model`, `yaw`, `pitch`, `distance`, `noUI`
- Mobile layout (< 768px), UI collapse/expand
- Production build served from a subpath — verify wasm, workers, LUT images and the licence banner
