import { UserCamera } from '../gltf/user_camera.js';
import { ToneMaps, DebugOutput } from '../Renderer/rendering_parameters.js';
import { AnimationTimer } from '../gltf/utils.js';

class GltfState
{
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
            environmentBackground: false,
            environmentRotation: 90.0 //+X = 0 +Z = 90 -X = 180 -Z = 270
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

GltfState.ToneMaps = ToneMaps;
GltfState.DebugOutput = DebugOutput;

export { GltfState };
