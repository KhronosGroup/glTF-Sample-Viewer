import { UserCamera } from '../gltf/user_camera.js';
import { ToneMaps, DebugOutput } from '../Renderer/rendering_parameters.js';
import { AnimationTimer } from '../gltf/utils.js';

/**
 * GltfState containing a state for visualization in GltfView
 */
class GltfState
{
    /**
     * GltfState represents all state that can be visualized in a view. You could have
     * multiple GltfStates configured and switch between them on demand.
     * @param {*} view GltfView to which this state belongs
     */
    constructor(view)
    {
        this.gltf = undefined;
        this.environment = undefined;
        this.renderingParameters = {
            morphing: true,
            skinning: true,
            clearcoat: true,
            sheen: true,
            transmission: true,
            clearColor: [58, 64, 74, 255],
            exposure: 1.0,
            usePunctual: true,
            useIBL: true,
            renderEnvironmentMap: true,
            blurEnvironmentMap: true,
            toneMap: ToneMaps.LINEAR,
            debugOutput: DebugOutput.NONE,
            /**
             * By default the front face of the environment is +Z (90)
             * Front faces:
             * +X = 0 
             * +Z = 90 
             * -X = 180 
             * -Z = 270
             */
            environmentRotation: 90.0
        };
        this.userCamera = new UserCamera();
        this.sceneIndex = 0;
        this.cameraIndex = undefined;
        this.animationIndices = [];
        this.animationTimer = new AnimationTimer();
        this.variant = undefined;

        // retain a reference to the view with which the state was created, so that it can be validated
        this._view = view;
    }
}

/**
 * Enum for tone maps
 */
GltfState.ToneMaps = ToneMaps;

/**
 * Enum for debug output channels
 */
GltfState.DebugOutput = DebugOutput;

export { GltfState };
