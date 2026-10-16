import { expect, test } from "@playwright/test";
import {
    collectConsoleErrors,
    expectCanvasToRender,
    expectNoConsoleErrors,
    waitForLoadingToSettle
} from "./viewer.js";

// The viewer holds a WebGL context, a physics engine, a render loop and a pile
// of listeners. Nothing in the app ever unmounts it, so without a deliberate
// handle the teardown would only run during a StrictMode double-invoke and
// could rot unnoticed. window.__remountViewer exists in dev builds only.
//
// This covers "a restart works": dispose ran, one instance is alive, and the
// new one renders. It does not prove nothing leaked — a surviving render loop
// draws the same pixels into the same context and stays invisible here.
test("tearing the viewer down and starting it again leaves one working instance", async ({
    page
}) => {
    const errors = collectConsoleErrors(page);

    await page.goto("/?noUI=1");
    await waitForLoadingToSettle(page);

    const before = await page.evaluate(() => window.__viewerStats);
    expect(before, "dev-only remount hook is missing").toBeDefined();
    expect(before.live).toBe(1);

    await page.evaluate(() => window.__remountViewer());
    await waitForLoadingToSettle(page);

    const after = await page.evaluate(() => window.__viewerStats);
    expect(after.starts).toBe(before.starts + 1);
    expect(after.stops).toBe(before.stops + 1);
    expect(after.live).toBe(1);

    await expect(page.locator("canvas")).toHaveCount(1);
    // A half-released context or a failed restart would not render this.
    await expectCanvasToRender(page, "default-model.png");
    expectNoConsoleErrors(errors);
});
