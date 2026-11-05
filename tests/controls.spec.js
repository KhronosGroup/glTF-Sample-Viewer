import { expect, test } from "@playwright/test";
import {
    collectConsoleErrors,
    expectNoConsoleErrors,
    expectSelectedModel,
    openModelsTab,
    openTab,
    selectModel,
    ui,
    waitForLoadingToSettle
} from "./viewer.js";

test("a sample asset can be selected by name in the URL", async ({ page }) => {
    const errors = collectConsoleErrors(page);

    await page.goto("/?model=Avocado");
    await waitForLoadingToSettle(page);
    await openModelsTab(page);

    await expectSelectedModel(page, "Avocado");
    expectNoConsoleErrors(errors);
});

test("selecting a sample asset is reflected in the URL", async ({ page }) => {
    const errors = collectConsoleErrors(page);

    await page.goto("/");
    await waitForLoadingToSettle(page);
    await openModelsTab(page);

    await selectModel(page, "BoomBox");
    await waitForLoadingToSettle(page);
    await expect(page).toHaveURL(/model=BoomBox/);

    await page.reload();
    await waitForLoadingToSettle(page);
    await openModelsTab(page);
    await expectSelectedModel(page, "BoomBox");
    expectNoConsoleErrors(errors);
});

test("scene and camera selects are hidden when there is no choice", async ({ page }) => {
    const errors = collectConsoleErrors(page);

    await page.goto("/");
    await waitForLoadingToSettle(page);
    await openModelsTab(page);

    await expect(page.getByText("Scenes", { exact: true })).toBeHidden();
    await expect(page.getByText("Cameras", { exact: true })).toBeHidden();
    expectNoConsoleErrors(errors);
});

test("environment orientation is a segmented control", async ({ page }) => {
    const errors = collectConsoleErrors(page);

    await page.goto("/");
    await waitForLoadingToSettle(page);
    await openTab(page, "display");

    const plusZ = page.getByRole("button", { name: "+Z", exact: true });
    const minusX = page.getByRole("button", { name: "-X", exact: true });

    await expect(plusZ).toHaveAttribute("aria-pressed", "true");
    await minusX.click();
    await expect(minusX).toHaveAttribute("aria-pressed", "true");
    await expect(plusZ).toHaveAttribute("aria-pressed", "false");
    expectNoConsoleErrors(errors);
});

test("extensions show canonical names with literal tooltips", async ({ page }) => {
    const errors = collectConsoleErrors(page);

    await page.goto("/");
    await waitForLoadingToSettle(page);
    await openTab(page, "advanced");

    await expect(page.locator("label[title='KHR_interactivity']")).toHaveText("Interactivity");
    await expect(page.locator("label[title='KHR_materials_clearcoat']")).toHaveText("Clearcoat");
    expectNoConsoleErrors(errors);
});

test("the model picker filters, fuzzily matches and highlights", async ({ page }) => {
    const errors = collectConsoleErrors(page);

    await page.goto("/");
    await waitForLoadingToSettle(page);
    await openModelsTab(page);

    await page.locator(ui.modelSelect).click();
    const filter = page.getByLabel("Filter models");

    await filter.fill("avoc");
    await expect(page.getByRole("option", { name: "Avocado", exact: true })).toBeVisible();
    await expect(page.getByRole("option", { name: "DamagedHelmet", exact: true })).toHaveCount(0);
    await expect(page.getByRole("option", { name: "Avocado" }).locator("mark")).toHaveText("Avoc");

    // A single typo still matches.
    await filter.fill("avacado");
    await expect(page.getByRole("option", { name: "Avocado", exact: true })).toBeVisible();
    expectNoConsoleErrors(errors);
});

test("capture canvas offers a PNG download", async ({ page }) => {
    const errors = collectConsoleErrors(page);

    await page.goto("/");
    await waitForLoadingToSettle(page);
    await openTab(page, "display");

    await expect(page.getByRole("button", { name: "Download as PNG" })).toBeVisible();
    expectNoConsoleErrors(errors);
});

test("time override is indeterminate until set and clears on switch off", async ({ page }) => {
    const errors = collectConsoleErrors(page);

    await page.goto("/");
    await waitForLoadingToSettle(page);
    await openModelsTab(page);
    await selectModel(page, "BoxAnimated");
    await waitForLoadingToSettle(page);
    await openTab(page, "animations");

    const overrideSwitch = page.getByRole("checkbox", { name: "Time Override" });
    await overrideSwitch.click({ force: true });

    const slider = page.getByRole("slider", { name: "Time Override" });
    await expect(slider).toHaveAttribute("aria-valuetext", "Not set");

    const input = page.getByRole("spinbutton", { name: "Time Override" });
    await input.fill("1.5");
    await expect(slider).toHaveAttribute("aria-valuenow", "1.5");

    await overrideSwitch.click({ force: true });
    await expect(slider).toHaveCount(0);
    expectNoConsoleErrors(errors);
});
