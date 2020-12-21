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
