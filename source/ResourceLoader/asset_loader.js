

import axios from 'axios';
import { getIsGlxf } from '../gltf/utils.js';
import { GltfParser } from './gltf_parser.js';
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
            isGlfx = getIsGlxf(assetFile); 
        } 
        else if (typeof (File) !== 'undefined' && assetFile instanceof File)
        {
            let fileContent = assetFile;
            filename = assetFile.name;
            isGlfx = getIsGlxf(filename); 
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
        let filename = undefined
        let jsonString = undefined
        if (typeof glxfFile === "string")
        {
            let response = await axios.get(glxfFile,{
                headers: {
                    'Content-Type': 'application/json',
                },
                responseType: 'json',
                } );
            jsonString = JSON.stringify(response.data);
            filename = glxfFile;
        }
        else
        {

            jsonString = await AsyncFileReader.readAsText(glxfFile);
            filename = glxfFile.name;
        }

        let glxfJson =  JSON.parse(jsonString);
        let gltf = await GlxfParser.convertGlxfToGltf(filename, glxfJson, externalFiles)

        return { json: gltf.json, data: gltf.data, filename: filename };
    }
 
}

export { AssetLoader };
