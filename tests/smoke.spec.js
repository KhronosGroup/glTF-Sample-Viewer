import { expect, test } from "@playwright/test";
import {
    collectConsoleErrors,
    expectNoConsoleErrors,
    ui,
    waitForLoadingToSettle
} from "./viewer.js";

test("boots the full UI without errors", async ({ page }) => {
    const errors = collectConsoleErrors(page);

    await page.goto("/");
    await waitForLoadingToSettle(page);

    await expect(page.locator(ui.canvas)).toBeVisible();
    await expect(page.locator(ui.tabs)).toBeVisible();
    expectNoConsoleErrors(errors);
});
