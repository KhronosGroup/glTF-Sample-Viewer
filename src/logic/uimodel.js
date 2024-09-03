import { Observable, merge, fromEvent } from 'rxjs';
import { map, filter, startWith, pluck, takeUntil, mergeMap, pairwise, share } from 'rxjs/operators';
import { GltfState } from '@khronosgroup/gltf-viewer';
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

        this.scene = app.sceneChanged.pipe();
        this.camera = app.cameraChanged.pipe();
        this.environmentRotation = app.environmentRotationChanged.pipe();
        this.app.environments = environments;
        const selectedEnvironment = app.selectedEnvironmentChanged.pipe(
            map(environmentName => this.app.environments[environmentName].hdr_path)
        );
        const initialEnvironment = "Cannon_Exterior";
        this.app.selectedEnvironment = initialEnvironment;

        this.app.tonemaps = Object.keys(GltfState.ToneMaps).map((key) => ({title: GltfState.ToneMaps[key]}));
        this.tonemap = app.tonemapChanged.pipe(
            startWith(GltfState.ToneMaps.KHR_PBR_NEUTRAL)
        );

        this.app.debugchannels = Object.keys(GltfState.DebugOutput).map((key) => ({title: GltfState.DebugOutput[key]}));
        this.debugchannel = app.debugchannelChanged.pipe(
            startWith(GltfState.DebugOutput.NONE)
        );

        this.exposure = app.exposureChanged.pipe();
        this.skinningEnabled = app.skinningChanged.pipe();
        this.morphingEnabled = app.morphingChanged.pipe();
        this.clearcoatEnabled = app.clearcoatChanged.pipe();
        this.sheenEnabled = app.sheenChanged.pipe();
        this.transmissionEnabled = app.transmissionChanged.pipe();
        this.diffuseTransmissionEnabled = app.diffuseTransmissionChanged.pipe();
        this.volumeEnabled = app.volumeChanged.pipe();
        this.iorEnabled = app.iorChanged.pipe();
        this.iridescenceEnabled = app.iridescenceChanged.pipe();
        this.anisotropyEnabled = app.anisotropyChanged.pipe();
        this.dispersionEnabled = app.dispersionChanged.pipe();
        this.specularEnabled = app.specularChanged.pipe();
        this.emissiveStrengthEnabled = app.emissiveStrengthChanged.pipe();
        this.iblEnabled = app.iblChanged.pipe();
        this.iblIntensity = app.iblIntensityChanged.pipe();
        this.punctualLightsEnabled = app.punctualLightsChanged.pipe();
        this.renderEnvEnabled = app.renderEnvChanged.pipe();
        this.blurEnvEnabled = app.blurEnvChanged.pipe();
        this.addEnvironment = app.addEnvironmentChanged.pipe();
        this.captureCanvas = app.captureCanvas.pipe();
        this.cameraValuesExport = app.cameraExport.pipe();

        const initialClearColor = "#303542";
        this.app.clearColor = initialClearColor;
        this.clearColor = app.colorChanged.pipe(
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

        this.animationPlay = app.animationPlayChanged.pipe();
        this.activeAnimations = app.selectedAnimationsChanged.pipe();

        const canvas = document.getElementById("canvas");
        canvas.addEventListener('dragenter', () => this.app.showDropDownOverlay = true);
        canvas.addEventListener('dragleave', () => this.app.showDropDownOverlay = false);

        const inputObservables = getInputObservables(canvas, this.app);

        const dropdownGltfChanged = app.modelChanged.pipe(
            startWith(modelURL === null ? "DamagedHelmet" : null),
            filter(value => value !== null),
            map(value => {
                app.flavours = modelPathProvider.getModelFlavours(value);
                if (app.flavours.includes("glTF")){
                    app.selectedFlavour = "glTF";
                } else {
                    app.selectedFlavour = app.flavours[0];
                }
                return modelPathProvider.resolve(value, app.selectedFlavour);
            }),
            map(value => ({mainFile: value})),
        );

        const dropdownFlavourChanged = app.flavourChanged.pipe(
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

        this.variant = app.variantChanged.pipe();

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

            if (gltf && gltf.variants) {
                this.app.materialVariants = ["None", ...gltf.variants.map(variant => variant.name)];
            } else {
                this.app.materialVariants = ["None"];
            }

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

    updateValidationReport(validationReportObservable)
    {
        validationReportObservable.subscribe(data => this.app.validationReport = data);
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
            subscriber.next(Array.from(files.entries()));
        });
        dropZone.on('droperror', () => {
            app.showDropDownOverlay = false;
            subscriber.error();
        });
    }).pipe(share());

    // Partition files into a .gltf or .glb and additional files like buffers and textures
    observables.droppedGltf = droppedFiles.pipe(
        map(files => ({
            mainFile: files.find(([path]) => path.endsWith(".glb") || path.endsWith(".gltf")),
            additionalFiles: files.filter(file => !file[0].endsWith(".glb") && !file[0].endsWith(".gltf"))
        })),
        filter(files => files.mainFile !== undefined),
    );

    observables.droppedHdr = droppedFiles.pipe(
        map(files => files.find(([path]) => path.endsWith(".hdr"))),
        filter(file => file !== undefined),
        pluck("1")
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
