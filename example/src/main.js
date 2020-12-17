import { gltfInput } from './input.js';

import { GltfView, computePrimitiveCentroids, loadGltfFromPath, loadPrefilteredEnvironmentFromPath } from 'gltf-sample-viewer';


async function main()
{
    const canvas = document.getElementById("canvas");
    const view = new GltfView(canvas);
    const state = view.createState();

    loadGltfFromPath("assets/models/2.0/Avocado/glTF/Avocado.gltf", view).then( (gltf) => {
        state.gltf = gltf;
        computePrimitiveCentroids(state.gltf);
        state.userCamera.fitViewToScene(state.gltf, state.sceneIndex);
        state.userCamera.updatePosition();
    });

    loadPrefilteredEnvironmentFromPath("assets/environments/footprint_court", view).then( (environment) => {
        state.environment = environment;
    });

    const input = new gltfInput(canvas);
    input.setupGlobalInputBindings(document);
    input.setupCanvasInputBindings(canvas);
    input.onRotate = (deltaX, deltaY) =>
    {
        state.userCamera.rotate(deltaX, deltaY);
        state.userCamera.updatePosition();
    };
    input.onPan = (deltaX, deltaY) =>
    {
        state.userCamera.pan(deltaX, deltaY);
        state.userCamera.updatePosition();
    };
    input.onZoom = (delta) =>
    {
        state.userCamera.zoomIn(delta);
        state.userCamera.updatePosition();
    };

    await view.startRendering(state);
}

export { main };
