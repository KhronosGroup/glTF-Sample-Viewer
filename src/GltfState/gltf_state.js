import { UserCamera } from '../user_camera.js';


class GltfState
{
    constructor()
    {
        this.gltf = undefined;
        this.environment = undefined;
        this.renderingParameters = {};
        this.userCamera = new UserCamera();
    }
}

export { GltfState };
