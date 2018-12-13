import { ImageMimeType } from "./image";

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
    "Papermill Ruins E": { folder: "papermill", mipLevel: 9, type: ImageMimeType.HDR },
    "Papermill Ruins E (LDR)": { folder: "papermill", mipLevel: 9, type: ImageMimeType.LDR },
    "Field": { folder: "field", mipLevel: 10, type: ImageMimeType.HDR },
    "Courtyard of the Doge's palace": { folder: "doge2", mipLevel: 10, type: ImageMimeType.HDR },
    "Pisa courtyard nearing sunset": { folder: "pisa", mipLevel: 10, type: ImageMimeType.HDR },
    "Footprint Court": { folder: "footprint_court", mipLevel: 9, type: ImageMimeType.HDR },
    "Helipad GoldenHour": { folder: "helipad", mipLevel: 9, type: ImageMimeType.HDR },
    "Dining room of the Ennis-Brown House": { folder: "ennis", mipLevel: 10, type: ImageMimeType.HDR }
};

class gltfRenderingParameters
{
    constructor(
        environmentName = Object.keys(Environments)[0],
        useIBL = true,
        usePunctual = false,
        exposure = 1.0,
        gamma = 2.2,
        clearColor = [51, 51, 51],
        toneMap = ToneMaps.LINEAR,
        debugOutput = DebugOutput.NONE)
    {
        this.environmentName = environmentName;
        this.useIBL = useIBL;
        this.usePunctual = usePunctual;
        this.exposure = exposure;
        this.gamma = gamma;
        this.clearColor = clearColor;
        this.toneMap = toneMap;
        this.debugOutput = debugOutput;
        this.sceneIndex = 0;
    }
};

export { gltfRenderingParameters, Environments, ToneMaps, DebugOutput };
