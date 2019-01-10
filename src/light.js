import { mat4, vec2, vec3, quat } from 'gl-matrix';
import { fromKeys, jsToGl, UniformStruct } from './utils.js';

class gltfLight
{
    constructor(type = "directional",
        color = [1, 1, 1],
        intensity = 2,
        innerConeAngle = 0,
        outerConeAngle = Math.PI / 4,
        range = -1, // if no range is defined in the json, this is the default the shader understands
        name = undefined,
        node = undefined)
    {
        this.type = type;
        this.color = color;
        this.intensity = intensity;
        this.innerConeAngle = innerConeAngle;
        this.outerConeAngle = outerConeAngle;
        this.range = range;
        this.name = name;
        this.node = node; // non-standard
    }

    fromJson(jsonLight)
    {
        fromKeys(this, jsonLight);
    }

    toUniform(gltf)
    {
        let uLight = new UniformLight();

        if (this.node !== undefined)
        {
            let transform = gltf.nodes[this.node].worldTransform;
            let rotation = quat.create();
            let alongNegativeZ = vec3.fromValues(0, 0, -1);
            mat4.getRotation(rotation, transform);
            vec3.transformQuat(uLight.direction, alongNegativeZ, rotation);
            mat4.getTranslation(uLight.position, transform);
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
        this.intensity = 2;

        this.position = jsToGl([0, 0, 0]);
        this.innerConeCos = 0.0;

        this.outerConeCos = Math.PI / 4;
        this.type = Type_Directional;
        this.padding = vec2.create();
    }
}

export { gltfLight };
