import { mat4, vec2, vec3, quat } from 'gl-matrix';
import { jsToGl, UniformStruct } from './utils.js';
import { fromKeys } from './utils.js';
import { GltfObject } from './gltf_object.js';

class gltfLight extends GltfObject
{
    constructor(
        type = "directional",
        color = [1, 1, 1],
        intensity = 1,
        innerConeAngle = 0,
        outerConeAngle = Math.PI / 4,
        range = -1,
        name = undefined,
        node = undefined)
    {
        super();
        this.type = type;
        this.color = color;
        this.intensity = intensity;
        this.innerConeAngle = innerConeAngle;
        this.outerConeAngle = outerConeAngle;
        this.range = range;
        this.name = name;
        // non gltf
        this.node = node;
    }

    initGl(gltf)
    {
        super.initGl(gltf);

        for (let i = 0; i < gltf.nodes.length; i++)
        {
            const nodeExtensions = gltf.nodes[i].extensions;
            if (nodeExtensions === undefined)
            {
                continue;
            }

            const lightsExtension = nodeExtensions.KHR_lights_punctual;
            if (lightsExtension === undefined)
            {
                continue;
            }

            const lightIndex = lightsExtension.light;
            if (gltf.lights[lightIndex] === this)
            {
                this.node = i;
                break;
            }
        }
    }
    
    fromJson(jsonLight)
    {
        super.fromJson(jsonLight);

        if(jsonLight.spot !== undefined)
        {
            fromKeys(this, jsonLight.spot);
        }
    }

    toUniform(gltf)
    {
        const uLight = new UniformLight();

        if (this.node !== undefined)
        {
            const matrix = gltf.nodes[this.node].worldTransform;

            var scale = vec3.fromValues(1, 1, 1);
            mat4.getScaling(scale, matrix);
        
            // To extract a correct rotation, the scaling component must be eliminated.
            const mn = mat4.create();
            for(const col of [0, 1, 2])
            {
                mn[col] = matrix[col] / scale[0];
                mn[col + 4] = matrix[col + 4] / scale[1];
                mn[col + 8] = matrix[col + 8] / scale[2];
            }
            var rotation = quat.create();
            mat4.getRotation(rotation, mn);
            quat.normalize(rotation, rotation);

            const alongNegativeZ = vec3.fromValues(0, 0, -1);
            vec3.transformQuat(uLight.direction, alongNegativeZ, rotation);

            var translation = vec3.fromValues(0, 0, 0);
            mat4.getTranslation(translation, matrix);
            uLight.position = translation;
        }

        uLight.range = this.range;
        uLight.color = jsToGl(this.color);
        uLight.intensity = this.intensity;

        uLight.innerConeCos = Math.cos(this.innerConeAngle);
        uLight.outerConeCos = Math.cos(this.outerConeAngle);

        switch(this.type)
        {
        case "spot":
            uLight.type = Type_Spot;
            break;
        case "point":
            uLight.type = Type_Point;
            break;
        case "directional":
        default:
            uLight.type = Type_Directional;
            break;
        }

        return uLight;
    }
}

const Type_Directional = 0;
const Type_Point = 1;
const Type_Spot = 2;

class UniformLight extends UniformStruct
{
    constructor()
    {
        super();

        const defaultDirection = vec3.fromValues(-0.7399, -0.6428, -0.1983);
        this.direction = defaultDirection;
        this.range = -1;

        this.color = jsToGl([1, 1, 1]);
        this.intensity = 1;

        this.position = jsToGl([0, 0, 0]);
        this.innerConeCos = 0.0;

        this.outerConeCos = Math.PI / 4;
        this.type = Type_Directional;
        this.padding = vec2.create();
    }
}

export { gltfLight };
