import { expect, test } from "@playwright/test";
import {
    collectConsoleErrors,
    expectCanvasToRender,
    expectNoConsoleErrors,
    openModelsTab,
    ui,
    waitForLoadingToSettle
} from "./viewer.js";

// The React UI is opt-in via ?react until it reaches parity with the Vue one.
// These run the same assertions against it so the two stay comparable.
test.describe("react ui", () => {
    test("renders the default model", async ({ page }) => {
        const errors = collectConsoleErrors(page);

        await page.goto("/?react=1&noUI=1");
        await waitForLoadingToSettle(page);

        await expectCanvasToRender(page, "default-model.png");
        expectNoConsoleErrors(errors);
    });

    test("loads a model chosen from the dropdown", async ({ page }) => {
        const errors = collectConsoleErrors(page);

        await page.goto("/?react=1");
        await waitForLoadingToSettle(page);
        await openModelsTab(page);

        await page.locator(ui.modelSelect).selectOption("Avocado");
        await waitForLoadingToSettle(page);

        await expect(page.locator(ui.modelSelect)).toHaveValue("Avocado");
        await expectCanvasToRender(page, "avocado.png");
        expectNoConsoleErrors(errors);
    });
});
