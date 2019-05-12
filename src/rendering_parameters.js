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
        debugOutput = DebugOutput.NONE,
        useShaderLoD = true)
    {
        this.environmentName = environmentName;
        this.useIBL = useIBL;
        this.usePunctual = usePunctual;
        this.exposure = exposure;
        this.clearColor = clearColor;
        this.toneMap = toneMap;
        this.useShaderLoD = useShaderLoD;
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
    BASECOLOR: "Base Color",
    OCCLUSION: "Occlusion",
    EMISIVE: "Emissive",
    ALPHA: "Alpha",
    F0: "F0"
};

const Environments =
{
    "Papermill Ruins E": { folder: "papermill", mipLevel: 10, type: ImageMimeType.HDR },
    "Papermill Ruins E (LDR)": { folder: "papermill", mipLevel: 10, type: ImageMimeType.LDR },
    "Field": { folder: "field", mipLevel: 11, type: ImageMimeType.HDR },
    "Courtyard of the Doge's palace": { folder: "doge2", mipLevel: 11, type: ImageMimeType.HDR },
    "Pisa courtyard nearing sunset": { folder: "pisa", mipLevel: 11, type: ImageMimeType.HDR },
    "Footprint Court": { folder: "footprint_court", mipLevel: 10, type: ImageMimeType.HDR },
    "Helipad GoldenHour": { folder: "helipad", mipLevel: 10, type: ImageMimeType.HDR },
    "Dining room of the Ennis-Brown House": { folder: "ennis", mipLevel: 11, type: ImageMimeType.HDR },
    "Studio Grey": { folder: "studio_grey", mipLevel: 11, type: ImageMimeType.HDR },
    "Studio Red Green": { folder: "studio_red_green", mipLevel: 11, type: ImageMimeType.HDR }
};

export { UserCameraIndex, gltfRenderingParameters, Environments, ToneMaps, DebugOutput };
