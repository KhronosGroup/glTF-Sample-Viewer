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
[
    "papermill",
    "field",
    "doge2"
]

const EnvironmentsMipLevel =
[
    9,
    10,
    10
]

class gltfRenderingParameters
{
    constructor(
        environment = undefined,
        useIBL = true,
        usePunctual = false,
        useHdr = true,
        exposure = 1.0,
        gamma = 2.2,
        clearColor = [51, 51, 51],
        toneMap = ToneMaps.LINEAR,
        debugOutput = DebugOutput.NONE)
    {
        this.useIBL = useIBL;
        this.usePunctual = usePunctual;
        this.useHdr = useHdr;
        this.exposure = exposure;
        this.gamma = gamma;
        this.clearColor = clearColor;
        this.toneMap = toneMap;
        this.debugOutput = debugOutput;

		this.updateEnvironment(environment);

        const OES_texture_float = gl.getExtension("OES_texture_float");
        const OES_texture_float_linear = gl.getExtension("OES_texture_float_linear");
        if ((!OES_texture_float || !OES_texture_float_linear) && this.useHdr)
        {
            this.useHdr = false;
            console.warn("Forcing to LDR rendering.");
        }
    }
	
	updateEnvironment(environment)
	{
        if (Environments.includes(environment))
        {
            this.environment = environment;
			this.environmentMipLevel = EnvironmentsMipLevel[Environments.indexOf(environment)];
        }
        else
        {
            console.warn("Environment '%s' is not supported.", environment);
            this.environment = Environments[0];
			this.environmentMipLevel = EnvironmentsMipLevel[0];
        }
	}
};

export { gltfRenderingParameters, Environments, ToneMaps, DebugOutput };
