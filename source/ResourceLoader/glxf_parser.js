
import { GltfParser } from "./gltf_parser.js";
import { GltfMerger } from "./gltf_merger.js";
import { gltfNode } from '../gltf/node.js';
import { mat4, quat } from 'gl-matrix';
import { initGlForMembers, objectsFromJsons, objectFromJson } from '../gltf/utils';

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

    static getNodeParent(gltf, nodeID)
    {
        for (let id = 0; id < gltf["nodes"].length; id++) 
        {
            const node = gltf["nodes"][id]
            if(node.hasOwnProperty("children"))
            {
                for (const child of node["children"])
                {
                    if (child === nodeID)
                    {
                        return id
                    }
                }
            }
        }
        return undefined
    }


    static applyTransform(node, parentTransform)
    {
        let nodeObject = objectFromJson(node, gltfNode)

        let result = mat4.create()
        mat4.multiply(result, parentTransform, nodeObject.getLocalTransform());
        return result 
    }
     


    static applyNodeTransform(gltf, nodeID, transform)
    {
        if(transform === "local")
        {
            // The value local indicates that only the nodes' own transforms 
            // (defined by TRS or matrix properties) are used in their instantiation in the glXF.
            return
        }
        if(transform === "global")
        {
            // The value global indicates that the nodes use their global transforms from 
            // the imported asset as their local transforms in the glXF.
            
            let parentList = []
            let candidateID = nodeID

            while (candidateID!==undefined) 
            {
                parentList.push(candidateID)
                candidateID = this.getNodeParent(gltf, parentList[parentList.length - 1])
            } 
            
            let globalTransform = mat4.create()
            mat4.identity(globalTransform)
            for (let i = parentList.length-1; i >=0 ; i--) 
            {
                let id = parentList[i]    
                globalTransform = this.applyTransform(gltf["nodes"][id], globalTransform);
            }
            delete gltf["nodes"][nodeID]["translation"]
            delete gltf["nodes"][nodeID]["rotation"]
            delete gltf["nodes"][nodeID]["scale"] 
            let matrix =[]
            for (let i = 0; i < globalTransform.length; ++i) 
            {
                matrix.push(globalTransform[i]);
            }
            gltf["nodes"][nodeID]["matrix"] = matrix

        }
        if(transform === "none")
        {
            // The value none indicates that all nodes' transforms (including own) from 
            // the imported asset are ignored.

            function resetTransform(gltf, nodeID)
            {
                delete gltf["nodes"][nodeID]["translation"]
                delete gltf["nodes"][nodeID]["rotation"]
                delete gltf["nodes"][nodeID]["scale"] 
                delete gltf["nodes"][nodeID]["matrix"] 
                if(gltf["nodes"][nodeID].hasOwnProperty("children"))
                {
                    for (const child of node["children"])
                    {
                        resetTransform(gltf, child);
                    }
                }
            } 

            resetTransform(gltf, nodeID)
        }

    }

    static getPropertyIDByName(gltf, property, name)
    {
        if (!gltf.hasOwnProperty(property))
        {
            return undefined
        }
        for (let i = 0; i < gltf[property].length; i++) 
        {
            if(gltf[property][i].hasOwnProperty("name"))
            {
                if( gltf[property][i]["name"] === name)
                { 
                    return i
                } 
            }
        }
        return undefined
    }

    static resolveAsset(assetID, asset, gltf)
    {
        if (!gltf.hasOwnProperty("scenes"))
        {
            return
        }
        if (!gltf.hasOwnProperty("nodes"))
        {
            return
        }

        let nodeIDs = []
        if ("nodes" in asset)
        {
            console.log("handle asset nodes")
            const nodeList =  asset["nodes"] // e.g. [ "node_a", "node_b" ]
            let nodeTransform = "global" // default
            if ("transform" in asset)
            { 
                // none, local, or global
                nodeTransform = asset["transform"]  
            }
            for( const nodeName of nodeList)
            {
                const nodeID = this.getPropertyIDByName(gltf, "nodes", nodeName)
                nodeIDs.push(nodeID)
                this.applyNodeTransform(gltf, nodeID, nodeTransform)
            }
        } 
        else if("scene" in asset)
        {
            console.log("handle asset scene")
            const sceneName = asset["scene"]

            const sceneID = this.getPropertyIDByName(gltf, "scenes", sceneName)
            nodeIDs = gltf["scenes"][sceneID]["nodes"]
        }
        else // no scene and no nodes defined by glxf
        {   
            console.log("handle default")
            // check for default scene
            if (gltf.hasOwnProperty("scene"))
            {
                const sceneID = gltf["scene"]
                console.log("sceneID = "+sceneID)
                console.log("scene nodes = ")
                console.log(gltf["scenes"][sceneID]["nodes"])
                nodeIDs = gltf["scenes"][sceneID]["nodes"]
            }
            else
            {
                // select first scene
                nodeIDs = gltf["scenes"][0]["nodes"]
            }

        }

        // Now create a node that inclues all nodes of nodeIDs as children
        // This node represents the contents of this asset and is marked in the extras field

        let node = {}
        node["extras"] = {}
        node["extras"]["asset"] = assetID
        node["children"]  = nodeIDs

        
        console.log("Adding nodeIDs:")
        console.log(nodeIDs)

        gltf["nodes"].push(node)
    }



    static async convertGlxfToGltf(glxf, appendix)
    {
        let mergedGLTF = {}; // Initialize an empty merged GLTF object

        // Iterate over each asset in the GLXF file and merge them into one glTF
        for (let i = 0; i <  glxf.assets.length; i++) 
        {
            let asset = glxf.assets[i];
            const gltfURI = asset.uri;
            console.log("loading glxf asset: "+gltfURI)
            console.log("glxf appendix: ")
            console.log(appendix)
            const assetFile = this.findFile(asset.uri, appendix)
            let gltfPackage = await GltfParser.loadGltf(assetFile, appendix); // -> { json, data, filename }
            // resolve all nodes/scenes and the respective transformations 

            console.log("loaded asset: ")
            console.log( gltfPackage.json)
            this.resolveAsset(i, asset, gltfPackage.json)

            // Merge the current GLTF with the mergedGLTF object
            mergedGLTF = await GltfMerger.merge(mergedGLTF, gltfPackage.json);
        }

        console.log("mergedGLTF: ")
        console.log(mergedGLTF)

        // glTFs are prepared
        // now lets compose our glxf scene
      
        let assetNodeIDs = []
        for (let id = 0; id < mergedGLTF["nodes"].length; id++) 
        {
            let node =  mergedGLTF["nodes"][id]
            if("extras" in node)
            {
                if("asset" in node["extras"])
                {
                    assetNodeIDs.push(id)
                }
            }
        }


        function getAssetNode(gltf, assetID)
        {
            for (let id = 0; id < gltf["nodes"].length; id++) 
            {
                let node =  gltf["nodes"][id]
                if("extras" in node)
                {
                    if("asset" in node["extras"])
                    {
                        if( assetID === node["extras"]["asset"])
                        {
                            return id
                        }
                    }
                }
            }
            return undefined
        }

        // Merging glxf transformation and node hierarchy
 
        delete glxf["assets"]

        for (let id = 0; id < glxf["nodes"].length; id++) 
        {
            // move asset property to extras to merge valid glTF
            if(glxf["nodes"][id].hasOwnProperty("asset"))
            {
                const assetID = glxf["nodes"][id]["asset"]
                delete glxf["nodes"][id]["asset"]
                glxf["nodes"][id]["extras"] = {}
                glxf["nodes"][id]["extras"]["expectAsset"] = (assetID)
            } 
        }

        // Prepare merged glTF for final merge of glXF properties
        // We don't want to expose old scenes from glTFs
        delete mergedGLTF["scenes"]
        delete mergedGLTF["scene"]

        mergedGLTF = await GltfMerger.merge(mergedGLTF, glxf);

        // Connect nodes offered by assets and expected by glxf
        for (let id = 0; id < mergedGLTF["nodes"].length; id++) 
        {
            if(mergedGLTF["nodes"][id].hasOwnProperty("extras") &&
                mergedGLTF["nodes"][id]["extras"].hasOwnProperty("expectAsset"))
            {
                const assetID = mergedGLTF["nodes"][id]["extras"]["expectAsset"]
                const nodeID = getAssetNode(mergedGLTF, assetID) 
                if(nodeID!==undefined)
                {
                    mergedGLTF["nodes"][id]["children"] = []
                    mergedGLTF["nodes"][id]["children"].push(nodeID)
                }
            } 
        }

        // cleanup asset markers in the extras field
        for (let id = 0; id < mergedGLTF["nodes"].length; id++) 
        {
            if(mergedGLTF["nodes"][id].hasOwnProperty("extras") )
            {
                delete mergedGLTF["nodes"][id]["extras"]["expectAsset"]
                delete mergedGLTF["nodes"][id]["extras"]["asset"]
            } 
        }
       
        // Return the GLTF JSON 
        return { json: mergedGLTF, data: appendix};
    }

}

export { GlxfParser };
