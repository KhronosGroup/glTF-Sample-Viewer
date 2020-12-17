import { GltfState } from '../GltfState/gltf_state.js';
import { gltfRenderer } from '../Renderer/renderer.js';
import { KtxDecoder } from '../ResourceLoader/ktx.js';

class GltfView
{
    constructor(canvas)
    {
        this.canvas = canvas;
        this.context = this.canvas.getContext("webgl2", { alpha: false, antialias: true });
        this.renderer = new gltfRenderer(this.context);
        this.ktxDecoder = new KtxDecoder(this.context);
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
        const nodes = scene.gatherNodes(state.gltf);

        const alphaModes = nodes
            .filter(n => n.mesh !== undefined)
            .reduce((acc, n) => acc.concat(state.gltf .meshes[n.mesh].primitives), [])
            .map(p => state.gltf .materials[p.material].alphaMode);

        let hasBlendPrimitives = false;
        for(const alphaMode of alphaModes)
        {
            if(alphaMode === "BLEND")
            {
                hasBlendPrimitives = true;
                break;
            }
        }

        if(hasBlendPrimitives)
        {
            // Draw all opaque and masked primitives. Depth sort is not yet required.
            this.renderer.drawScene(state, scene, false, primitive => state.gltf .materials[primitive.material].alphaMode !== "BLEND");

            // Draw all transparent primitives. Depth sort is required.
            this.renderer.drawScene(state, scene, true, primitive => state.gltf .materials[primitive.material].alphaMode === "BLEND");
        }
        else
        {
            // Simply draw all primitives.
            this.renderer.drawScene(state, scene, false);
        }
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
