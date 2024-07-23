import { UserCamera } from '../gltf/user_camera.js';
import { AnimationTimer } from '../gltf/utils.js';

/**
 * GltfState containing a state for visualization in GltfView
 */
class GltfState
{
    /**
     * GltfState represents all state that can be visualized in a view. You could have
     * multiple GltfStates configured and switch between them on demand.
     * @param {*} view GltfView to which this state belongs
     */
    constructor(view)
    {
        /** loaded gltf data @see ResourceLoader.loadGltf */
        this.gltf = undefined;
        /** loaded environment data @see ResourceLoader.loadEnvironment */
        this.environment = undefined;
        /** user camera @see UserCamera, convenient camera controls */
        this.userCamera = new UserCamera();
        /** gltf scene that is visible in the view */
        this.sceneIndex = 0;
        /**
         * index of the camera that is used to render the view. a
         * value of 'undefined' enables the user camera
         */
        this.cameraIndex = undefined;
        /** indices of active animations */
        this.animationIndices = [];
        /** animation timer allows to control the animation time */
        this.animationTimer = new AnimationTimer();
        /** KHR_materials_variants */
        this.variant = undefined;

        /** parameters used to configure the rendering */
        this.renderingParameters = {
            /** morphing between vertices */
            morphing: true,
            /** skin / skeleton */
            skinning: true,

            enabledExtensions: {
                /** KHR_materials_clearcoat */
                KHR_materials_clearcoat: true,
                /** KHR_materials_sheen */
                KHR_materials_sheen: true,
                /** KHR_materials_transmission */
                KHR_materials_transmission: true,
                /** KHR_materials_volume */
                KHR_materials_volume: true,
                /** KHR_materials_ior makes the index of refraction configurable */
                KHR_materials_ior: true,
                /** KHR_materials_specular allows configuring specular color (f0 color) and amount of specular reflection */
                KHR_materials_specular: true,
                /** KHR_materials_iridescence adds a thin-film iridescence effect */
                KHR_materials_iridescence: true,
                KHR_materials_diffuse_transmission: true,
                /** KHR_materials_anisotropy defines microfacet grooves in the surface, stretching the specular reflection on the surface */
                KHR_materials_anisotropy: true,
                /** KHR_materials_dispersion defines configuring the strength of the angular separation of colors (chromatic abberation)*/
                KHR_materials_dispersion: true,
                KHR_materials_emissive_strength: true,
            },
            /** clear color expressed as list of ints in the range [0, 255] */
            clearColor: [58, 64, 74, 255],
            /** exposure factor */
            exposure: 1.0,
            /** KHR_lights_punctual */
            usePunctual: true,
            /** image based lighting */
            useIBL: true,
            /** image based lighting intensity */
            iblIntensity: 1.0,
            /** render the environment map in the background */
            renderEnvironmentMap: true,
            /** apply blur to the background environment map */
            blurEnvironmentMap: true,
            /** which tonemap to use, use KHR_PBR_NEUTRAL for best color reproduction */
            toneMap: GltfState.ToneMaps.KHR_PBR_NEUTRAL,
            /** render some debug output channes, such as for example the normals */
            debugOutput: GltfState.DebugOutput.NONE,
            /**
             * By default the front face of the environment is +Z (90)
             * Front faces:
             * +X = 0
             * +Z = 90
             * -X = 180
             * -Z = 270
             */
            environmentRotation: 90.0,
            /** If this is set to true, directional lights will be generated if IBL is disabled */
            useDirectionalLightsWithDisabledIBL: false,
            /** MSAA used for cases which are not handled by the browser (e.g. Transmission)*/
            internalMSAA: 4
        };

        // retain a reference to the view with which the state was created, so that it can be validated
        this._view = view;
    }
}

/**
 * ToneMaps enum for the different tonemappings that are supported
 * by gltf sample viewer
*/
GltfState.ToneMaps = {
    /** Khronos PBR neutral tone mapping, see https://github.com/KhronosGroup/ToneMapping, https://modelviewer.dev/examples/tone-mapping */
    KHR_PBR_NEUTRAL: "Khronos PBR Neutral",
    /** ACES sRGB RRT+ODT implementation for 3D Commerce based on Stephen Hill's implementation with a exposure factor of 1.0 / 0.6 */
    ACES_HILL_EXPOSURE_BOOST: "ACES Filmic Tone Mapping (Hill - Exposure Boost)",
    /** fast implementation of the ACES sRGB RRT+ODT based on Krzysztof Narkowicz' implementation*/
    ACES_NARKOWICZ: "ACES Filmic Tone Mapping (Narkowicz)",
    /** more accurate implementation of the ACES sRGB RRT+ODT based on Stephen Hill's implementation*/
    ACES_HILL: "ACES Filmic Tone Mapping (Hill)",
    /** Linear mapping, clamped at 1.0 per channel */
    NONE: "None (Linear mapping, clamped at 1.0)",
};

/**
 * DebugOutput enum for selecting debug output channels
 * such as "NORMAL"
 */
GltfState.DebugOutput = {
    /** standard rendering - debug output is disabled */
    NONE: "None",

    /** generic debug outputs */
    generic: {
        /** output the texture coordinates 0 */
        UV_COORDS_0: "Texture Coordinates 0",
        /** output the texture coordinates 1 */
        UV_COORDS_1: "Texture Coordinates 1",
        /** output the world space normals (i.e. with TBN applied) */
        NORMAL: "Normal Texture",
        /** output the normal from the TBN*/
        GEOMETRYNORMAL: "Geometry Normal",
        /** output the tangent from the TBN*/
        TANGENT: "Geometry Tangent",
        /** output the bitangent from the TBN */
        BITANGENT: "Geometry Bitangent",
        /** output the world space normals (i.e. with TBN applied) */
        WORLDSPACENORMAL: "Shading Normal",
        /** output the alpha value */
        ALPHA: "Alpha",
        /** output the occlusion value */
        OCCLUSION: "Occlusion",
        /** output the emissive value */
        EMISSIVE: "Emissive",
    },

    /** metallic roughness */
    mr: {
        /** output the base color value */
        BASECOLOR: "Base Color",
        /** output the metallic value from pbr metallic roughness */
        METALLIC: "Metallic",
        /** output the roughness value from pbr metallic roughness */
        ROUGHNESS: "Roughness",
    },

    /** KHR_materials_clearcoat */
    clearcoat: {
        /** output the clear coat strength */
        CLEARCOAT_FACTOR: "ClearCoat Strength",
        /** output the clear coat roughness */
        CLEARCOAT_ROUGHNESS: "ClearCoat Roughness",
        /** output the clear coat normal */
        CLEARCOAT_NORMAL: "ClearCoat Normal",
    },

    /** KHR_materials_sheen */
    sheen: {
        /** output the sheen color*/
        SHEEN_COLOR: "Sheen Color",
        /** output the sheen roughness*/
        SHEEN_ROUGHNESS: "Sheen Roughness",
    },

    /** KHR_materials_specular */
    specular: {
        /** output the specular strength*/
        SPECULAR_FACTOR: "Specular Strength",
        /** output the specular color*/
        SPECULAR_COLOR: "Specular Color",
    },

    /** KHR_materials_transmission */
    transmission: {
        /** output the transmission strength*/
        TRANSMISSION_FACTOR: "Transmission Strength",
        /** output the volume thickness*/
        VOLUME_THICKNESS: "Volume Thickness",
    },

    /** KHR_materials_diffuse_tranmission */
    diffuseTransmission: {
        /** output the diffuse tranmission strength */
        DIFFUSE_TRANSMISSION_FACTOR: "Diffuse Transmission Strength",
        /** output the diffuse tranmission color factor */
        DIFFUSE_TRANSMISSION_COLOR_FACTOR: "Diffuse Transmission Color",
    },

    /** KHR_materials_iridescence */
    iridescence: {
        /** output the iridescence strength*/
        IRIDESCENCE_FACTOR: "Iridescence Strength",
        /** output the iridescence thickness*/
        IRIDESCENCE_THICKNESS: "Iridescence Thickness",
    },

    /** KHR_materials_anisotropy */
    anisotropy: {
        /** output the anisotropic strength*/
        ANISOTROPIC_STRENGTH: "Anisotropic Strength",
        /** output final direction as defined by the anisotropyTexture and rotation*/
        ANISOTROPIC_DIRECTION: "Anisotropic Direction",
    },
};

export { GltfState };
