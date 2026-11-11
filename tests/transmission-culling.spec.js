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
 * A red transmissive triangle whose centroid lies behind the camera while its
 * tip is in front of it. Before the fix, transmissive/transparent drawables
 * were skipped whenever their centroid was behind the camera, hiding geometry
 * that was still partially visible.
 */
function gltfWithCentroidBehindCamera() {
    const positions = [-20, -5, 20, 20, -5, 20, 0, 0, -20];
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
            { name: "Camera", camera: 0, translation: [0, 0, 0] }
        ],
        cameras: [
            {
                type: "perspective",
                name: "Camera",
                perspective: { yfov: 1.2, znear: 0.01, zfar: 1000 }
            }
        ],
        meshes: [
            {
                primitives: [{ attributes: { POSITION: 0, NORMAL: 1 }, material: 0 }]
            }
        ],
        materials: [
            {
                baseColorFactor: [1, 0, 0, 1],
                emissiveFactor: [1, 0, 0],
                extensions: { KHR_materials_transmission: { transmissionFactor: 0 } }
            }
        ],
        accessors: [
            {
                bufferView: 0,
                componentType: 5126,
                count: 3,
                type: "VEC3",
                min: [-20, -5, -20],
                max: [20, 0, 20]
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

/** True when any pixel is clearly red (the emissive triangle). */
function hasRedPixel(png) {
    const { width, height, data, channels } = png;
    const stride = channels ?? 4;
    for (let y = 0; y < height; ++y) {
        for (let x = 0; x < width; ++x) {
            const offset = (y * width + x) * stride;
            const r = data[offset];
            const g = data[offset + 1];
            const b = data[offset + 2];
            if (r > 120 && r > g + 40 && r > b + 40) {
                return true;
            }
        }
    }
    return false;
}

test("transmissive geometry with a centroid behind the camera still renders", async ({ page }) => {
    const errors = collectConsoleErrors(page);

    await page.goto("/");
    await waitForLoadingToSettle(page);

    await openModelsTab(page);
    await dropFiles(page, [["centroid-behind.gltf", gltfWithCentroidBehindCamera()]]);
    await waitForLoadingToSettle(page);

    const cameraSelect = page.locator(ui.cameraSelect);
    await expect(cameraSelect).toBeVisible();
    await cameraSelect.selectOption("1");

    await page.waitForTimeout(500);

    const png = decode(await page.locator(ui.canvas).screenshot());
    expect(hasRedPixel(png)).toBe(true);

    expectNoConsoleErrors(errors);
});
