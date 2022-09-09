import { initGlForMembers, initStateForMembers, fromKeys } from "./utils";

// base class for all gltf objects
class GltfObject
{
    constructor()
    {
        this.extensions = undefined;
        this.extras = undefined;
    }

    fromJson(json)
    {
        fromKeys(this, json);
    }

    initGl(gltf, webGlContext)
    {
        initGlForMembers(this, gltf, webGlContext);
    }

    initState(state)
    {
        initStateForMembers(this, state);
    }
}

export { GltfObject };
