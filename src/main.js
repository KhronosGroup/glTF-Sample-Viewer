import { gltfViewer } from './viewer.js';
import { gltfInput } from './input.js';
import { WebGl } from './webgl.js';
import { DracoDecoder } from './draco.js';
import { GltfView } from './GltfView/gltf_view.js';
import { computePrimitiveCentroids } from './gltf_utils.js';
import { loadGltfFromPath, loadGltfFromDrop, loadPrefilteredEnvironmentFromPath } from './ResourceLoader/resource_loader.js';

async function gltfSampleViewer(
    canvasId,
    index,
    envMap = "Courtyard of the Doge's palace",
    onRendererReady = undefined,
    basePath = "",
    initialModel = "BoomBox")
{
    const canvas = document.getElementById(canvasId);
    if (!canvas)
    {
        console.warn("Failed to retrieve the WebGL canvas!");
        return null;
    }

    WebGl.context = getWebGlContext(canvas);
    if (!WebGl.context)
    {
        console.warn("Failed to get an WebGL rendering context!");
        return null;
    }

    const input = new gltfInput(canvas);
    input.setupGlobalInputBindings(document);
    input.setupCanvasInputBindings(canvas);

    const dracoDecoder = new DracoDecoder();
    await dracoDecoder.ready();

    new gltfViewer(canvas, index, input, onRendererReady, basePath, initialModel, envMap, dracoDecoder);
}

function getWebGlContext(canvas)
{
    const parameters = { alpha: false, antialias: true };
    const contextTypes = [ "webgl2" ];

    let context;

    for (const contextType of contextTypes)
    {
        context = canvas.getContext(contextType, parameters);
        if (context)
        {
            return context;
        }
    }
    return context;
}

async function main()
{
    const canvas = document.getElementById("canvas");
    const view = new GltfView(canvas);
    const state = view.createState();

    state.gltf = await loadGltfFromPath("assets/models/2.0/Avocado/glTF/Avocado.gltf", view);
    computePrimitiveCentroids(state.gltf);
    state.environment = await loadPrefilteredEnvironmentFromPath("assets/environments/footprint_court", state.gltf, view);

    state.userCamera.fitViewToScene(state.gltf, state.sceneIndex);
    state.userCamera.updatePosition();

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

    // inject environment into gltf
    state.gltf.samplers.push(...state.environment.samplers);
    state.gltf.images.push(...state.environment.images);
    state.gltf.textures.push(...state.environment.textures);

    await view.startRendering(state);
}

export { gltfSampleViewer, main };
