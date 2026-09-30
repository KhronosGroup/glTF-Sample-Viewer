import { expect, test } from "@playwright/test";
import { collectConsoleErrors, openTab, waitForLoadingToSettle } from "./viewer.js";

// Everything asserted here is published by the loading/rendering layer rather
// than typed by the user, so it covers the renderer-to-UI direction end to end.
test("panels reflect the loaded model", async ({ page }) => {
    const errors = collectConsoleErrors(page);

    await page.goto("/");
    await waitForLoadingToSettle(page);

    await openTab(page, "credits");
    await expect(page.getByTestId("asset-copyright")).not.toBeEmpty();
    await expect(page.getByTestId("asset-generator")).not.toBeEmpty();
    await expect(page.getByTestId("environment-license")).not.toBeEmpty();

    await openTab(page, "advanced");
    await expect(page.getByText("Mesh Count", { exact: false }).first()).toBeVisible();
    await expect(page.getByText("Triangle Count", { exact: false }).first()).toBeVisible();

    await openTab(page, "validator");
    await expect(page.getByText(/Number of errors: \d+/)).toBeVisible();
    await expect(page.getByText(/Number of warnings: \d+/)).toBeVisible();

    expect(errors).toEqual([]);
});
