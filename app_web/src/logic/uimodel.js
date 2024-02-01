import { Observable, merge, fromEvent } from 'rxjs';
import { map, filter, startWith, pluck, takeUntil, mergeMap, pairwise, share, tap } from 'rxjs/operators';
import { GltfState } from 'gltf-viewer-source';
import { SimpleDropzone } from 'simple-dropzone';
import { vec2 } from 'gl-matrix';
import normalizeWheel from 'normalize-wheel';

// this class wraps all the observables for the gltf sample viewer state
// the data streams coming out of this should match the data required in GltfState
// as close as possible
class UIModel
{
    constructor(app, modelPathProvider, environments) {
        this.app = app;

        this.app.models = modelPathProvider.getAllKeys();

        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        const modelURL = urlParams.get("model");


        this.scene = app.sceneChanged$.pipe(pluck("event", "msg"));
        this.camera = app.cameraChanged$.pipe(pluck("event", "msg"));
        this.environmentRotation = app.environmentRotationChanged$.pipe(pluck("event", "msg"));
        this.app.environments = environments;
        const selectedEnvironment = app.$watchAsObservable('selectedEnvironment').pipe(
            pluck('newValue'),
            map(environmentName => this.app.environments[environmentName].hdr_path)
        );
        const initialEnvironment = "footprint_court";
        this.app.selectedEnvironment = initialEnvironment;

        this.app.tonemaps = Object.keys(GltfState.ToneMaps).map((key) => ({title: GltfState.ToneMaps[key]}));
        this.tonemap = app.tonemapChanged$.pipe(
            pluck("event", "msg"),
            startWith(GltfState.ToneMaps.LINEAR)
        );

        this.app.debugchannels = Object.keys(GltfState.DebugOutput).map((key) => ({title: GltfState.DebugOutput[key]}));
        this.debugchannel = app.debugchannelChanged$.pipe(
            pluck("event", "msg"),
            startWith(GltfState.DebugOutput.NONE)
        );

        
        this.app.lods = Object.keys(GltfState.LoDs).map((key) => ({title: GltfState.LoDs[key]}));
        this.lod = app.lodChanged$.pipe(
            pluck("event", "msg"),
            startWith(GltfState.LoDs.Q0)
        );

        this.exposure = app.exposureChanged$.pipe(pluck("event", "msg"));
        this.skinningEnabled = app.skinningChanged$.pipe(pluck("event", "msg"));
        this.morphingEnabled = app.morphingChanged$.pipe(pluck("event", "msg"));
        this.clearcoatEnabled = app.clearcoatChanged$.pipe(pluck("event", "msg"));
        this.sheenEnabled = app.sheenChanged$.pipe(pluck("event", "msg"));
        this.transmissionEnabled = app.transmissionChanged$.pipe(pluck("event", "msg"));
        this.volumeEnabled = app.$watchAsObservable('volumeEnabled').pipe(pluck('newValue'));
        this.iorEnabled = app.$watchAsObservable('iorEnabled').pipe(pluck('newValue'));
        this.iridescenceEnabled = app.$watchAsObservable('iridescenceEnabled').pipe(pluck('newValue'));
        this.anisotropyEnabled = app.$watchAsObservable('anisotropyEnabled').pipe(pluck('newValue'));
        this.specularEnabled = app.$watchAsObservable('specularEnabled').pipe(pluck('newValue'));
        this.emissiveStrengthEnabled = app.$watchAsObservable('emissiveStrengthEnabled').pipe(pluck('newValue'));
        this.iblEnabled = app.iblChanged$.pipe(pluck("event", "msg"));
        this.iblIntensity = app.iblIntensityChanged$.pipe(pluck("event", "msg"));
        this.punctualLightsEnabled = app.punctualLightsChanged$.pipe(pluck("event", "msg"));
        this.renderEnvEnabled = app.$watchAsObservable('renderEnv').pipe(pluck('newValue'));
        this.blurEnvEnabled = app.blurEnvChanged$.pipe(pluck("event", "msg"));
        this.addEnvironment = app.$watchAsObservable('uploadedHDR').pipe(pluck('newValue'));
        this.captureCanvas = app.captureCanvas$.pipe(pluck('event'));
        this.loadHighQuality = app.loadHighQuality$.pipe(pluck('event'));
        this.cameraValuesExport = app.cameraExport$.pipe(pluck('event'));

        const initialClearColor = "#303542";
        this.app.clearColor = initialClearColor;
        this.clearColor = app.colorChanged$.pipe(
            filter(value => value.event !== undefined),
            pluck("event", "msg"),
            startWith(initialClearColor),
            map(hex => /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)),
            filter(color => color !== null),
            map(color => [
                parseInt(color[1], 16) / 255.0,
                parseInt(color[2], 16) / 255.0,
                parseInt(color[3], 16) / 255.0,
                1.0
            ])
        );

        this.animationPlay = app.animationPlayChanged$.pipe(pluck("event", "msg"));
        this.activeAnimations = app.$watchAsObservable('selectedAnimations').pipe(pluck('newValue'));

        const canvas = document.getElementById("canvas");
        canvas.addEventListener('dragenter', () => this.app.showDropDownOverlay = true);
        canvas.addEventListener('dragleave', () => this.app.showDropDownOverlay = false);

        const inputObservables = getInputObservables(canvas, this.app);


/*

        let dropdownGltfChanged = undefined;
        if (modelURL === null)
        {
            dropdownGltfChanged = app.modelChanged$.pipe(
                pluck("event", "msg"),
                startWith("glXFTest"),
                map(value => {
                    app.flavours = this.pathProvider.getModelFlavours(value);
                    app.selectedFlavour = app.flavours[0];
                    return this.pathProvider.resolve(value, app.selectedFlavour);
                }),
                map( value => ({mainFile: value, additionalFiles: undefined})),
            );
        } else {
            dropdownGltfChanged = app.modelChanged$.pipe(
                pluck("event", "msg"),
                map(value => {
                    app.flavours = this.pathProvider.getModelFlavours(value);
                    app.selectedFlavour =  app.flavours[0];
                    return this.pathProvider.resolve(value, app.selectedFlavour);
                }),
                map( value => ({mainFile: value, additionalFiles: undefined})),
            );
        }       

        const dropdownFlavourChanged = app.flavourChanged$.pipe(
            pluck("event", "msg"),
            map(value => {
                return this.pathProvider.resolve(app.selectedModel, value);
            }),
            map( value => ({mainFile: value, additionalFiles: undefined})),
        );
*/ 


        const dropdownGltfChanged = app.modelChanged$.pipe(
            pluck("event", "msg"),
            startWith(modelURL === null ? "DamagedHelmet" : null),
            filter(value => value !== null),
            map(value => {
                app.flavours = modelPathProvider.getModelFlavours(value);
                app.selectedFlavour = app.flavours[0]; 
                return modelPathProvider.resolve(value, app.selectedFlavour);
            }),
            map(value => ({mainFile: value})),
        );

        const dropdownFlavourChanged = app.flavourChanged$.pipe(
            pluck("event", "msg"),
            map(value => modelPathProvider.resolve(app.selectedModel, value)),
            map(value => ({mainFile: value})),
        );

        this.model = merge(dropdownGltfChanged, dropdownFlavourChanged, inputObservables.droppedGltf);
        this.hdr = merge(selectedEnvironment, this.addEnvironment, inputObservables.droppedHdr).pipe(
            startWith(environments[initialEnvironment].hdr_path)
        );

        merge(this.addEnvironment, inputObservables.droppedHdr)
            .subscribe(hdrPath => {
                this.app.environments[hdrPath.name] = {
                    title: hdrPath.name,
                    hdr_path: hdrPath,
                };
                this.app.selectedEnvironment = hdrPath.name;
            });

        this.variant = app.variantChanged$.pipe(pluck("event", "msg"));

        // remove last filename
        this.model
            .pipe(filter(() => this.app.models.at(-1) === this.lastDroppedFilename))
            .subscribe(() => {
                this.app.models.pop();
                this.lastDroppedFilename = undefined;
            });

        let droppedGLtfFileName = inputObservables.droppedGltf.pipe(map(droppedGltf => droppedGltf.mainFile.name));

        if (modelURL !== null) {
            const loadFromUrlObservable = new Observable(subscriber => subscriber.next({mainFile: modelURL}));
            droppedGLtfFileName = merge(droppedGLtfFileName, loadFromUrlObservable.pipe(map(data => data.mainFile)));
            this.model = merge(this.model, loadFromUrlObservable);
        }

        droppedGLtfFileName
            .pipe(filter(filename => filename !== undefined))
            .subscribe(filename => {
                filename = filename.split('/').pop();
                const fileExtension = filename.split('.').pop();
                filename = filename.substr(0, filename.lastIndexOf('.'));

                this.app.models.push(filename);
                this.app.selectedModel = filename;
                this.lastDroppedFilename = filename;

                app.flavours = [fileExtension];
                app.selectedFlavour = fileExtension;
            });

        this.orbit = inputObservables.orbit;
        this.pan = inputObservables.pan;
        this.zoom = inputObservables.zoom;
    }

    attachGltfLoaded(gltfLoaded)
    {
        this.attachCameraChangeObservable(gltfLoaded);
        gltfLoaded.subscribe(state => {
            const gltf = state.gltf;

            this.app.assetCopyright = gltf.asset.copyright ?? "N/A";
            this.app.assetGenerator = gltf.asset.generator ?? "N/A";
            
            this.app.selectedScene = state.sceneIndex;
            this.app.scenes = gltf.scenes.map((scene, index) => ({
                title: scene.name ?? `Scene ${index}`,
                index: index
            }));

            this.app.selectedAnimations = state.animationIndices;
 
            this.app.materialVariants = ["None", ...gltf?.variants.map(variant => variant.name)];
 
            this.app.setAnimationState(true);
            this.app.animations = gltf.animations.map((animation, index) => ({
                title: animation.name ?? `Animation ${index}`,
                index: index
            }));

            this.app.xmp = gltf?.extensions?.KHR_xmp_json_ld?.packets[gltf?.asset?.extensions?.KHR_xmp_json_ld.packet] ?? null;
        });
    }

    updateStatistics(statisticsUpdateObservable)
    {
        statisticsUpdateObservable.subscribe(
            data => this.app.statistics = {
                "Mesh Count": data.meshCount,
                "Triangle Count": data.faceCount,
                "Opaque Material Count": data.opaqueMaterialsCount,
                "Transparent Material Count": data.transparentMaterialsCount
            }
        );
    }

    disabledAnimations(disabledAnimationsObservable)
    {
        disabledAnimationsObservable.subscribe(data => this.app.disabledAnimations = data);
    }

    attachCameraChangeObservable(sceneChangeObservable)
    {
        const cameraIndices = sceneChangeObservable.pipe(
            map(state => {
                let gltf = state.gltf;
                let cameraIndices = [{title: "User Camera", index: -1}];
                if (gltf.scenes[state.sceneIndex] !== undefined)
                {
                    cameraIndices.push(...gltf.cameras.map( (camera, index) => {
                        if(gltf.scenes[state.sceneIndex].includesNode(gltf, camera.node))
                        {
                            let name = camera.name;
                            if(name === "" || name === undefined)
                            {
                                name = index;
                            }
                            return {title: name, index: index};
                        }
                    }));
                }
                cameraIndices = cameraIndices.filter(function(el) {
                    return el !== undefined;
                });
                return cameraIndices;
            })
        );
        cameraIndices.subscribe(cameras => this.app.cameras = cameras);
        const loadedCameraIndex = sceneChangeObservable.pipe(map(state => state.cameraIndex));
        loadedCameraIndex.subscribe(index => this.app.selectedCamera = index !== undefined ? index : -1 );
    }

    goToLoadingState() {
        this.app.goToLoadingState();
    }

    exitLoadingState()
    {
        this.app.exitLoadingState();
    }
}

const getInputObservables = (inputElement, app) => {
    const observables = {};

    const droppedFiles = new Observable(subscriber => {
        const dropZone = new SimpleDropzone(inputElement, inputElement);
        dropZone.on('drop', ({files}) => {
            app.showDropDownOverlay = false;
            subscriber.next(Array.from(files.values()));
        });
        dropZone.on('droperror', () => {
            app.showDropDownOverlay = false;
            subscriber.error();
        });
    }).pipe(share());

    // Partition files into a .gltf or .glb and additional files like buffers and textures
    observables.droppedGltf = droppedFiles.pipe(
        map((files) => {
            // consider subfolders later with webkitRelativePath

            let gltfxFile = files.find(  file  =>  file.name.endsWith(".gltfx") );
            if ( gltfxFile !== undefined) {
                // In case more than one gltfx file is dropped, use main.gltfx as main file
                let rootGLTFX = files.find( file  =>  file.name.endsWith("main.gltfx") );
                if (rootGLTFX !== undefined)
                {
                    gltfxFile = rootGLTFX;
                }
                const additionalFiles = files.filter( (file) => file !== gltfxFile);
                return {mainFile: gltfxFile, additionalFiles: additionalFiles};
            }

            const mainFile= files.find((file) =>  file.name.endsWith(".glb") ||  file.name.endsWith(".gltf"));
            const additionalFiles= files.filter(file => !file.name.endsWith(".glb") && !file.name.endsWith(".gltf"));
            return {mainFile: mainFile, additionalFiles: additionalFiles};
        }),
        filter(files => files.mainFile !== undefined),
    );

    observables.droppedHdr = droppedFiles.pipe(
        map((files) => {if(files.length!=1){return [];} else {return files;}}), // only accept exactly one hdr file
        map(files => files.find((file) => file.name.endsWith(".hdr"))),
        filter(file => file !== undefined),
        //pluck("1")
    );

    const mouseMove = fromEvent(document, 'mousemove');
    const mouseDown = fromEvent(inputElement, 'mousedown');
    const mouseUp = merge(fromEvent(document, 'mouseup'), fromEvent(document, 'mouseleave'));
    
    inputElement.addEventListener('mousemove', event => event.preventDefault());
    inputElement.addEventListener('mousedown', event => event.preventDefault());
    inputElement.addEventListener('mouseup', event => event.preventDefault());

    const mouseOrbit = mouseDown.pipe(
        filter(event => event.button === 0 && event.shiftKey === false),
        mergeMap(() => mouseMove.pipe(
            pairwise(),
            map( ([oldMouse, newMouse]) => {
                return {
                    deltaPhi: newMouse.pageX - oldMouse.pageX, 
                    deltaTheta: newMouse.pageY - oldMouse.pageY 
                };
            }),
            takeUntil(mouseUp)
        ))
    );

    const mousePan = mouseDown.pipe(
        filter( event => event.button === 1 || event.shiftKey === true),
        mergeMap(() => mouseMove.pipe(
            pairwise(),
            map( ([oldMouse, newMouse]) => {
                return {
                    deltaX: newMouse.pageX - oldMouse.pageX, 
                    deltaY: newMouse.pageY - oldMouse.pageY 
                };
            }),
            takeUntil(mouseUp)
        ))
    );

    const dragZoom = mouseDown.pipe(
        filter( event => event.button === 2),
        mergeMap(() => mouseMove.pipe(takeUntil(mouseUp))),
        map( mouse => ({deltaZoom: mouse.movementY}))
    );
    const wheelZoom = fromEvent(inputElement, 'wheel').pipe(
        map(wheelEvent => normalizeWheel(wheelEvent)),
        map(normalizedZoom => ({deltaZoom: normalizedZoom.spinY }))
    );
    inputElement.addEventListener('scroll', event => event.preventDefault(), { passive: false });
    inputElement.addEventListener('wheel', event => event.preventDefault(), { passive: false });
    const mouseZoom = merge(dragZoom, wheelZoom);

    const touchmove = fromEvent(document, 'touchmove');
    const touchstart = fromEvent(inputElement, 'touchstart');
    const touchend = merge(fromEvent(inputElement, 'touchend'), fromEvent(inputElement, 'touchcancel'));

    const touchOrbit = touchstart.pipe(
        filter(event => event.touches.length === 1),
        mergeMap(() => touchmove.pipe(
            filter(event => event.touches.length === 1),
            map(event => event.touches[0]),
            pairwise(),
            map(([oldTouch, newTouch]) => {
                return {
                    deltaPhi: 2.0 * (newTouch.clientX - oldTouch.clientX),
                    deltaTheta: 2.0 * (newTouch.clientY - oldTouch.clientY),
                };
            }),
            takeUntil(touchend)
        )),
    );

    const touchZoom = touchstart.pipe(
        filter(event => event.touches.length === 2),
        mergeMap(() => touchmove.pipe(
            filter(event => event.touches.length === 2),
            map(event => {
                const pos1 = vec2.fromValues(event.touches[0].clientX, event.touches[0].clientY);
                const pos2 = vec2.fromValues(event.touches[1].clientX, event.touches[1].clientY);
                return vec2.dist(pos1, pos2);
            }),
            pairwise(),
            map(([oldDist, newDist]) => ({ deltaZoom: 0.1 * (oldDist - newDist) })),
            takeUntil(touchend))
        ),
    );

    inputElement.addEventListener('ontouchmove', event => event.preventDefault(), { passive: false });
    inputElement.addEventListener('ontouchstart', event => event.preventDefault(), { passive: false });
    inputElement.addEventListener('ontouchend', event => event.preventDefault(), { passive: false });

    observables.orbit = merge(mouseOrbit, touchOrbit);
    observables.pan = mousePan;
    observables.zoom = merge(mouseZoom, touchZoom);

    // disable context menu
    inputElement.oncontextmenu = () => false;

    return observables;
};

export { UIModel };
