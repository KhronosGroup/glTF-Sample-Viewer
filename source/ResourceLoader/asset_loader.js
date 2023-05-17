

import { getIsGlb, getContainingFolder, getIsGltf, getIsGlxf } from '../gltf/utils.js';
import { GlbParser } from './glb_parser.js';
import { GltfParser } from './gltf_parser.js';
import { gltfLoader } from "./loader.js";



import { AsyncFileReader } from './async_file_reader.js';

import { GlxfParser } from './glxf_parser.js';

 
class AssetLoader
{
 
    static async loadAsset(assetFile, externalFiles)
    {
        let filename = "";
        let isGlfx = undefined;
        if (assetFile instanceof ArrayBuffer)
        {
            isGlfx = false
        } 
        else if (typeof assetFile === "string")
        {
            isGlfx = getIsGlxf(filename); 
            console.log("Loading asset from string");
            // TODO
        } 
        else if (typeof (File) !== 'undefined' && assetFile instanceof File)
        {
            let fileContent = assetFile;
            filename = assetFile.name;
            isGlfx = getIsGlxf(filename); 

            //let data = await AsyncFileReader.readAsText(fileContent);
            //json = JSON.parse(data);
            //buffers = externalFiles;

        } 
        else
        {
            console.error("Passed invalid type to loadAsset " + typeof (assetFile));
        }

        if(isGlfx)
        {
            return await this.loadGlxf(assetFile, externalFiles)
        }

        return await GltfParser.loadGltf(assetFile, externalFiles)
    }

    static async loadGlxf(glxfFile, externalFiles)
    {              
        let filename = glxfFile.name;

        let data = await AsyncFileReader.readAsText(glxfFile);
        let glxfJson = JSON.parse(data);

        let gltf = await GlxfParser.convertGlxfToGltf(glxfJson, externalFiles)

        return { json: gltf.json, data: gltf.data, filename: filename };
    }
 
}

export { AssetLoader };
