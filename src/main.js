import { gltfViewer } from './viewer.js';
import { gltfInput } from './input.js';
import { WebGl } from './webgl.js';
import { DracoDecoder } from './draco.js';
import {} from './logic/logic.js';

// entry.js
import './ui/sass.scss';

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

export { gltfSampleViewer };
