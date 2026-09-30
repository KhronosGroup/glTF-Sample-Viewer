import { expect } from "@playwright/test";

/**
 * DOM hooks that depend on the current UI framework. Phase 3 of the React
 * migration should only need to update this object, not the specs.
 */
export const ui = {
    canvas: "#canvas",
    loadingOverlay: ".loading-overlay",
    tabs: "#tabsContainer",
    modelsTab: "[data-testid='tab-models']",
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
 * Tab content starts collapsed, so the panel has to be opened before any of its
 * controls can be interacted with.
 */
export async function openModelsTab(page) {
    await page.locator(ui.modelsTab).click();
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
