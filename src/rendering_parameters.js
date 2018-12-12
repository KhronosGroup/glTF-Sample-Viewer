const ToneMaps =
{
    LINEAR: "Linear" ,
    UNCHARTED: "Uncharted 2" ,
    HEJL_RICHARD: "Hejl Richard"
};

const DebugOutput =
{
    NONE: "None",
    METALLIC: "Metallic",
    ROUGHNESS: "Roughness",
    NORMAL: "Normal",
    BASECOLOR: "Base Color",
    OCCLUSION: "Occlusion",
    EMISIVE: "Emissive",
    ALPHA: "Alpha",
    F0: "F0"
};

const Environments =
{
    "Papermill": { folder: "papermill", mipLevel: 9 },
    "Field": { folder: "field", mipLevel: 10 },
    "Doge2": { folder: "doge2", mipLevel: 10 },
    "Pisa": { folder: "pisa", mipLevel: 10 }
};

class gltfRenderingParameters
{
    constructor(
        environmentName = undefined,
        useIBL = true,
        usePunctual = false,
        useHdr = true,
        exposure = 1.0,
        gamma = 2.2,
        clearColor = [51, 51, 51],
        toneMap = ToneMaps.LINEAR,
        debugOutput = DebugOutput.NONE)
    {
        this.environmentName = environmentName;
        this.useIBL = useIBL;
        this.usePunctual = usePunctual;
        this.useHdr = useHdr;
        this.exposure = exposure;
        this.gamma = gamma;
        this.clearColor = clearColor;
        this.toneMap = toneMap;
        this.debugOutput = debugOutput;

        const OES_texture_float = gl.getExtension("OES_texture_float");
        const OES_texture_float_linear = gl.getExtension("OES_texture_float_linear");
        if ((!OES_texture_float || !OES_texture_float_linear) && this.useHdr)
        {
            this.useHdr = false;
            console.warn("Forcing to LDR rendering.");
        }
    }
};

export { gltfRenderingParameters, Environments, ToneMaps, DebugOutput };
