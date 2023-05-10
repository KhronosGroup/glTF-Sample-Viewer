
class glxfParser
{
    static async convertGlxfToGltf(glxfJson, appendix)
    {
        const mergedGLTF = {}; // Initialize an empty merged GLTF object

        // Iterate over each asset in the GLXF file
        for (const asset of glxf.assets) {
          const gltfURI = asset.uri;
          const gltf = loadGLTF(gltfURI); // Load the GLTF file
      
          // Merge the current GLTF with the mergedGLTF object
          mergedGLTF = mergeGLTF(mergedGLTF, gltf);
        }
      
 
        // Return the GLTF JSON
        return mergedGLTF;

    }

}

export { GlxfParser };
