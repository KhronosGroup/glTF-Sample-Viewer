class gltfLight
{
    constructor(type = "directional",
                color = jsToGl([1, 1, 1]),
                intensity = 1,
                range = undefined,
                name = undefined,
                node = undefined)
    {
        this.type = type;
        this.color = color;
        this.intensity = intensity;
        this.range = range;
        this.name = name;
        this.node = node; // non-standard
    }

    fromJson(jsonLight)
    {
        fromKeys(this, jsonLight);
    }

    toUniform(transform)
    {
        let uLight = new UniformLight();
        let rotation = mat3.create();
        mat4.getRotation(rotation, transform);
        mat3.multiply(uLight.direction, uLight.direction, rotation);

        uLight.range = this.range;
        uLight.color = this.color;
        uLight.intensity = this.intensity;

        mat4.getTranslation(uLight.position, transform);
        uLight.innerConeAngle = this.innerConeAngle;
        uLight.outerConeAngle = this.outerConeAngle;

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

        this.direction = jsToGl([0, 0, -1]);
        this.range = -1.0;

        this.color = jsToGl([1, 1, 1]);
        this.intensity = 1.0;

        this.position = jsToGl([0, 0, 0]);
        this.innerConeAngle = 0.0;

        this.outerConeAngle = Math.PI / 4.0;
        this.type = Type_Directional;
        this.padding = vec2.create();
    }
}
