import { expect, test } from "@playwright/test";
import {
    collectConsoleErrors,
    expectCanvasToRender,
    expectNoConsoleErrors,
    ui,
    waitForLoadingToSettle
} from "./viewer.js";

// Camera input is the one area with no other coverage, and it is the part of
// the codebase most easily broken by a rewrite of the input plumbing.

async function dragOnCanvas(page, { from, to, button = "left", modifiers = [] }) {
    for (const key of modifiers) {
        await page.keyboard.down(key);
    }
    await page.mouse.move(from.x, from.y);
    await page.mouse.down({ button });
    // Deltas come from consecutive move events, so a single jump does nothing.
    await page.mouse.move(to.x, to.y, { steps: 12 });
    await page.mouse.up({ button });
    for (const key of modifiers) {
        await page.keyboard.up(key);
    }
    // Input is smoothed over ~330ms before it reaches the camera.
    await page.waitForTimeout(800);
}

test.beforeEach(async ({ page }) => {
    await page.goto("/?noUI=1");
    await waitForLoadingToSettle(page);
    await expect(page.locator(ui.canvas)).toBeVisible();
});

test("dragging orbits the camera", async ({ page }) => {
    const errors = collectConsoleErrors(page);

    await dragOnCanvas(page, { from: { x: 400, y: 360 }, to: { x: 620, y: 360 } });

    await expectCanvasToRender(page, "camera-orbited.png");
    expectNoConsoleErrors(errors);
});

test("shift dragging pans the camera", async ({ page }) => {
    const errors = collectConsoleErrors(page);

    await dragOnCanvas(page, {
        from: { x: 400, y: 360 },
        to: { x: 560, y: 300 },
        modifiers: ["Shift"]
    });

    await expectCanvasToRender(page, "camera-panned.png");
    expectNoConsoleErrors(errors);
});

test("the wheel zooms the camera", async ({ page }) => {
    const errors = collectConsoleErrors(page);

    await page.mouse.move(400, 360);
    await page.mouse.wheel(0, 240);
    await page.waitForTimeout(800);

    await expectCanvasToRender(page, "camera-zoomed.png");
    expectNoConsoleErrors(errors);
});
