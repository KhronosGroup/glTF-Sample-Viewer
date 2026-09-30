import { expect, test } from "@playwright/test";
import {
    collectConsoleErrors,
    expectCanvasToRender,
    openModelsTab,
    ui,
    waitForLoadingToSettle
} from "./viewer.js";

test("loads a model chosen from the dropdown", async ({ page }) => {
    const errors = collectConsoleErrors(page);

    await page.goto("/");
    await waitForLoadingToSettle(page);
    await openModelsTab(page);

    await page.locator(ui.modelSelect).selectOption("Avocado");
    await waitForLoadingToSettle(page);

    await expectCanvasToRender(page, "avocado.png");
    expect(errors).toEqual([]);
});

// Guards the load-orchestration fix: a slow model selected first must not
// overwrite a fast model selected second.
test("a superseded model load does not overwrite the current one", async ({ page }) => {
    // Currently broken: `mergeMap` runs both loads to completion, so the
    // superseded BoomBox load corrupts the Avocado materials. Phase 0 removes
    // this annotation.
    test.fail();

    const errors = collectConsoleErrors(page);

    await page.goto("/");
    await waitForLoadingToSettle(page);
    await openModelsTab(page);

    const modelSelect = page.locator(ui.modelSelect);
    await modelSelect.selectOption("BoomBox");
    await modelSelect.selectOption("Avocado");

    // BoomBox is much larger than Avocado, so without cancellation it finishes
    // last and wins. Draining the network makes that outcome observable.
    await waitForLoadingToSettle(page);
    await page.waitForLoadState("networkidle");

    await expect(modelSelect).toHaveValue("Avocado");
    await expectCanvasToRender(page, "avocado.png");
    expect(errors).toEqual([]);
});
