import { GltfState } from '../GltfState/gltf_state.js';
import { gltfRenderer } from '../Renderer/renderer.js';

class GltfView
{
    constructor(canvas, ui)
    {
        this.canvas = canvas;
        this.ui = ui;
        this.context = this.canvas.getContext("webgl2", { alpha: false, antialias: true });
        this.renderer = new gltfRenderer(this.context);
    }

    createState()
    {
        return new GltfState();
    }

    renderFrameToCanvas(state)
    {
        if(this.ui !== undefined)
        {
            this.canvas.width = window.innerWidth - this.ui.getBoundingClientRect().width;
        }
        else
        {
            this.canvas.width = this.canvas.clientWidth;
        }
        this.canvas.height = this.canvas.clientHeight;

        this.renderer.resize(this.canvas.width, this.canvas.height);

        this.renderer.clearFrame(state.renderingParameters.clearColor);

        if(state.gltf === undefined)
        {
            return;
        }

        const scene = state.gltf.scenes[state.sceneIndex];

        scene.applyTransformHierarchy(state.gltf);

        this.renderer.drawScene(state, scene);
    }

    animate(state)
    {
        if(state.gltf === undefined)
        {
            return;
        }

        if(state.gltf.animations !== undefined && state.animationIndices !== undefined && !state.animationTimer.paused)
        {
            const t = state.animationTimer.elapsedSec();

            const animations = state.animationIndices.map(index => {
                return state.gltf.animations[index];
            }).filter(animation => animation !== undefined);

            for(const animation of animations)
            {
                animation.advance(state.gltf, t);
            }
        }
    }

    // gatherStatistics collects information about the GltfState such as the number of rendererd meshes or triangles
    gatherStatistics(state)
    {
        if(state.gltf === undefined)
        {
            return;
        }

        // gather information from the active scene
        const scene = state.gltf.scenes[state.sceneIndex];
        const nodes = scene.gatherNodes(state.gltf);
        const activeMeshes = nodes.filter(node => node.mesh !== undefined).map(node => state.gltf.meshes[node.mesh]);
        const activePrimitives = activeMeshes
            .reduce((acc, mesh) => acc.concat(mesh.primitives), [])
            .filter(primitive => primitive.material !== undefined);
        const activeMaterials = [... new Set(activePrimitives.map(primitive => state.gltf.materials[primitive.material]))];
        const opaqueMaterials = activeMaterials.filter(material => material.alphaMode !== "BLEND");
        const transparentMaterials = activeMaterials.filter(material => material.alphaMode === "BLEND");
        const faceCount = activePrimitives
            .map(primitive => {
                const verticesCount = state.gltf.accessors[primitive.indices].count;
                if (verticesCount === 0)
                {
                    return 0;
                }

                // convert vertex count to point, line or triangle count
                switch (primitive.mode) {
                case WebGLRenderingContext.POINTS:
                    return verticesCount;
                case WebGLRenderingContext.LINES:
                    return verticesCount / 2;
                case WebGLRenderingContext.LINE_LOOP:
                    return verticesCount;
                case WebGLRenderingContext.LINE_STRIP:
                    return verticesCount - 1;
                case WebGLRenderingContext.TRIANGLES:
                    return verticesCount / 3;
                case WebGLRenderingContext.TRIANGLE_STRIP:
                case WebGLRenderingContext.TRIANGLE_FAN:
                    return verticesCount - 2;
                }
            })
            .reduce((acc, faceCount) => acc += faceCount);

        // assemble statistics object
        return {
            meshCount: activeMeshes.length,
            faceCount: faceCount,
            opaqueMaterialsCount: opaqueMaterials.length,
            transparentMaterialsCount: transparentMaterials.length
        };
    }

    async startRendering(state)
    {
        const update = () =>
        {
            this.animate(state);
            this.renderFrameToCanvas(state);
            window.requestAnimationFrame(update);
        };

        // After this start executing render loop.
        window.requestAnimationFrame(update);
    }
}

export { GltfView };
