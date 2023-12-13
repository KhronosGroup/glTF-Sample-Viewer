
import { GlbParser } from './glb_parser.js';
import { getIsGlb, getContainingFolder, getIsGltf, getIsGltfx } from '../gltf/utils.js';
import axios from 'axios';
import { AsyncFileReader } from './async_file_reader.js';
class GltfParser
{ 
   /**
     * loadGltf asynchroneously and create resources for rendering
     * @param {(String | ArrayBuffer | File)} gltfFile the .gltf or .glb file either as path or as preloaded resource. In node.js environments, only ArrayBuffer types are accepted.
     * @param {File[]} [externalFiles] additional files containing resources that are referenced in the gltf
     * @returns {Promise} a promise that fulfills when the gltf file was loaded
     */
   static async loadGltf(gltfFile, externalFiles)
   {
        if (externalFiles === undefined)
        {
            externalFiles = []
        }

        let isGlb = undefined;
        let buffers = []; // array of additional resources
        let json = undefined;
        let data = undefined; // binary data used for glb
        let filename = "";
        if (typeof gltfFile === "string")
        {
            isGlb = getIsGlb(gltfFile);
            let response = await axios.get(gltfFile, { responseType: isGlb ? "arraybuffer" : "json" });    
            if (isGlb)
            {
                data = response.data;
            }
            else
            {
                json = response.data;
            }
            filename = gltfFile;
        }
        else if (gltfFile instanceof ArrayBuffer)
        {
            isGlb = externalFiles === undefined;
            if (isGlb)
            {
                data = gltfFile;
            }
            else
            {
                console.error("Only .glb files can be loaded from an array buffer");
            }
        }
        else if (typeof (File) !== 'undefined' && gltfFile instanceof File)
        {
            let fileContent = gltfFile;
            filename = gltfFile.name;
            isGlb = getIsGlb(filename);
            if (isGlb)
            {
                data = await AsyncFileReader.readAsArrayBuffer(fileContent);
            }
            else
            {
                data = await AsyncFileReader.readAsText(fileContent);
                json = JSON.parse(data);
                buffers = externalFiles;
            }
        }
        else
        {
            console.error("Passed invalid type to loadGltf " + typeof (gltfFile));
        }

        if (isGlb)
        {
            const glbParser = new GlbParser(data);
            const glb = glbParser.extractGlbData();
            json = glb.json;
            
            if(json.hasOwnProperty("buffers"))
            {
                json["buffers"][0]["extras"] = {}
                json["buffers"][0]["extras"]["glb"] = filename
            }

            buffers = buffers.concat(glb.buffers);
            var externalFileEntry = {
                uri: filename,
                data: glb.buffers[0]
            }
            externalFiles.push(externalFileEntry);
        }


        return { json: json, data: externalFiles, filename: filename };
   }
}

export { GltfParser };
