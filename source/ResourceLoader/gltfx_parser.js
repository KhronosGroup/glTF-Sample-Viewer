
import { GltfMerger } from "./gltf_merger.js";
import { gltfNode } from '../gltf/node.js';
import { mat4 } from 'gl-matrix';
import { objectFromJson,getContainingFolder } from '../gltf/utils.js';

import { AssetLoader } from "./asset_loader.js";

class GltfxParser
{

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
            // (defined by TRS or matrix properties) are used in their instantiation in the glTFX.
            return
        }
        if(transform === "global")
        {
            // The value global indicates that the nodes use their global transforms from 
            // the imported asset as their local transforms in the glTFX.
            
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
            const sceneName = asset["scene"]

            const sceneID = this.getPropertyIDByName(gltf, "scenes", sceneName)
            nodeIDs = gltf["scenes"][sceneID]["nodes"]
        }
        else // no scene and no nodes defined by gltfx
        {   
            // check for default scene
            if (gltf.hasOwnProperty("scene"))
            {
                const sceneID = gltf["scene"]
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

        gltf["nodes"].push(node)
    }



    static async convertGltfxToGltf(filename, gltfx, appendix)
    {
        let mergedGLTF = {}; // Initialize an empty merged GLTF object

        // Iterate over each asset in the glTFX file and merge them into one glTF
        for (let i = 0; i <  gltfx.assets.length; i++) 
        {
            let asset = gltfx.assets[i];

            let assetFile = undefined
            if(appendix !==undefined)
            {
                assetFile = appendix.find( (file) => file.name === asset.uri );
            }
            if(assetFile === undefined)
            {
                assetFile = getContainingFolder(filename )+asset.uri
            }

            let resourcePackage = await AssetLoader.loadAsset(assetFile, appendix); // -> { json, data, filename }
            appendix = resourcePackage.data
            // resolve all nodes/scenes and the respective transformations 
            this.resolveAsset(i, asset, resourcePackage.json)

            // Merge the current GLTF with the mergedGLTF object
            mergedGLTF = await GltfMerger.merge(mergedGLTF, resourcePackage.json);
        }


        // glTFs are prepared
        // now lets compose our gltfx scene
      
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

        // Merging gltfx transformation and node hierarchy
 
        delete gltfx["assets"]

        for (let id = 0; id < gltfx["nodes"].length; id++) 
        {
            // move asset property to extras to merge valid glTF
            if(gltfx["nodes"][id].hasOwnProperty("asset"))
            {
                const assetID = gltfx["nodes"][id]["asset"]
                delete gltfx["nodes"][id]["asset"]
                gltfx["nodes"][id]["extras"] = {}
                gltfx["nodes"][id]["extras"]["expectAsset"] = (assetID)
            } 
        }

        // Prepare merged glTF for final merge of glTFX properties
        // We don't want to expose old scenes from glTFs
        delete mergedGLTF["scenes"]
        delete mergedGLTF["scene"]

        mergedGLTF = await GltfMerger.merge(mergedGLTF, gltfx);

        // Connect nodes offered by assets and expected by gltfx
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

export { GltfxParser };
