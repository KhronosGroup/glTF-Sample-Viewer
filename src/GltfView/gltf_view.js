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
        this.animateNode(state);
        scene.applyTransformHierarchy(state.gltf);

        // Draw all opaque and masked primitives. Depth sort is not yet required.
        this.renderer.drawScene(state, scene);
    }

    // TODO: remove
    animateNode(state)
    {
        if(state.gltf.animations !== undefined && state.animationIndex !== undefined && !state.animationTimer.paused)
        {
            const t = this.renderingParameters.animationTimer.elapsedSec();

            if(this.renderingParameters.animationIndex === "all")
            {
                // Special index, step all animations.
                for(const anim of state.gltf.animations)
                {
                    if(anim)
                    {
                        anim.advance(state.gltf, t);
                    }
                }
            }
            else
            {
                // Step selected animation.
                const anim = state.gltf.animations[this.renderingParameters.animationIndex];
                if(anim)
                {
                    anim.advance(state.gltf, t);
                }
            }
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
