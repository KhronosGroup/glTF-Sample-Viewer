import { expect, test } from "@playwright/test";
import {
    collectConsoleErrors,
    dropFiles,
    expectCanvasToRender,
    expectNoConsoleErrors,
    openModelsTab,
    ui,
    waitForLoadingToSettle
} from "./viewer.js";

// Guards the load-orchestration fix: a slow model selected first must not
// overwrite a fast model selected second.
test("a superseded model load does not overwrite the current one", async ({ page }) => {
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
    expectNoConsoleErrors(errors);
});

// A dropped glTF has no base URL, so a relative uri that was not dropped with it
// used to be fetched from the page origin. The dev server answers that with
// index.html and a 200, so the HTML was accepted as buffer data and the load
// "succeeded" on garbage.
test("a dropped glTF missing its buffer names the file it wants", async ({ page }) => {
    const errors = collectConsoleErrors(page);

    const gltf = JSON.stringify({
        asset: { version: "2.0" },
        scene: 0,
        scenes: [{ nodes: [0] }],
        nodes: [{ mesh: 0 }],
        meshes: [{ primitives: [{ attributes: { POSITION: 0 } }] }],
        accessors: [
            {
                bufferView: 0,
                componentType: 5126,
                count: 3,
                type: "VEC3",
                min: [0, 0, 0],
                max: [1, 1, 0]
            }
        ],
        bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: 36 }],
        buffers: [{ uri: "triangle.bin", byteLength: 36 }]
    });

    await page.goto("/?noUI=1");
    await page.waitForSelector(ui.canvas);

    await dropFiles(page, [["triangle.gltf", gltf]]);

    await expect(page.getByRole("alert")).toContainText("triangle.bin");
    await waitForLoadingToSettle(page);
    await expect(page.locator(ui.canvas)).toBeVisible();

    // The validator reports the same file, so the loader's own message is what
    // proves the fetch was refused rather than answered with index.html.
    expect(errors.join("\n")).toMatch(
        /Loading failed:.*Missing file 'triangle\.bin' referenced by 'dropped\/triangle\.gltf'/
    );
});
