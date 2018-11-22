class gltfRenderingParameters
{
    constructor(useIBL = true,
        usePunctual = false,
        useHdr = true,
        exposure = 1,
        toneMap = "Linear")
    {
        this.useIBL = useIBL;
        this.usePunctual = usePunctual;
        this.useHdr = useHdr;
        this.exposure = exposure;
        this.toneMap = toneMap;
    }
};
