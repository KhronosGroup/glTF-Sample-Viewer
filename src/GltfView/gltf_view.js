import { GltfState } from '../GltfState/gltf_state.js';
import { loadGltfFromPath, loadGltfFromDrop, loadPrefilteredEnvironmentFromPath } from '../ResourceLoader/resource_loader.js';

class GltfView
{
    constructor(canvas)
    {
        this.canvas = canvas;
        this.context = this.canvas.getContext("webgl2", { alpha: false, antialias: true });
    }

    createState()
    {
        return new GltfState();
    }

    async renderFrameToCanvas(state)
    {

    }

    async startRendering(state)
    {
        function renderFrame()
        {
            window.requestAnimationFrame(renderFrame);
        }

        // After this start executing render loop.
        window.requestAnimationFrame(renderFrame);
    }
}

export { GltfView };
