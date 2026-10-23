import { expect } from "@playwright/test";

/**
 * DOM hooks that depend on how the UI is built. A markup change should only
 * need to update this object, not the specs.
 */
export const ui = {
    canvas: "#canvas",
    spinner: "[data-testid='spinner']",
    menu: "[data-testid='menu']",
    tab: (name) => `[data-testid='tab-${name}']`,
    modelSelect: "[data-testid='model-select']",
    flavourSelect: "select[data-testid='flavour-select']"
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
 * Waits for the in-flight glTF load to finish. The spinner may already be gone
 * by the time this is called, so its absence is not treated as an error.
 */
export async function waitForLoadingToSettle(page) {
    const spinner = page.locator(ui.spinner);
    await spinner.waitFor({ state: "visible", timeout: 5_000 }).catch(() => {});
    await spinner.waitFor({ state: "detached", timeout: 120_000 });
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
 * The model picker is a listbox rather than a native select, so a choice is a
 * pair of clicks and the chosen name is the button's text.
 */
export async function selectModel(page, name) {
    await page.locator(ui.modelSelect).click();
    await page.getByRole("option", { name, exact: true }).click();
}

export function expectSelectedModel(page, name) {
    return expect(page.locator(ui.modelSelect)).toHaveText(name);
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
 * Drops files onto the canvas, the only path that exercises side-file
 * resolution; the `model` parameter fetches everything over HTTP instead.
 *
 * simple-dropzone prefers `dataTransfer.items` and walks them as FileSystemEntry
 * objects, which cannot be produced synthetically, so this fakes the four
 * members it reads. Each file is given as a `[name, contents]` pair.
 */
export async function dropFiles(page, files, folder = "dropped") {
    await page.evaluate(
        ({ files, folder, canvas }) => {
            const items = files.map(([name, contents]) => ({
                webkitGetAsEntry: () => ({
                    name,
                    isFile: true,
                    isDirectory: false,
                    fullPath: `/${folder}/${name}`,
                    file: (callback) => callback(new File([contents], name))
                })
            }));

            const event = new Event("drop", { bubbles: true, cancelable: true });
            Object.defineProperty(event, "dataTransfer", { value: { files: [], items } });
            document.querySelector(canvas).dispatchEvent(event);
        },
        { files, folder, canvas: ui.canvas }
    );
}
