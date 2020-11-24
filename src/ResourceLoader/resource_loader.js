import { gltfAccessor } from "../accessor";
import { glTF } from '../gltf.js';
import { getIsGlb } from '../utils.js';
import { GlbParser } from '../glb_parser.js';
import { gltfLoader } from "../loader";

async function loadGltfFromPath(path)
{
    const isGlb = getIsGlb(path);

    let response = await axios.get(path, { responseType: isGlb ? "arraybuffer" : "json" });

    let json = response.data;
    let buffers = undefined;

    if (isGlb)
    {
        const glbParser = new GlbParser(response.data);
        const glb = glbParser.extractGlbData();
        json = glb.json;
        buffers = glb.buffers;
    }

    const gltf = new glTF(path);
    gltf.fromJson(json);

    await gltfLoader.load(gltf, buffers);

    return gltf;
}
