import { expect, test } from "@playwright/test";
import {
    collectConsoleErrors,
    dropFiles,
    expectNoConsoleErrors,
    openTab,
    ui,
    waitForLoadingToSettle
} from "./viewer.js";

/** A minimal glTF with one camera node so the camera dropdown appears. */
function gltfWithCamera() {
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
                perspective: { yfov: 0.7, znear: 0.01, zfar: 100 }
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

test("camera controls re-enable after switching back to the user camera", async ({ page }) => {
    const errors = collectConsoleErrors(page);

    await page.goto("/");
    await waitForLoadingToSettle(page);

    // The models tab must stay open while the dropped model loads and publishes
    // its camera.
    await openTab(page, "models");
    await dropFiles(page, [["camera-controls.gltf", gltfWithCamera()]]);
    await waitForLoadingToSettle(page);

    const cameraSelect = page.locator(ui.cameraSelect);
    await expect(cameraSelect).toBeVisible();

    const orbitButton = page.getByRole("button", { name: "Orbit", exact: true });

    // The user camera is active by default, so the controls are enabled.
    await openTab(page, "camera");
    await expect(orbitButton).toBeEnabled();

    // Selecting an asset camera disables the user-camera controls.
    await openTab(page, "models");
    await cameraSelect.selectOption("1");
    await openTab(page, "camera");
    await expect(orbitButton).toBeDisabled();

    // Switching back to the user camera re-enables them.
    await openTab(page, "models");
    await cameraSelect.selectOption("-1");
    await openTab(page, "camera");
    await expect(orbitButton).toBeEnabled();

    expectNoConsoleErrors(errors);
});
