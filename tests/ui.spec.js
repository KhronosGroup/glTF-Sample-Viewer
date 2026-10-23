import { expect, test } from "@playwright/test";
import {
    collectConsoleErrors,
    expectCanvasToRender,
    expectNoConsoleErrors,
    expectSelectedModel,
    openPanel,
    openTab,
    selectModel,
    ui,
    waitForLoadingToSettle
} from "./viewer.js";

// Canvas baselines pin what reaches the renderer, so these catch a UI change
// that quietly alters the render rather than the markup.

test("renders the default model", async ({ page }) => {
    const errors = collectConsoleErrors(page);

    // noUI keeps the canvas layout independent of the side panel.
    await page.goto("/?noUI=1");
    await waitForLoadingToSettle(page);

    await expectCanvasToRender(page, "default-model.png");
    expectNoConsoleErrors(errors);
});

test("loads a model chosen from the dropdown", async ({ page }) => {
    const errors = collectConsoleErrors(page);

    await page.goto("/");
    await waitForLoadingToSettle(page);
    await openTab(page, "models");

    await selectModel(page, "Avocado");
    await waitForLoadingToSettle(page);

    await expectSelectedModel(page, "Avocado");
    await expectCanvasToRender(page, "avocado.png");
    expectNoConsoleErrors(errors);
});

test("turning off image based lighting changes the render", async ({ page }) => {
    const errors = collectConsoleErrors(page);

    await page.goto("/");
    await waitForLoadingToSettle(page);
    await openTab(page, "display");

    await page.getByTestId("switch-ibl").click();

    await expectCanvasToRender(page, "no-ibl.png");
    expectNoConsoleErrors(errors);
});

test("credits and validator reflect the loaded model", async ({ page }) => {
    const errors = collectConsoleErrors(page);

    await page.goto("/");
    await waitForLoadingToSettle(page);

    await openTab(page, "credits");
    await expect(page.getByTestId("asset-copyright")).not.toBeEmpty();
    await expect(page.getByTestId("asset-generator")).not.toBeEmpty();
    await expect(page.getByTestId("environment-license")).not.toHaveText("N/A");

    await openTab(page, "validator");
    const validator = openPanel(page);
    const count = (label) =>
        validator.locator("dl > div").filter({ has: page.getByText(label, { exact: true }) });
    await expect(count("Errors").locator("dd")).toHaveText(/^\d+$/);
    await expect(count("Warnings").locator("dd")).toHaveText(/^\d+$/);

    expectNoConsoleErrors(errors);
});

test("an animated model lists its animations and plays them", async ({ page }) => {
    const errors = collectConsoleErrors(page);

    await page.goto("/");
    await waitForLoadingToSettle(page);
    await openTab(page, "models");
    await selectModel(page, "BoxAnimated");
    await waitForLoadingToSettle(page);

    await openTab(page, "animations");

    // Animations start playing, so the toggle offers to pause.
    await expect(page.getByRole("button", { name: "Pause" })).toBeVisible();
    await expect(page.getByRole("checkbox").first()).toBeChecked();

    expectNoConsoleErrors(errors);
});

test("the advanced panel shows statistics and extension toggles", async ({ page }) => {
    const errors = collectConsoleErrors(page);

    await page.goto("/");
    await waitForLoadingToSettle(page);
    await openTab(page, "advanced");

    const panel = openPanel(page);
    await expect(panel.getByText("Meshes", { exact: true })).toBeVisible();
    await expect(panel.getByText("Triangles", { exact: true })).toBeVisible();
    await expect(panel.getByText("Clearcoat", { exact: true })).toBeVisible();
    await expect(panel.getByText("Gaussian Splatting", { exact: true })).toBeVisible();

    expectNoConsoleErrors(errors);
});

// The menu's switches mirror state the renderer already holds, so losing them
// on hide leaves the UI claiming a default the render does not reflect.
test("hiding the menu does not reset it", async ({ page }) => {
    const errors = collectConsoleErrors(page);

    await page.goto("/");
    await waitForLoadingToSettle(page);
    await openTab(page, "credits");

    await page.getByRole("button", { name: "Hide the controls" }).click();
    await expect(page.locator(ui.menu)).toBeHidden();

    await page.getByRole("button", { name: "Show the controls" }).click();
    await expect(page.locator(ui.tab("credits"))).toHaveAttribute("aria-selected", "true");

    expectNoConsoleErrors(errors);
});
