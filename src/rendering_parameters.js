import { ImageMimeType } from "./image";
import { AnimationTimer } from "./utils";

const UserCameraIndex = "orbit camera";

class gltfRenderingParameters
{
    constructor(
        environmentName = Object.keys(Environments)[0],
        useIBL = true,
        usePunctual = false,
        exposure = 1.0,
        clearColor = [50, 50, 50],
        toneMap = ToneMaps.LINEAR,
        debugOutput = DebugOutput.NONE)
    {
        this.environmentName = environmentName;
        this.useIBL = useIBL;
        this.usePunctual = usePunctual;
        this.exposure = exposure;
        this.clearColor = clearColor;
        this.toneMap = toneMap;
        this.debugOutput = debugOutput;
        this.sceneIndex = 0;
        this.cameraIndex = UserCameraIndex;
        this.animationTimer = new AnimationTimer();
        this.animationIndex = "all";
        this.skinning = true;
        this.morphing = true;
    }

    userCameraActive()
    {
        return this.cameraIndex === UserCameraIndex;
    }
}

const ToneMaps =
{
    LINEAR: "Linear",
    UNCHARTED: "Uncharted 2",
    HEJL_RICHARD: "Hejl Richard",
    ACES: "ACES"
};

const DebugOutput =
{
    NONE: "None",
    METALLIC: "Metallic",
    ROUGHNESS: "Roughness",
    NORMAL: "Normal",
    TANGENT: "Tangent",
    BITANGENT: "Bitangent",
    BASECOLOR: "Base Color",
    OCCLUSION: "Occlusion",
    EMISSIVE: "Emissive",
    DIFFUSE: "Diffuse",
    SPECULAR: "Specular",
    THICKNESS: "Thickness",
    CLEARCOAT: "ClearCoat",
    SHEEN: "Sheen",
    SUBSURFACE: "Subsurface",
    TRANSMISSION: "Transmission",
    ALPHA: "Alpha",
    F0: "F0"
};

const Environments =
{
    "Papermill Ruins E": { folder: "papermill", mipLevel: 11, type: ImageMimeType.KTX2 },
    "Field": { folder: "field", mipLevel: 11, type: ImageMimeType.KTX2 },
    "Courtyard of the Doge's palace": { folder: "doge2", mipLevel: 11, type: ImageMimeType.KTX2 },
    "Pisa courtyard nearing sunset": { folder: "pisa", mipLevel: 11, type: ImageMimeType.KTX2 },
    "Footprint Court": { folder: "footprint_court", mipLevel: 11, type: ImageMimeType.KTX2 },
    "Helipad GoldenHour": { folder: "helipad", mipLevel: 11, type: ImageMimeType.KTX2 },
    "Dining room of the Ennis-Brown House": { folder: "ennis", mipLevel: 11, type: ImageMimeType.KTX2 },
    "Neutral": { folder: "neutral", mipLevel: 11, type: ImageMimeType.KTX2 },
    "Directional": { folder: "directional", mipLevel: 11, type: ImageMimeType.KTX2 },
    "Chromatic": { folder: "chromatic", mipLevel: 11, type: ImageMimeType.KTX2 }
};

export { UserCameraIndex, gltfRenderingParameters, Environments, ToneMaps, DebugOutput };
