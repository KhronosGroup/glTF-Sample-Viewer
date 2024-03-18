import { vec3 } from 'gl-matrix';
import { jsToGl } from './utils.js';
import { gltfAccessor } from './accessor.js';

function getSceneExtents(gltf, sceneIndex, outMin, outMax)
{
    for (const i of [0, 1, 2])
    {
        outMin[i] = Number.POSITIVE_INFINITY;
        outMax[i] = Number.NEGATIVE_INFINITY;
    }

    const scene = gltf.scenes[sceneIndex];

    let nodeIndices = scene.nodes.slice();
    while(nodeIndices.length > 0)
    {
        const node = gltf.nodes[nodeIndices.pop()];
        nodeIndices = nodeIndices.concat(node.children);

        if (node.mesh === undefined)
        {
            continue;
        }

        const mesh = gltf.meshes[node.mesh];
        if (mesh.primitives === undefined)
        {
            continue;
        }

        for (const primitive of mesh.primitives)
        {
            const attribute = primitive.glAttributes.find(a => a.attribute == "POSITION");
            if (attribute === undefined)
            {
                continue;
            }

            const accessor = gltf.accessors[attribute.accessor];
            const assetMin = vec3.create();
            const assetMax = vec3.create();
            getExtentsFromAccessor(accessor, node.worldTransform, assetMin, assetMax);

            for (const i of [0, 1, 2])
            {
                outMin[i] = Math.min(outMin[i], assetMin[i]);
                outMax[i] = Math.max(outMax[i], assetMax[i]);
            }
        }
    }
}

function getExtentsFromAccessor(accessor, worldTransform, outMin, outMax)
{
    let min = jsToGl(accessor.min);
    let max = jsToGl(accessor.max);
    
    if (accessor.normalized) {
        min = gltfAccessor.dequantize(min, accessor.componentType);
        max = gltfAccessor.dequantize(max, accessor.componentType);
    }

    // Construct all eight corners from min and max values
    let boxVertices = [
        vec3.fromValues(min[0], min[1], min[2]),
        vec3.fromValues(min[0], min[1], max[2]),
        vec3.fromValues(min[0], max[1], min[2]),
        vec3.fromValues(min[0], max[1], max[2]),

        vec3.fromValues(max[0], min[1], min[2]),
        vec3.fromValues(max[0], min[1], max[2]),
        vec3.fromValues(max[0], max[1], min[2]),
        vec3.fromValues(max[0], max[1], max[2])];


    // Transform all bounding box vertices
    for(let i in boxVertices) { 
        vec3.transformMat4(boxVertices[i], boxVertices[i], worldTransform); 
    }

    // Create new (axis-aligned) bounding box out of transformed bounding box
    const boxMin = vec3.clone(boxVertices[0]); // initialize
    const boxMax = vec3.clone(boxVertices[0]);

    for(let i in boxVertices) {
        for (const component of [0, 1, 2]) {
            boxMin[component] = Math.min(boxMin[component], boxVertices[i][component]);
            boxMax[component] = Math.max(boxMax[component], boxVertices[i][component]);
        }
    }

    const center = vec3.create();
    vec3.add(center, boxMax, boxMin);
    vec3.scale(center, center, 0.5);

    const centerToSurface = vec3.create();
    vec3.sub(centerToSurface, boxMax, center);

    const radius = vec3.length(centerToSurface);

    for (const i of [0, 1, 2])
    {
        outMin[i] = center[i] - radius;
        outMax[i] = center[i] + radius;
    }
}

export { getSceneExtents };
