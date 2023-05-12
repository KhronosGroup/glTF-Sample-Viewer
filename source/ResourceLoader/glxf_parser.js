
import { GltfParser } from "./gltf_parser.js";
import { GltfMerger } from "./gltf_merger.js";
class GlxfParser
{

    static findFile(filename, files) 
    {
        for (const file of files) 
        {
            if (file.name === filename)
            {
            return file;
            }
        }
        
        return null; // File not found
    }



    static async convertGlxfToGltf(glxf, appendix)
    {
        let mergedGLTF = {}; // Initialize an empty merged GLTF object

        // Iterate over each asset in the GLXF file
        for (const asset of glxf.assets) {
            const gltfURI = asset.uri;
            console.log("loading glxf asset: "+gltfURI)
            console.log("glxf appendix: ")
            console.log(appendix)
            const assetFile = this.findFile(asset.uri, appendix)
            const gltfPackage = await GltfParser.loadGltf(assetFile, appendix); // -> { json, data, filename }
            console.log("gltfPackage: ")
            console.log(gltfPackage)
            // Merge the current GLTF with the mergedGLTF object
            mergedGLTF = GltfMerger.merge(mergedGLTF, gltfPackage.json);
        }
      

        // Return the GLTF JSON 
        return { json: mergedGLTF, data:appendix };
    }

}

export { GlxfParser };
