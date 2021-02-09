import { GltfState } from '../GltfState/gltf_state.js';
import { gltfRenderer } from '../Renderer/renderer.js';
import { GL } from '../Renderer/webgl.js';
import { ResourceLoader } from '../ResourceLoader/resource_loader.js';

class GltfView
{
    // GltfView is always bound to a WebGL 2.0 context.
    // The context can be received from a canvas with the canvas.getContext("webgl2")
    // method.
    constructor(context)
    {
        this.context = context;
        this.renderer = new gltfRenderer(this.context);
    }

    // createState constructes a new GltfState for the GltfView. The resources referenced in
    // a gltf state can directly be stored as resources on the WebGL context of GltfView,
    // therefore GltfStates cannot not be shared between GltfViews.
    createState()
    {
        return new GltfState(this);
    }

    createResourceLoader()
    {
        return new ResourceLoader(this);
    }

    // renderFrame to the context's default framebuffer
    // Call this function in the javascript animation update
    // loop for continuous rendering to a canvas
    renderFrame(state, width, height)
    {
        this._animate(state);

        this.renderer.resize(width, height);

        this.renderer.clearFrame(state.renderingParameters.clearColor);

        if(state.gltf === undefined)
        {
            return;
        }

        const scene = state.gltf.scenes[state.sceneIndex];

        if(scene === undefined)
        {
            return;
        }

        scene.applyTransformHierarchy(state.gltf);

        this.renderer.drawScene(state, scene);
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
        if (scene === undefined)
        {
            return {
                meshCount: 0,
                faceCount: 0,
                opaqueMaterialsCount: 0,
                transparentMaterialsCount: 0};
        }
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
                let verticesCount = 0;
                if(primitive.indices !== undefined)
                {
                    verticesCount = state.gltf.accessors[primitive.indices].count;
                }
                if (verticesCount === 0)
                {
                    return 0;
                }

                // convert vertex count to point, line or triangle count
                switch (primitive.mode) {
                case GL.POINTS:
                    return verticesCount;
                case GL.LINES:
                    return verticesCount / 2;
                case GL.LINE_LOOP:
                    return verticesCount;
                case GL.LINE_STRIP:
                    return verticesCount - 1;
                case GL.TRIANGLES:
                    return verticesCount / 3;
                case GL.TRIANGLE_STRIP:
                case GL.TRIANGLE_FAN:
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

    _animate(state)
    {
        if(state.gltf === undefined)
        {
            return;
        }

        if(state.gltf.animations !== undefined && state.animationIndices !== undefined)
        {
            const disabledAnimations = state.gltf.animations.filter( (anim, index) => {
                return false === state.animationIndices.includes(index);
            });

            for(const disabledAnimation of disabledAnimations)
            {
                disabledAnimation.advance(state.gltf, undefined);
            }

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
}

export { GltfView };
