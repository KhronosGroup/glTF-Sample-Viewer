const ToneMaps =
{
    linear: "Linear" ,
    uncharted: "Uncharted 2" ,
    hejlRichard: "Hejl Richard"
};

class gltfRenderingParameters
{
    constructor(useIBL = true,
        usePunctual = false,
        useHdr = true,
        exposure = 1,
        toneMap = ToneMaps.linear)
    {
        this.useIBL = useIBL;
        this.usePunctual = usePunctual;
        this.useHdr = useHdr;
        this.exposure = exposure;
        this.toneMap = toneMap;
    }
};
