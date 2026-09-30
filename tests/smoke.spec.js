import { expect, test } from "@playwright/test";
import {
    collectConsoleErrors,
    expectCanvasToRender,
    expectNoConsoleErrors,
    ui,
    waitForLoadingToSettle
} from "./viewer.js";

test("renders the default model", async ({ page }) => {
    const errors = collectConsoleErrors(page);

    // noUI keeps the canvas layout independent of the side panel, so the
    // baseline survives the UI rewrite.
    await page.goto("/?noUI=1");
    await waitForLoadingToSettle(page);

    await expectCanvasToRender(page, "default-model.png");
    expectNoConsoleErrors(errors);
});

test("boots the full UI without errors", async ({ page }) => {
    const errors = collectConsoleErrors(page);

    await page.goto("/");
    await waitForLoadingToSettle(page);

    await expect(page.locator(ui.canvas)).toBeVisible();
    await expect(page.locator(ui.tabs)).toBeVisible();
    expectNoConsoleErrors(errors);
});
