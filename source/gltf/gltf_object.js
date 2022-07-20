import { initGlForMembers, fromKeys } from "./utils";

// base class for all gltf objects
class GltfObject
{
    constructor()
    {
        this.extensions = undefined;
        this.extras = undefined;
    }

    fromJson(json, ignore = [])
    {
        fromKeys(this, json, ignore);
    }

    initGl(gltf, webGlContext)
    {
        initGlForMembers(this, gltf, webGlContext);
    }
}

export { GltfObject };
