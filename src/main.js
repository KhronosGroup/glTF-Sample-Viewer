import { gltfViewer } from './viewer.js';
import { gltfInput } from './input.js';

function gltf_rv(canvasId, index,
    headless = false,
    onRendererReady = undefined,
    basePath = "",
    initialModel = "BoomBox",
    envMap = "papermill")
{
    // TODO: Avoid depending on global variables.
    const canvas = window.canvas = document.getElementById(canvasId);
    if (!canvas)
    {
        console.warn("Failed to retrieve the WebGL canvas!");
        return null;
    }

    // TODO: Avoid depending on global variables.
    const gl = window.gl = getWebGlContext();
    if (!gl)
    {
        console.warn("Failed to get an WebGL rendering context!");
        return null;
    }

    const input = new gltfInput(canvas);
    setupGlobalInputBindings(input, document);
    setupCanvasInputBindings(input, canvas);

    const viewer = new gltfViewer(canvas, index, input, headless, onRendererReady, basePath, initialModel, envMap);

    return viewer; // Succeeded in creating a glTF viewer!
}

function getWebGlContext()
{
    const parameters = { alpha: false, antialias: true };
    const contextTypes = [ "webgl", "experimental-webgl" ];

    let context;

    for (const contextType of contextTypes)
    {
        context = canvas.getContext(contextType, parameters);
        if (context)
        {
            return context;
        }
    }
}

function setupGlobalInputBindings(input, document)
{
    document.onmouseup = input.mouseUpHandler.bind(input);
    document.onmousemove = input.mouseMoveHandler.bind(input);
}

function setupCanvasInputBindings(input, canvas)
{
    canvas.onmousedown = input.mouseDownHandler.bind(input);
    canvas.onwheel = input.mouseWheelHandler.bind(input);
    canvas.ondrop = input.dropEventHandler.bind(input);
    canvas.ondragover = input.dragOverHandler.bind(input);
}

export { gltf_rv };
