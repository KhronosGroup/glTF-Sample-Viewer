import { gltfInput } from './input.js';
import { DracoDecoder } from './draco.js';
import { KtxDecoder } from './ktx.js';
import { GltfView } from './GltfView/gltf_view.js';
import { computePrimitiveCentroids } from './gltf_utils.js';
import { loadGltfFromPath, loadGltfFromDrop, loadPrefilteredEnvironmentFromPath } from './ResourceLoader/resource_loader.js';
import { UIModel } from './logic/uimodel.js';
import { app } from './ui/ui.js';

async function main()
{
    const canvas = document.getElementById("canvas");
    const view = new GltfView(canvas);
    const state = view.createState();

    const dracoDecoder = new DracoDecoder();
    const ktxDecoder = new KtxDecoder();
    await dracoDecoder.ready();
    await ktxDecoder.init(view.context);

    loadGltfFromPath("assets/models/2.0/AlphaBlendModeTest/glTF/AlphaBlendModeTest.gltf", view, ktxDecoder, dracoDecoder).then( (gltf) => {
        state.gltf = gltf;
        const scene = state.gltf.scenes[state.sceneIndex];
        scene.applyTransformHierarchy(state.gltf);
        computePrimitiveCentroids(state.gltf);
        state.userCamera.fitViewToScene(state.gltf, state.sceneIndex);
        state.userCamera.updatePosition();
        state.animationIndices = [0];
        state.animationTimer.start();
    });

    loadPrefilteredEnvironmentFromPath("assets/environments/footprint_court", view, ktxDecoder).then( (environment) => {
        state.environment = environment;
    });


    const uiModel = new UIModel(app);

    // test output

    const modelObserver = {
        next: x => console.log('Observer got a value: ' + x),
        error: err => console.error('Observer got an error: ' + err)
    };

    uiModel.model.subscribe(modelObserver);
    uiModel.clearColor.subscribe(modelObserver);


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
        loadGltfFromDrop(mainFile, additionalFiles, view, ktxDecoder, dracoDecoder).then( gltf => {
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
