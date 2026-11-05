import { expect, test } from "@playwright/test";
import { decode } from "fast-png";
import {
    collectConsoleErrors,
    dropFiles,
    expectNoConsoleErrors,
    openModelsTab,
    ui,
    waitForLoadingToSettle
} from "./viewer.js";

// The viewer's default background colour (#303542). Before the fix, a camera
// with an explicit aspect ratio was letterboxed with bars of this colour.
const CLEAR_COLOR = [48, 53, 66];

/**
 * A self-contained glTF with a perspective camera whose `aspectRatio` (16:9)
 * intentionally differs from the portrait viewport used by the test.
 */
function gltfWithWideAspectCamera() {
    const positions = [-1, -1, 0, 1, -1, 0, 0, 1, 0];
    const buffer = Buffer.alloc(positions.length * 4);
    positions.forEach((value, index) => buffer.writeFloatLE(value, index * 4));

    return JSON.stringify({
        asset: { version: "2.0" },
        scene: 0,
        scenes: [{ nodes: [0, 1] }],
        nodes: [
            { name: "Triangle", mesh: 0 },
            { name: "Camera", camera: 0, translation: [0, 0, 3] }
        ],
        cameras: [
            {
                type: "perspective",
                name: "Camera",
                perspective: {
                    aspectRatio: 1.7777777910232544,
                    yfov: 0.7,
                    znear: 0.01,
                    zfar: 100
                }
            }
        ],
        meshes: [{ primitives: [{ attributes: { POSITION: 0 } }] }],
        accessors: [
            {
                bufferView: 0,
                componentType: 5126,
                count: 3,
                type: "VEC3",
                min: [-1, -1, 0],
                max: [1, 1, 0]
            }
        ],
        bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: 36 }],
        buffers: [
            {
                uri: `data:application/octet-stream;base64,${buffer.toString("base64")}`,
                byteLength: 36
            }
        ]
    });
}

function clearColorFraction(png, rows) {
    const { width, data } = png;
    let clearPixels = 0;
    let totalPixels = 0;

    for (const y of rows) {
        for (let x = 0; x < width; ++x) {
            const offset = (y * width + x) * 4;
            const matches =
                Math.abs(data[offset] - CLEAR_COLOR[0]) <= 20 &&
                Math.abs(data[offset + 1] - CLEAR_COLOR[1]) <= 20 &&
                Math.abs(data[offset + 2] - CLEAR_COLOR[2]) <= 20;
            if (matches) {
                ++clearPixels;
            }
            ++totalPixels;
        }
    }

    return clearPixels / totalPixels;
}

test("a camera with an explicit aspect ratio fills the viewport", async ({ page }) => {
    const errors = collectConsoleErrors(page);

    // A portrait viewport would letterbox a 16:9 camera top and bottom if the
    // viewer preferred the camera's aspect ratio over the viewport's. The width
    // stays above the 40rem breakpoint so the desktop panel remains available.
    await page.setViewportSize({ width: 800, height: 1000 });
    await page.goto("/");
    await waitForLoadingToSettle(page);

    // Open the models tab before dropping so the panel stays open while the
    // dropped model loads and its camera is published.
    await openModelsTab(page);

    await dropFiles(page, [["aspect-ratio-camera.gltf", gltfWithWideAspectCamera()]]);
    await waitForLoadingToSettle(page);

    const cameraSelect = page.locator(ui.cameraSelect);
    await expect(cameraSelect).toBeVisible();
    await cameraSelect.selectOption("1");

    // Let the render loop repaint with the selected camera.
    await page.waitForTimeout(500);

    const screenshot = await page.locator(ui.canvas).screenshot();
    const png = decode(screenshot);

    const bandHeight = Math.floor(png.height * 0.08);
    const topRows = Array.from({ length: bandHeight }, (_, index) => index);
    const bottomRows = Array.from({ length: bandHeight }, (_, index) => png.height - 1 - index);

    // Without letterboxing the environment covers the canvas, so the bars of
    // clear colour must not be present at the top or bottom.
    expect(clearColorFraction(png, topRows)).toBeLessThan(0.25);
    expect(clearColorFraction(png, bottomRows)).toBeLessThan(0.25);

    expectNoConsoleErrors(errors);
});
