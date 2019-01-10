import { vec3 } from 'gl-matrix';
import { jsToGl } from './utils.js';

function getSceneExtends(gltf, sceneIndex, outMin, outMax)
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
            const attribute = primitive.attributes.find(a => a.attribute == "POSITION");
            if (attribute === undefined)
            {
                continue;
            }

            const accessor = gltf.accessors[attribute.accessor];
            const assetMin = vec3.create();
            const assetMax = vec3.create();
            getExtendsFromAccessor(accessor, node.worldTransform, assetMin, assetMax);

            for (const i of [0, 1, 2])
            {
                outMin[i] = Math.min(outMin[i], assetMin[i]);
                outMax[i] = Math.max(outMax[i], assetMax[i]);
            }
        }
    }
}

function getExtendsFromAccessor(accessor, worldTransform, outMin, outMax)
{
    const boxMin = vec3.create();
    vec3.transformMat4(boxMin, jsToGl(accessor.min), worldTransform);

    const boxMax = vec3.create();
    vec3.transformMat4(boxMax, jsToGl(accessor.max), worldTransform);

    const center = vec3.create();
    vec3.add(center, boxMax, boxMin);
    vec3.scale(center, center, 0.5);

    const centerToSurface = vec3.create();
    vec3.sub(centerToSurface, boxMax, center);

    const radius = vec3.length(centerToSurface);

    for (const i of [1, 2, 3])
    {
        outMin[i] = center[i] - radius;
        outMax[i] = center[i] + radius;
    }
}

function getScaleFactor(gltf, sceneIndex)
{
    const min = vec3.create();
    const max = vec3.create();
    getSceneExtends(gltf, sceneIndex, min, max);
    const minValue = Math.min(min[0], Math.min(min[1], min[2]));
    const maxValue = Math.max(max[0], Math.max(max[1], max[2]));
    const deltaValue = maxValue - minValue;
    return 1.0 / deltaValue;
}

export { getSceneExtends, getScaleFactor };
