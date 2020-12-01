import { GltfState } from '../GltfState/gltf_state.js';
import { loadGltfFromPath, loadGltfFromDrop, loadPrefilteredEnvironmentFromPath } from '../ResourceLoader/resource_loader.js';
import { gltfRenderer } from '../renderer';
import { gltfWebGl } from '../webgl';

class GltfView
{
    constructor(canvas)
    {
        this.canvas = canvas;
        this.context = this.canvas.getContext("webgl2", { alpha: false, antialias: true });
        this.webGl = new gltfWebGl();
        this.webGl.context = this.context;
        this.renderer = new gltfRenderer(canvas, {}, "", this.webGl);
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
            this.renderFrameToCanvas(state);
            window.requestAnimationFrame(renderFrame);
        }

        // After this start executing render loop.
        window.requestAnimationFrame(renderFrame);
    }
}

export { GltfView };
