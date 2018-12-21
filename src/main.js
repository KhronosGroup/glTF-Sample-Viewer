import { gltfViewer } from './viewer.js';
import { gltfInput } from './input.js';
import { WebGl } from './webgl.js';

function gltf_rv(canvasId, index,
    headless = false,
    onRendererReady = undefined,
    basePath = "",
    initialModel = "BoomBox",
    envMap = "Papermill Ruins E (LDR)")
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
    setupGlobalInputBindings(input, document);
    setupCanvasInputBindings(input, canvas);

    const viewer = new gltfViewer(canvas, index, input, headless, onRendererReady, basePath, initialModel, envMap);

    return viewer; // Succeeded in creating a glTF viewer!
}

function getWebGlContext(canvas)
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
    document.onkeydown = input.keyDownHandler.bind(input);
}

function setupCanvasInputBindings(input, canvas)
{
    canvas.onmousedown = input.mouseDownHandler.bind(input);
    canvas.onwheel = input.mouseWheelHandler.bind(input);
    canvas.ondrop = input.dropEventHandler.bind(input);
    canvas.ondragover = input.dragOverHandler.bind(input);
}

export { gltf_rv };
