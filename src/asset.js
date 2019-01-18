import { fromKeys } from "./utils";

class gltfAsset
{
    constructor()
    {
        this.copyright = undefined;
        this.generator = undefined;
        this.version = undefined;
        this.minVersion = undefined;
    }

    fromJson(jsonAsset)
    {
        fromKeys(this, jsonAsset);
    }
}

export { gltfAsset };
