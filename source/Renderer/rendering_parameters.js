import { ImageMimeType } from "../gltf/image";

const UserCameraIndex = "orbit camera";

const ToneMaps =
{
    NONE: "None",
    ACES_FAST: "ACES fast",
    ACES: "ACES"
};

const DebugOutput =
{
    NONE: "None",
    METALLIC: "Metallic",
    ROUGHNESS: "Roughness",
    NORMAL: "Normal",
    WORLDSPACENORMAL: "Worldspace Normal",
    GEOMETRYNORMAL: "Geometry Normal",
    TANGENT: "Tangent",
    BITANGENT: "Bitangent",
    BASECOLOR: "Base Color",
    OCCLUSION: "Occlusion",
    EMISSIVE: "Emissive",
    DIFFUSE: "Diffuse",
    SPECULAR: "Specular",
    CLEARCOAT: "ClearCoat",
    SHEEN: "Sheen",
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

export { UserCameraIndex, Environments, ToneMaps, DebugOutput };
