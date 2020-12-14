import { GltfState } from '../GltfState/gltf_state.js';
import { gltfRenderer } from '../Renderer/renderer';

class GltfView
{
    constructor(canvas)
    {
        this.canvas = canvas;
        this.context = this.canvas.getContext("webgl2", { alpha: false, antialias: true });
        this.renderer = new gltfRenderer(this.context);
    }

    createState()
    {
        return new GltfState();
    }

    renderFrameToCanvas(state)
    {
        this.renderer.clearFrame(state.renderingParameters.clearColor);

        // TODO: this should probably not be done here
        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;

        this.renderer.resize(this.canvas.width, this.canvas.height);

        if(state.gltf === undefined)
        {
            return;
        }

        const scene = state.gltf.scenes[state.sceneIndex];

        // Draw all opaque and masked primitives. Depth sort is not yet required.
        this.renderer.drawScene(state, scene, false, primitive => state.gltf .materials[primitive.material].alphaMode !== "BLEND");

        // Draw all transparent primitives. Depth sort is required.
        this.renderer.drawScene(state, scene, true, primitive => state.gltf .materials[primitive.material].alphaMode === "BLEND");
    }

    async startRendering(state)
    {
        const renderFrame = () =>
        {
            this.renderFrameToCanvas(state);
            window.requestAnimationFrame(renderFrame);
        };

        // After this start executing render loop.
        window.requestAnimationFrame(renderFrame);
    }
}

export { GltfView };
