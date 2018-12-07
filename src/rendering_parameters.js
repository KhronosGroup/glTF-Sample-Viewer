const ToneMaps =
{
    linear: "Linear" ,
    uncharted: "Uncharted 2" ,
    hejlRichard: "Hejl Richard"
};

const DebugOutput =
{
    none: "None",
    metallic: "Metallic",
    roughness: "Roughness",
    normal: "Normal",
    baseColor: "Base Color",
    occlusion: "Occlusion",
    emisive: "Emissive",
    alpha: "Alpha",
    f0: "F0"
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
        toneMap = ToneMaps.linear,
        debugOutput = DebugOutput.none)
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
