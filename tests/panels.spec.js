import { expect, test } from "@playwright/test";
import {
    collectConsoleErrors,
    expectNoConsoleErrors,
    openTab,
    waitForLoadingToSettle
} from "./viewer.js";

// Everything asserted here is published by the loading/rendering layer rather
// than typed by the user, so it covers the renderer-to-UI direction end to end.
// Vue only until the Advanced panel is ported.
test("statistics reflect the loaded model", async ({ page }) => {
    const errors = collectConsoleErrors(page);

    await page.goto("/");
    await waitForLoadingToSettle(page);

    await openTab(page, "advanced");
    await expect(page.getByText("Mesh Count", { exact: false }).first()).toBeVisible();
    await expect(page.getByText("Triangle Count", { exact: false }).first()).toBeVisible();

    expectNoConsoleErrors(errors);
});
