import { mat4, vec2, vec3, quat } from 'gl-matrix';
import { jsToGl, UniformStruct, initGlForMembers } from './utils.js';
import { GltfObject } from './gltf_object.js';

class gltfLight extends GltfObject
{
    constructor()
    {
        super();
        this.type = "directional";
        this.color = [1, 1, 1];
        this.intensity = 2;
        this.innerConeAngle = 0;
        this.outerConeAngle = Math.PI / 4;
        this.range = -1;
        this.name = undefined;

        // non gltf
        this.node = undefined;
    }

    initGl(gltf)
    {
        initGlForMembers(this, gltf);
    }

    toUniform(gltf)
    {
        const uLight = new UniformLight();

        if (this.node !== undefined)
        {
            const transform = gltf.nodes[this.node].worldTransform;
            const rotation = quat.create();
            const alongNegativeZ = vec3.fromValues(0, 0, -1);
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
