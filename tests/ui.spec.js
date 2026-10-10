import { expect, test } from "@playwright/test";
import {
    canvasPixels,
    collectConsoleErrors,
    expectCanvasToRender,
    expectNoConsoleErrors,
    openPanel,
    openTab,
    ui,
    waitForLoadingToSettle
} from "./viewer.js";

// These ran against the Vue and React UIs side by side during the migration,
// against shared canvas baselines. The baselines are unchanged, so they still
// assert that the rewrite did not alter what reaches the renderer.

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

    await page.locator(ui.modelSelect).selectOption("Avocado");
    await waitForLoadingToSettle(page);

    await expect(page.locator(ui.modelSelect)).toHaveValue("Avocado");
    await expectCanvasToRender(page, "avocado.png");
    expectNoConsoleErrors(errors);
});

test("a model switch does not leave the renderer on the dropped debug channel", async ({
    context
}) => {
    // The select recovers on its own: a native one falls back to its first option when
    // the chosen one stops being offered, and None is first. What goes stale is the
    // renderer, which keeps drawing the debug view while the panel reads None.
    const avocadoAfter = async (prepare) => {
        const page = await context.newPage();
        await prepare(page);
        await openTab(page, "models");
        await page.locator(ui.modelSelect).selectOption("Avocado");
        await waitForLoadingToSettle(page);
        const pixels = await canvasPixels(page);
        await page.close();
        return pixels;
    };

    // Avocado numbers its only set 0, so the channel chosen here stops being offered.
    const afterDebugChannel = await avocadoAfter(async (page) => {
        await page.goto("/?model=test-assets/texcoord_5_only.gltf");
        await waitForLoadingToSettle(page);
        await openTab(page, "advanced");
        await page.getByTestId("select-debug-channel").selectOption("Texture Coordinates 5");
    });

    const neverDebugged = await avocadoAfter(async (page) => {
        await page.goto("/");
        await waitForLoadingToSettle(page);
    });

    expect(afterDebugChannel).toEqual(neverDebugged);
});

test("a model switch drops a variant the next model does not define", async ({ context }) => {
    const variantRadios = (page) => page.locator("label:has(input[name='material-variant'])");

    const chooseModel = async (page, name) => {
        await openTab(page, "models");
        await page.locator(ui.modelSelect).selectOption(name);
        await waitForLoadingToSettle(page);
    };

    const shoeAfter = async (prepare) => {
        const page = await context.newPage();
        await page.goto("/");
        await waitForLoadingToSettle(page);
        await chooseModel(page, "MaterialsVariantsShoe");
        await prepare(page);
        const pixels = await canvasPixels(page);
        await page.close();
        return pixels;
    };

    // A variant is chosen, then a model defining none is loaded, then the first again.
    // The name means nothing to the model in between, so it must not survive the trip.
    const afterRoundTrip = await shoeAfter(async (page) => {
        const labels = await variantRadios(page).allTextContents();
        const chosen = labels.findLastIndex((label) => label.trim() !== "None");
        await variantRadios(page).nth(chosen).locator("input").check();

        await chooseModel(page, "Avocado");
        await chooseModel(page, "MaterialsVariantsShoe");
    });

    const freshlyLoaded = await shoeAfter(async () => {});

    expect(afterRoundTrip).toEqual(freshlyLoaded);
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
    await expect(page.getByText(/Number of errors: \d+/)).toBeVisible();
    await expect(page.getByText(/Number of warnings: \d+/)).toBeVisible();

    expectNoConsoleErrors(errors);
});

test("an animated model lists its animations and plays them", async ({ page }) => {
    const errors = collectConsoleErrors(page);

    await page.goto("/");
    await waitForLoadingToSettle(page);
    await openTab(page, "models");
    await page.locator(ui.modelSelect).selectOption("BoxAnimated");
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
    await expect(panel.getByText("Mesh Count", { exact: true })).toBeVisible();
    await expect(panel.getByText("Triangle Count", { exact: true })).toBeVisible();
    await expect(panel.getByText("Clearcoat", { exact: true })).toBeVisible();
    await expect(panel.getByText("Gaussian Splatting", { exact: true })).toBeVisible();

    expectNoConsoleErrors(errors);
});
