import { gltfInput } from './input.js';

import { GltfView, computePrimitiveCentroids, loadGltfFromPath, loadPrefilteredEnvironmentFromPath, initKtxLib, initDracoLib, loadGltfFromDrop } from 'gltf-sample-viewer';

async function main()
{
    const canvas = document.getElementById("canvas");
    const view = new GltfView(canvas);
    const state = view.createState();
    initDracoLib();
    initKtxLib(view);

    loadGltfFromPath("assets/models/2.0/Avocado/glTF/Avocado.gltf", view).then( (gltf) => {
        state.gltf = gltf;
        const scene = state.gltf.scenes[state.sceneIndex];
        scene.applyTransformHierarchy(state.gltf);
        computePrimitiveCentroids(state.gltf);
        state.userCamera.fitViewToScene(state.gltf, state.sceneIndex);
        state.userCamera.updatePosition();
        state.animationIndices = [0];
        state.animationTimer.start();
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
    input.onDropFiles = (mainFile, additionalFiles) => {
        loadGltfFromDrop(mainFile, additionalFiles, view).then( gltf => {
            state.gltf = gltf;
            computePrimitiveCentroids(state.gltf);
            state.userCamera.fitViewToScene(state.gltf, state.sceneIndex);
            state.userCamera.updatePosition();
            state.animationIndices = [0];
            state.animationTimer.start();
        });
    };

    await view.startRendering(state);
}

export { main };
