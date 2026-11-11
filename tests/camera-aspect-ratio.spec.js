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

/**
 * A self-contained glTF with a red emissive triangle and a perspective camera
 * whose `aspectRatio` (16:9) intentionally differs from the portrait viewport
 * used by the test.
 */
function gltfWithWideAspectCamera() {
    const positions = [-1, -1, 0, 1, -1, 0, 0, 1, 0];
    const normals = [0, 0, 1, 0, 0, 1, 0, 0, 1];
    const floats = [...positions, ...normals];
    const buffer = Buffer.alloc(floats.length * 4);
    floats.forEach((value, index) => buffer.writeFloatLE(value, index * 4));

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
        meshes: [
            {
                primitives: [{ attributes: { POSITION: 0, NORMAL: 1 }, material: 0 }]
            }
        ],
        materials: [
            {
                // Emissive so the triangle stays red regardless of lighting.
                emissiveFactor: [1, 0, 0],
                pbrMetallicRoughness: {
                    baseColorFactor: [0, 0, 0, 1],
                    metallicFactor: 0,
                    roughnessFactor: 1
                }
            }
        ],
        accessors: [
            {
                bufferView: 0,
                componentType: 5126,
                count: 3,
                type: "VEC3",
                min: [-1, -1, 0],
                max: [1, 1, 0]
            },
            {
                bufferView: 1,
                componentType: 5126,
                count: 3,
                type: "VEC3"
            }
        ],
        bufferViews: [
            { buffer: 0, byteOffset: 0, byteLength: 36 },
            { buffer: 0, byteOffset: 36, byteLength: 36 }
        ],
        buffers: [
            {
                uri: `data:application/octet-stream;base64,${buffer.toString("base64")}`,
                byteLength: buffer.length
            }
        ]
    });
}

/**
 * Vertical span (in rows) that contains a red pixel. The emissive triangle is
 * the only red content, so its extent reveals whether the letterboxed content
 * is rendered at full size or squished.
 */
function redVerticalExtent(png) {
    const { width, height, data, channels } = png;
    const stride = channels ?? 4;
    let first = -1;
    let last = -1;

    for (let y = 0; y < height; ++y) {
        for (let x = 0; x < width; ++x) {
            const offset = (y * width + x) * stride;
            const r = data[offset];
            const g = data[offset + 1];
            const b = data[offset + 2];
            if (r > 120 && r > g + 40 && r > b + 40) {
                if (first === -1) {
                    first = y;
                }
                last = y;
                break;
            }
        }
    }

    return { first, last };
}

test("a camera with an explicit aspect ratio is letterboxed to preserve it", async ({ page }) => {
    const errors = collectConsoleErrors(page);

    // A portrait viewport letterboxes a 16:9 camera top and bottom. The width
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

    // The 16:9 content is vertically centered, so the red triangle is confined
    // to the letterboxed content region and spans almost its full height. The
    // top and bottom bars stay clear of red.
    const contentHeight = png.width / 1.7777777910232544;
    const contentTop = Math.floor((png.height - contentHeight) / 2);
    const contentBottom = Math.ceil((png.height + contentHeight) / 2);
    const { first, last } = redVerticalExtent(png);

    expect(first).toBeGreaterThanOrEqual(contentTop);
    expect(last).toBeLessThanOrEqual(contentBottom);
    expect(last - first).toBeGreaterThan(contentHeight * 0.7);

    expectNoConsoleErrors(errors);
});
