import { expect, test } from "@playwright/test";
import { collectConsoleErrors, expectNoConsoleErrors, waitForLoadingToSettle } from "./viewer.js";

// These exercise the shape debug pass against the authored showcase asset, which covers
// every shape type, the 2.1 defaults and a bounding volume with a transform of its own.
// The asset is not in the repo, so the suite skips when it has not been staged.
import { existsSync } from "node:fs";

const asset = "public/local-assets/shapes_all.gltf";
test.skip(() => !existsSync(asset), `stage ${asset} to run these`);

const canvas = (page) => page.locator("#canvas");

async function openShowcase(page) {
    const errors = collectConsoleErrors(page);
    await page.goto("/?model=local-assets/shapes_all.gltf");
    await waitForLoadingToSettle(page);
    await page.getByRole("tab", { name: "Display" }).click();
    return errors;
}

// Counts pixels that differ from the shape-free rendering, which is how much the debug
// pass actually drew. Screenshots of individual shapes would be baseline churn.
async function drawnPixels(page) {
    return (await canvas(page).screenshot()).byteLength;
}

test("bounding volumes are hidden until asked for", async ({ page }) => {
    const errors = await openShowcase(page);

    await expect(page.getByTestId("switch-bounding-volumes")).not.toBeChecked();
    await expect(page.getByTestId("select-shape-style")).toBeDisabled();

    expectNoConsoleErrors(errors);
});

test("toggling bounding volumes changes the image", async ({ page }) => {
    const errors = await openShowcase(page);
    const before = await canvas(page).screenshot();

    await page.getByTestId("switch-bounding-volumes").click();
    await waitForLoadingToSettle(page);
    const after = await canvas(page).screenshot();

    expect(after).not.toEqual(before);
    expectNoConsoleErrors(errors);
});

test("turning them off again restores the original image", async ({ page }) => {
    const errors = await openShowcase(page);
    const before = await canvas(page).screenshot();

    await page.getByTestId("switch-bounding-volumes").click();
    await waitForLoadingToSettle(page);
    await page.getByTestId("switch-bounding-volumes").click();
    await waitForLoadingToSettle(page);

    // The debug pass must leave no trace in the framebuffer or in the GL state.
    expect(await canvas(page).screenshot()).toEqual(before);
    expectNoConsoleErrors(errors);
});

test("every style and color mode draws something different", async ({ page }) => {
    const errors = await openShowcase(page);
    await page.getByTestId("switch-bounding-volumes").click();
    await waitForLoadingToSettle(page);

    const images = new Map();
    for (const style of ["Wireframe", "Translucent", "Both"]) {
        await page.getByTestId("select-shape-style").selectOption(style);
        await waitForLoadingToSettle(page);
        images.set(style, (await canvas(page).screenshot()).toString("base64"));
    }

    expect(new Set(images.values()).size).toBe(3);
    expectNoConsoleErrors(errors);
});

test("x-ray mode reveals volumes hidden inside geometry", async ({ page }) => {
    const errors = await openShowcase(page);
    await page.getByTestId("switch-bounding-volumes").click();
    await waitForLoadingToSettle(page);
    const occluded = await canvas(page).screenshot();

    await page.getByTestId("switch-shapes-xray").click();
    await waitForLoadingToSettle(page);

    // The showcase puts bounding volumes around Suzanne, so disabling the depth test has
    // to bring more of them through.
    expect(await canvas(page).screenshot()).not.toEqual(occluded);
    expectNoConsoleErrors(errors);
});

test("coloring by shape type differs from the uniform color", async ({ page }) => {
    const errors = await openShowcase(page);
    await page.getByTestId("switch-bounding-volumes").click();
    await waitForLoadingToSettle(page);
    const uniform = await canvas(page).screenshot();

    await page.getByTestId("select-shape-color").selectOption("Shape Type");
    await waitForLoadingToSettle(page);

    expect(await canvas(page).screenshot()).not.toEqual(uniform);
    expect(await drawnPixels(page)).toBeGreaterThan(0);
    expectNoConsoleErrors(errors);
});
