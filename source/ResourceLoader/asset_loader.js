

import axios from 'axios';
import { getIsGltfx } from '../gltf/utils.js';
import { GltfParser } from './gltf_parser.js';
import { AsyncFileReader } from './async_file_reader.js';
import { GltfxParser } from './gltfx_parser.js';

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
            isGlfx = getIsGltfx(assetFile); 
        } 
        else if (typeof (File) !== 'undefined' && assetFile instanceof File)
        {
            let fileContent = assetFile;
            filename = assetFile.name;
            isGlfx = getIsGltfx(filename); 
        } 
        else
        {
            console.error("Passed invalid type to loadAsset " + typeof (assetFile));
        }

        if(isGlfx)
        {
            return await this.loadGltfx(assetFile, externalFiles)
        }

        return await GltfParser.loadGltf(assetFile, externalFiles)
    }

    static async loadGltfx(gltfxFile, externalFiles)
    {       
        let filename = undefined
        let jsonString = undefined
        if (typeof gltfxFile === "string")
        {
            let response = await axios.get(gltfxFile,{
                headers: {
                    'Content-Type': 'application/json',
                },
                responseType: 'json',
                } );
            jsonString = JSON.stringify(response.data);
            filename = gltfxFile;
        }
        else
        {

            jsonString = await AsyncFileReader.readAsText(gltfxFile);
            filename = gltfxFile.name;
        }

        let gltfxJson =  JSON.parse(jsonString);
        let gltf = await GltfxParser.convertGltfxToGltf(filename, gltfxJson, externalFiles)

        return { json: gltf.json, data: gltf.data, filename: filename };
    }
 
}

export { AssetLoader };
