import { UserCamera } from '../user_camera.js';
import { ToneMaps, DebugOutput, Environments } from '../rendering_parameters.js';

class GltfState
{
    constructor()
    {
        this.gltf = undefined;
        this.environment = undefined;
        this.renderingParameters = {
            clearColor: [58, 64, 74],
            usePunctual: false,
            useIBL: false,
            toneMap: ToneMaps.LINEAR,
            debugOutput: DebugOutput.NONE,
        };
        this.userCamera = new UserCamera();
        this.sceneIndex = 0;
        this.cameraIndex = undefined;
    }
}

export { GltfState };
