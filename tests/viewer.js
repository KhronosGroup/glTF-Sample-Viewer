import { expect } from "@playwright/test";

/**
 * DOM hooks that depend on the current UI framework. Phase 3 of the React
 * migration should only need to update this object, not the specs.
 */
export const ui = {
    canvas: "#canvas",
    loadingOverlay: ".loading-overlay",
    tabs: "#tabsContainer",
    tab: (name) => `[data-testid='tab-${name}']`,
    // Buefy forwards attributes to the inner <select>, React will not.
    modelSelect: ":is(select[data-testid='model-select'], [data-testid='model-select'] select)"
};

/**
 * Console output that is expected and unrelated to viewer correctness.
 */
const IGNORED_ERRORS = [
    // Favicon/CDN assets are not part of the viewer under test.
    /favicon/i
];

export function collectConsoleErrors(page) {
    const errors = [];
    page.on("console", (message) => {
        if (message.type() !== "error") {
            return;
        }
        const text = message.text();
        if (!IGNORED_ERRORS.some((pattern) => pattern.test(text))) {
            errors.push(text);
        }
    });
    page.on("pageerror", (error) => errors.push(String(error)));
    return errors;
}

export function expectNoConsoleErrors(errors) {
    expect(errors, `console errors:\n${errors.join("\n")}`).toEqual([]);
}

/**
 * Waits for the in-flight glTF load to finish. The overlay may already be gone
 * by the time this is called, so its absence is not treated as an error.
 */
export async function waitForLoadingToSettle(page) {
    const overlay = page.locator(ui.loadingOverlay);
    await overlay.waitFor({ state: "visible", timeout: 5_000 }).catch(() => {});
    await overlay.waitFor({ state: "detached", timeout: 120_000 });
}

/**
 * Assertions are scoped to the open panel so they cannot match content that
 * another tab happens to leave in the DOM.
 */
export function openPanel(page) {
    return page.locator("[data-testid='panel']:visible").first();
}

/**
 * Clicking a tab toggles it, so opening one that is already open would collapse
 * it. `aria-selected` says whether the panel is showing.
 */
export async function openTab(page, name) {
    const tab = page.locator(ui.tab(name));
    if ((await tab.getAttribute("aria-selected")) !== "true") {
        await tab.click();
    }
}

export async function openModelsTab(page) {
    await openTab(page, "models");
    await expect(page.locator(ui.modelSelect)).toBeVisible();
}

/**
 * Asserts the canvas matches the stored baseline. Callers must have waited for
 * loading to settle first: the overlay tints the canvas, and a screenshot taken
 * while it is up can be stable without being correct.
 */
export async function expectCanvasToRender(page, name) {
    await expect(page.locator(ui.canvas)).toHaveScreenshot(name, {
        timeout: 120_000,
        maxDiffPixelRatio: 0.02
    });
}

/**
 * Loads an asset from public/test-assets/ through the `model` URL parameter,
 * which is the only way to point the viewer at an arbitrary file without
 * driving a file picker.
 */
export async function loadTestAsset(page, name) {
    await page.goto(`/?noUI=1&model=test-assets/${name}`);
    await waitForLoadingToSettle(page);
}

/**
 * Returns whatever is currently drawn on the canvas, for comparing two assets
 * against each other rather than against a recorded baseline.
 */
export async function canvasPixels(page) {
    return page.locator(ui.canvas).screenshot();
}
