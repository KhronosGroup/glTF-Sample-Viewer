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
        this.renderer = new gltfRenderer(canvas, this.webGl);
    }

    createState()
    {
        return new GltfState();
    }

    renderFrameToCanvas(state)
    {
        this.renderer.clearFrame(state.renderingParameters.clearColor);

        this.renderer.resize(this.canvas.clientWidth, this.canvas.clientHeight);

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
