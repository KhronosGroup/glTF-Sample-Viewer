import { Observable, merge, fromEvent } from 'rxjs';
import { map, filter, startWith, pluck, takeUntil, mergeMap, pairwise } from 'rxjs/operators';
import { GltfState } from 'gltf-viewer-source';

import { SimpleDropzone } from 'simple-dropzone';
import { vec2 } from 'gl-matrix';

import normalizeWheel from 'normalize-wheel';

// this class wraps all the observables for the gltf sample viewer state
// the data streams coming out of this should match the data required in GltfState
// as close as possible
class UIModel
{
    constructor(app, modelPathProvider, environments)
    {
        this.app = app;
        this.pathProvider = modelPathProvider;

        this.app.models = this.pathProvider.getAllKeys();

        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        const modelURL = urlParams.get("model");

        let dropdownGltfChanged = undefined;
        if (modelURL === null)
        {
            dropdownGltfChanged = app.modelChanged$.pipe(
                pluck("event", "msg"),
                startWith("DamagedHelmet"),
                map(value => {
                    app.flavours = this.pathProvider.getModelFlavours(value);
                    app.selectedFlavour = "glTF";
                    return this.pathProvider.resolve(value, app.selectedFlavour);
                }),
                map( value => ({mainFile: value, additionalFiles: undefined})),
            );
        } else {
            dropdownGltfChanged = app.modelChanged$.pipe(
                pluck("event", "msg"),
                map(value => {
                    app.flavours = this.pathProvider.getModelFlavours(value);
                    app.selectedFlavour = "glTF";
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

        this.scene = app.sceneChanged$.pipe(pluck("event", "msg"));
        this.camera = app.cameraChanged$.pipe(pluck("event", "msg"));
        this.environmentRotation = app.environmentRotationChanged$.pipe(pluck("event", "msg"));
        this.app.environments = environments;
        const selectedEnvironment = app.$watchAsObservable('selectedEnvironment').pipe(
            pluck('newValue'),
            map( environmentName => this.app.environments[environmentName].hdr_path)
        );
        const initialEnvironment = "footprint_court";
        this.app.selectedEnvironment = initialEnvironment;

        this.app.tonemaps = Object.keys(GltfState.ToneMaps).map((key) => {
            return {title: GltfState.ToneMaps[key]};
        });
        this.tonemap = app.tonemapChanged$.pipe(
            pluck("event", "msg"),
            startWith(GltfState.ToneMaps.LINEAR)
        );

        this.app.debugchannels = Object.keys(GltfState.DebugOutput).map((key) => {
            return {title: GltfState.DebugOutput[key]};
        });
        this.debugchannel = app.debugchannelChanged$.pipe(
            pluck("event", "msg"),
            startWith(GltfState.DebugOutput.NONE)
        );

        this.exposure = app.exposureChanged$.pipe(pluck("event", "msg"));
        this.skinningEnabled = app.skinningChanged$.pipe(pluck("event", "msg"));
        this.morphingEnabled = app.morphingChanged$.pipe(pluck("event", "msg"));
        this.clearcoatEnabled = app.clearcoatChanged$.pipe(pluck("event", "msg"));
        this.sheenEnabled = app.sheenChanged$.pipe(pluck("event", "msg"));
        this.transmissionEnabled = app.transmissionChanged$.pipe(pluck("event", "msg"));
        this.volumeEnabled = app.$watchAsObservable('volumeEnabled').pipe(
                                            map( ({ newValue, oldValue }) => newValue));
        this.iorEnabled = app.$watchAsObservable('iorEnabled').pipe(
                                            map( ({ newValue, oldValue }) => newValue));
        this.iridescenceEnabled = app.$watchAsObservable('iridescenceEnabled').pipe(
                                            map( ({ newValue, oldValue }) => newValue));
        this.specularEnabled = app.$watchAsObservable('specularEnabled').pipe(
                                            map( ({ newValue, oldValue }) => newValue));
        this.emissiveStrengthEnabled = app.$watchAsObservable('emissiveStrengthEnabled').pipe(
                                            map( ({ newValue, oldValue }) => newValue));
        this.iblEnabled = app.iblChanged$.pipe(pluck("event", "msg"));
        this.iblIntensity = app.iblIntensityChanged$.pipe(pluck("event", "msg"));
        this.punctualLightsEnabled = app.punctualLightsChanged$.pipe(pluck("event", "msg"));
        this.renderEnvEnabled = app.$watchAsObservable('renderEnv').pipe(
                                            map( ({ newValue, oldValue }) => newValue));
        this.blurEnvEnabled = app.blurEnvChanged$.pipe(pluck("event", "msg"));
        this.addEnvironment = app.$watchAsObservable('uploadedHDR').pipe(
            pluck('newValue')
        );
        this.captureCanvas = app.captureCanvas$.pipe(pluck('event'));
        this.cameraValuesExport = app.cameraExport$.pipe(pluck('event'));

        const initialClearColor = "#303542";
        this.app.clearColor = initialClearColor;
        this.clearColor = app.colorChanged$.pipe(
            filter(value => value.event !== undefined),
            pluck("event", "msg"),
            startWith(initialClearColor),
            map(hex => {
                // convert hex string to rgb values
                var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                return result ? [
                    parseInt(result[1], 16),
                    parseInt(result[2], 16),
                    parseInt(result[3], 16),
                    255
                ] : null;
            })
        );

        this.animationPlay = app.animationPlayChanged$.pipe(pluck("event", "msg"));
        this.activeAnimations = app.$watchAsObservable('selectedAnimations').pipe(
            map( ({ newValue, oldValue }) => newValue)
        );

        const canvas = document.getElementById("canvas");
        this.registerDropZoneUIHandle(canvas);
        const inputObservables = UIModel.getInputObservables(canvas, this.app);
        this.model = merge(dropdownGltfChanged, dropdownFlavourChanged, inputObservables.gltfDropped);
        this.hdr = merge(inputObservables.hdrDropped, selectedEnvironment, this.addEnvironment).pipe(
            startWith(environments[initialEnvironment].hdr_path)
        );

        const hdrUIChange = merge(inputObservables.hdrDropped, this.addEnvironment);
        hdrUIChange.subscribe( hdrPath => {
            this.app.environments[hdrPath.name] = {
                title: hdrPath.name,
                hdr_path: hdrPath,
            };
            this.app.selectedEnvironment = hdrPath.name;
        });

        this.variant = app.variantChanged$.pipe(pluck("event", "msg"));

        this.model.subscribe(() => {
            // remove last filename
            if(this.app.models[this.app.models.length -1] === this.lastDroppedFilename)
            {
                this.app.models.pop();
                this.lastDroppedFilename = undefined;
            }
        });

        let dropedGLtfFileName = inputObservables.gltfDropped.pipe(
            map( (data) => {
                return data.mainFile.name;
            })
        );

        if (modelURL !== null){
            let loadFromUrlObservable = new Observable(subscriber => { subscriber.next({mainFile: modelURL, additionalFiles: undefined});});
            dropedGLtfFileName = merge(dropedGLtfFileName, loadFromUrlObservable.pipe(map((data) => {return data.mainFile;} )));
            this.model = merge(this.model, loadFromUrlObservable);
        }

        dropedGLtfFileName.subscribe( (filename) => {
            if(filename !== undefined)
            {
                filename = filename.split('/').pop();
                let fileExtension = filename.split('.').pop();;
                filename = filename.substr(0, filename.lastIndexOf('.'));

                this.app.models.push(filename);
                this.app.selectedModel = filename;
                this.lastDroppedFilename = filename;

                app.flavours = [fileExtension];
                app.selectedFlavour = fileExtension;
            }
        });

        this.orbit = inputObservables.orbit;
        this.pan = inputObservables.pan;
        this.zoom = inputObservables.zoom;
    }

    // app has to be the vuejs app instance
    static getInputObservables(inputDomElement, app)
    {
        const observables = {};

        const simpleDropzoneObservabel = new Observable(subscriber => {
            const dropCtrl = new SimpleDropzone(inputDomElement, inputDomElement);
            dropCtrl.on('drop', ({files}) => {
                app.showDropDownOverlay = false;
                subscriber.next(files);
            });
            dropCtrl.on('droperror', () => {
                app.showDropDownOverlay = false;
                subscriber.error();
            });
        });
        observables.filesDropped = simpleDropzoneObservabel.pipe(
            map(files => Array.from(files.values()))
        );

        observables.gltfDropped = observables.filesDropped.pipe(
            // filter out any non .gltf or .glb files

            map( (files) => {
                // restructure the data by separating mainFile (gltf/glb) from additionalFiles
                const mainFile = files.find( (file) => file.name.endsWith(".glb") || file.name.endsWith(".gltf"));
                const additionalFiles = files.filter( (file) => file !== mainFile);
                return {mainFile: mainFile, additionalFiles: additionalFiles};
            }),
            filter(files => files.mainFile !== undefined),
        );
        observables.hdrDropped = observables.filesDropped.pipe(
            map( (files) => {
                // extract only the hdr file from the stream of files
                return files.find( (file) => file.name.endsWith(".hdr"));
            }),
            filter(file => file !== undefined),
        );

        const mouseMove = fromEvent(document, 'mousemove');
        const mouseDown = fromEvent(inputDomElement, 'mousedown');
        const mouseUp = merge(fromEvent(document, 'mouseup'), fromEvent(document, 'mouseleave'));
        
        inputDomElement.addEventListener('mousemove', event => event.preventDefault());
        inputDomElement.addEventListener('mousedown', event => event.preventDefault());
        inputDomElement.addEventListener('mouseup', event => event.preventDefault());

        const mouseOrbit = mouseDown.pipe(
            filter( event => event.button === 0 && event.shiftKey === false),
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

        const smbZoom = mouseDown.pipe(
            filter( event => event.button === 2),
            mergeMap(() => mouseMove.pipe(takeUntil(mouseUp))),
            map( mouse => ({deltaZoom: mouse.movementY }))
        );
        const wheelZoom = fromEvent(inputDomElement, 'wheel').pipe(
            map(wheelEvent => normalizeWheel(wheelEvent)),
            map(normalizedZoom => ({deltaZoom: normalizedZoom.spinY }))
        );
        inputDomElement.addEventListener('scroll', event => event.preventDefault(), { passive: false });
        inputDomElement.addEventListener('wheel', event => event.preventDefault(), { passive: false });
        const mouseZoom = merge(smbZoom, wheelZoom);

        const touchmove = fromEvent(document, 'touchmove');
        const touchstart = fromEvent(inputDomElement, 'touchstart');
        const touchend = merge(fromEvent(inputDomElement, 'touchend'), fromEvent(inputDomElement, 'touchcancel'));

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

        inputDomElement.addEventListener('ontouchmove', event => event.preventDefault(), { passive: false });
        inputDomElement.addEventListener('ontouchstart', event => event.preventDefault(), { passive: false });
        inputDomElement.addEventListener('ontouchend', event => event.preventDefault(), { passive: false });

        observables.orbit = merge(mouseOrbit, touchOrbit);
        observables.pan = mousePan;
        observables.zoom = merge(mouseZoom, touchZoom);

        // disable context menu
        inputDomElement.oncontextmenu = () => false;

        return observables;
    }

    registerDropZoneUIHandle(inputDomElement)
    {
        const self = this;
        inputDomElement.addEventListener('dragenter', function(event) {
            self.app.showDropDownOverlay = true;
        });
        inputDomElement.addEventListener('dragleave', function(event) {
            self.app.showDropDownOverlay = false;
        });
    }

    attachGltfLoaded(glTFLoadedStateObservable)
    {
        const gltfLoadedAndInit = glTFLoadedStateObservable.pipe(
            map( state => state.gltf )
        );

        // update scenes
        const sceneIndices = gltfLoadedAndInit.pipe(
            map( (gltf) => {
                return gltf.scenes.map( (scene, index) => {
                    let name = scene.name;
                    if(name === "" || name === undefined)
                    {
                        name = index;
                    }
                    return {title: name, index: index};
                });
            })
        );
        sceneIndices.subscribe( (scenes) => {
            this.app.scenes = scenes;
        });

        const loadedSceneIndex = glTFLoadedStateObservable.pipe(
            map( (state) => state.sceneIndex)
        );
        loadedSceneIndex.subscribe( (scene) => {
            this.app.selectedScene = scene;
        });

        // update cameras
        this.attachCameraChangeObservable(glTFLoadedStateObservable);

        const variants = gltfLoadedAndInit.pipe(
            map( (gltf) => {
                if(gltf.variants !== undefined)
                {
                    return gltf.variants.map( (variant, index) => {
                        return {title: variant.name};
                    });
                }
                return [];
            }),
            map(variants => {
                // Add a "None" variant to the beginning
                variants.unshift({title: "None"});
                return variants;
            })
        );
        variants.subscribe( (variants) => {
            this.app.materialVariants = variants;
        });

        gltfLoadedAndInit.subscribe(
            (_) => {this.app.setAnimationState(true);
            }
        );

        const xmpData = gltfLoadedAndInit.pipe(
            map( (gltf) => {
                if(gltf.extensions !== undefined && gltf.extensions.KHR_xmp_json_ld !== undefined)
                {
                    if(gltf.asset.extensions !== undefined && gltf.asset.extensions.KHR_xmp_json_ld !== undefined)
                    {
                        let xmpPacket = gltf.extensions.KHR_xmp_json_ld.packets[gltf.asset.extensions.KHR_xmp_json_ld.packet];
                        return xmpPacket;
                    }
                }
                return [];
            })
        );
        xmpData.subscribe( (xmpData) => {
            this.app.xmp = xmpData;
        });

        const animations = gltfLoadedAndInit.pipe(
            map( gltf =>  gltf.animations.map( (anim, index) => {
                let name = anim.name;
                if (name === undefined || name === "")
                {
                    name = index;
                }
                return {
                    title: name,
                    index: index
                };
            }))
        );
        animations.subscribe( animations => {
            this.app.animations = animations;
        });

        glTFLoadedStateObservable.pipe(
            map( state => state.animationIndices)
        ).subscribe( animationIndices => {
            this.app.selectedAnimations = animationIndices;
        });
    }

    updateStatistics(statisticsUpdateObservable)
    {
        statisticsUpdateObservable.subscribe(
            data => {
                let statistics = {};
                statistics["Mesh Count"] = data.meshCount;
                statistics["Triangle Count"] = data.faceCount;
                statistics["Opaque Material Count"] = data.opaqueMaterialsCount;
                statistics["Transparent Material Count"] = data.transparentMaterialsCount;
                this.app.statistics = statistics;
            }
        );
    }

    disabledAnimations(disabledAnimationsObservable)
    {
        disabledAnimationsObservable.subscribe(
            data => { this.app.disabledAnimations = data; }
        );
    }

    attachCameraChangeObservable(sceneChangeObservable)
    {
        const cameraIndices = sceneChangeObservable.pipe(
            map( (state) => {
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
        cameraIndices.subscribe( (cameras) => {
            this.app.cameras = cameras;
        });
        const loadedCameraIndex = sceneChangeObservable.pipe(
            map( (state) => {
                return state.cameraIndex;
            })
        );
        loadedCameraIndex.subscribe( index => {
            if(index ===  undefined)
            {
                index = -1;
            }
            this.app.selectedCamera = index;
        });
    }

    copyToClipboard(text) {
        var dummy = document.createElement("textarea");
        document.body.appendChild(dummy);
        dummy.value = text;
        dummy.select();
        document.execCommand("copy");
        document.body.removeChild(dummy);
    }

    goToLoadingState() {
        this.app.goToLoadingState();
    }
    exitLoadingState()
    {
        this.app.exitLoadingState();
    }
}

export { UIModel };
