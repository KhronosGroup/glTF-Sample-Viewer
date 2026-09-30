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

## Phase 2 — Add React alongside Vue — DONE

Both plugins ran side by side so no commit left the app unrunnable. The React UI was
opt-in behind `?react=1` until it reached parity.

## Phase 3 — Component migration — DONE

Ported in order: canvas, shell + Models, Display, Validator + Credits, Animations +
Graphs, Physics + Advanced. Vue, Buefy's runtime, `App.vue`, the two Vue components and
the throwaway store mixin are gone. The bundle dropped from 4,462 kB to 4,041 kB
(758 kB to 647 kB gzipped).

**Bulma was kept, and so was Buefy's stylesheet.** Bulma alone was not enough: switch,
slider, tooltip, collapse, dropdown and the vertical tab bar are all Buefy, and
`sass.scss` is written against its class names. Splitting Buefy in two — keeping the SCSS,
dropping the Vue runtime — meant the React primitives only had to emit the same DOM.
The exact markup was captured from the running app with `scripts/dump-dom.mjs` rather
than reverse-engineered from Buefy's Vue source.

Every Buefy class name now lives in `src/ui/react/controls.jsx`, `Slider.jsx`,
`Dropdown.jsx`, `JsonTree.jsx` and `Notices.jsx`. A later Tailwind migration is a rewrite
of those files plus deleting the SCSS, not a hunt through the markup.

What the port removed along the way:

- Tab collapse is state, instead of hand-editing `is-active` on generated markup.
- The GitHub logo is JSX, instead of a DOM node appended in `mounted()`.
- The nav width is a prop, instead of an imperative style write.
- The environment licence and the validator badge are components, instead of HTML strings
  injected with `v-html`. See "v-html → security" below.
- Seven near-identical custom-event branches and twenty-one near-identical switches became
  data-driven lists.

Still outstanding from this phase: nothing. `main.js` now exports `initViewer(canvas)` with a
teardown, the `Viewer` component owns the canvas, the `flushSync` hack is gone and both roots
run under `StrictMode`.

## Phase 4 — Drop RxJS — DONE

RxJS is removed entirely. The Subjects are a plain module-level event bus; the gesture
streams are an imperative translation in `src/logic/canvas_input.js`.

This was **not** the Pointer Events rewrite. That is a behavioural change — the mouse and
touch paths are not equivalent, since touch orbit is doubled and pinch has no mouse
counterpart — and bundling it into a dependency removal would have made any regression
impossible to attribute. It remains available as a separate change.

Camera specs were added first, and caught a real regression: `pairwise()` only emits from
the second `mousemove`, so seeding the drag from the `mousedown` position added an extra
delta segment and over-rotated.

## Known gaps

- **No test covers the viewer teardown.** It was verified once by forcing an unmount with
  temporary instrumentation (two starts, one stop, one canvas, correct render after
  remount), but exercising it from a spec needs a remount hook the app does not have. If
  `dispose()` breaks, nothing will fail.
- **The custom event Send button no longer gates on validity.** The Vue version called
  `checkValidity()` on the form and disabled Send; that went with the DOM access and was
  not replaced.
- **`physicsEngineChanged` has no listener.** PhysX is the only engine, as before.
- **Volume/transmission coupling** is reproduced as-is and tracked upstream in
  KhronosGroup/glTF-Sample-Viewer#674.

## Cross-cutting things to watch

**Subpath deployment.** The site is served from a subpath. `base: "./"` must stay. The renderer resolves assets **document-relative at runtime**, outside the bundler: `libPath = "./libs/"` and `lut_sheen_E_file: "assets/images/..."` in `resource_loader.js`, `locateFile: () => "./libs/physx-js-webidl.wasm"` in `PhysX.js`, plus `new URL(..., import.meta.url)` for the splat sort worker and mikktspace wasm. Also `<script src="libs/libktx.js">` in `index.html` and `assets/ui/...` image paths in the tab components. None of these go through Vite. The page must continue to be served at a URL ending in `/`.

**`v-html` → security. FIXED.** `environmentLicense` was built from **fetched remote licence text** and injected as HTML. `UIModel` now publishes structured fields (`copyright`, `sourceUrl`, `licenseName`, `licenseUrl`) and the UI renders them as elements, so remote text no longer reaches `innerHTML`. `getValidationCounter()` / `getValidationInfoDiv()` were also HTML strings and are now components.

**The render loop must not use React.** It reads state synchronously every frame. Use `store.getState()` inside the loop, never hooks or subscriptions. In particular `app.loadingComponent !== undefined` is currently read in the rAF loop to suppress redraws — that Buefy handle must become a plain boolean in the store.

**DOM manipulation to unwind. DONE.** All thirteen sites are gone rather than reimplemented: most existed only to work around Buefy's generated markup. The exception is `getElementById("customEventForm").checkValidity()`, which was dropped along with the `customEventValid` gating — the Send button is no longer disabled on invalid input. Worth revisiting if that gating mattered.

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
