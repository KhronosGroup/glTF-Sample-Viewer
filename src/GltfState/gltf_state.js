import { UserCamera } from '../gltf/user_camera.js';
import { ToneMaps, DebugOutput } from '../Renderer/rendering_parameters.js';
import { AnimationTimer } from '../gltf/utils.js';

class GltfState
{
    constructor()
    {
        this.gltf = undefined;
        this.environment = undefined;
        this.renderingParameters = {
            morphing: true,
            skinning: true,
            clearColor: [58, 64, 74],
            exposure: 1.0,
            usePunctual: false,
            useIBL: true,
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
    }
}

export { GltfState };
