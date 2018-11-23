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
    baseColor: "BaseColor",
    occlusion: "Occlusion",
    emisive: "Emissive",
    f0: "F0"
};

class gltfRenderingParameters
{
    constructor(useIBL = true,
        usePunctual = false,
        useHdr = true,
        exposure = 1.0,
        gamma = 2.2,
        toneMap = ToneMaps.linear,
        debugOutput = DebugOutput.none)
    {
        this.useIBL = useIBL;
        this.usePunctual = usePunctual;
        this.useHdr = useHdr;
        this.exposure = exposure;
        this.gamma = gamma;
        this.toneMap = toneMap;
        this.debugOutput = debugOutput;
    }
};
