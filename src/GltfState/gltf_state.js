import { UserCamera } from '../gltf/user_camera.js';
import { ToneMaps, DebugOutput } from '../Renderer/rendering_parameters.js';

class GltfState
{
    constructor()
    {
        this.gltf = undefined;
        this.environment = undefined;
        this.renderingParameters = {
            clearColor: [58, 64, 74],
            exposure: 1.0,
            usePunctual: false,
            useIBL: true,
            toneMap: ToneMaps.LINEAR,
            debugOutput: DebugOutput.NONE,
        };
        this.userCamera = new UserCamera();
        this.sceneIndex = 0;
        this.cameraIndex = undefined;
    }
}

export { GltfState };
