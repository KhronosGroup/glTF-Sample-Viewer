import { Observable, merge } from 'rxjs';
import { map, filter, startWith, pluck } from 'rxjs/operators';
import { glTF, ToneMaps, DebugOutput, getIsGltf, getIsGlb, getIsHdr} from 'gltf-viewer-source';

import { SimpleDropzone } from 'simple-dropzone';

// this class wraps all the observables for the gltf sample viewer state
// the data streams coming out of this should match the data required in GltfState
// as close as possible
class UIModel
{
    constructor(app, modelPathProvider)
    {
        this.app = app;
        this.pathProvider = modelPathProvider;

        this.app.models = this.pathProvider.getAllKeys();

        const dropdownGltfChanged = app.modelChanged$.pipe(
            pluck("event", "msg"),
            startWith("Avocado"),
            map(value => {
                return this.pathProvider.resolve(value);
            }),
            map( value => ({mainFile: value, additionalFiles: undefined})),
        );
        this.flavour = app.flavourChanged$.pipe(pluck("event", "msg")); // TODO gltfModelPathProvider needs to be changed to accept flavours explicitely
        this.scene = app.sceneChanged$.pipe(pluck("event", "msg"));
        this.camera = app.cameraChanged$.pipe(pluck("event", "msg"));
        this.environment = app.environmentChanged$.pipe(pluck("event", "msg"));
        this.environmentRotation = app.environmentRotationChanged$.pipe(pluck("event", "msg"));

        this.app.tonemaps = Object.keys(ToneMaps).map((key) => {
            return {title: ToneMaps[key]};
        });
        this.tonemap = app.tonemapChanged$.pipe(
            pluck("event", "msg"),
            startWith(ToneMaps.LINEAR)
        );

        this.app.debugchannels = Object.keys(DebugOutput).map((key) => {
            return {title: DebugOutput[key]};
        });
        this.debugchannel = app.debugchannelChanged$.pipe(
            pluck("event", "msg"),
            startWith(DebugOutput.NONE)
        );

        this.exposurecompensation = app.exposureChanged$.pipe(pluck("event", "msg"));
        this.skinningEnabled = app.skinningChanged$.pipe(pluck("event", "msg"));
        this.morphingEnabled = app.morphingChanged$.pipe(pluck("event", "msg"));
        this.clearcoatEnabled = app.clearcoatChanged$.pipe(pluck("event", "msg"));
        this.sheenEnabled = app.sheenChanged$.pipe(pluck("event", "msg"));
        this.transmissionEnabled = app.transmissionChanged$.pipe(pluck("event", "msg"));
        this.iblEnabled = app.iblChanged$.pipe(pluck("event", "msg"));
        this.punctualLightsEnabled = app.punctualLightsChanged$.pipe(pluck("event", "msg"));
        this.environmentEnabled = app.environmentVisibilityChanged$.pipe(pluck("event", "msg"));
        this.addEnvironment = app.addEnvironment$.pipe(map(() => {/* TODO Open file dialog */}));

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

        const inputObservables = UIModel.getInputObservables(document.getElementById("canvas"));
        this.model = merge(dropdownGltfChanged, inputObservables.gltfDropped);
        this.hdr = inputObservables.hdrDropped;

        this.variant = app.variantChanged$.pipe(pluck("event", "msg"));

        this.model.subscribe(() => {
            // remove last filename
            if(this.app.models[this.app.models.length -1] === this.lastDroppedFilename)
            {
                this.app.models.pop();
                this.lastDroppedFilename = undefined;
            }
        });

        const dropedFileName = inputObservables.gltfDropped.pipe(
            map( (data) => {
                return data.mainFile.name;
            })
        );
        dropedFileName.subscribe( (filename) => {
            if(filename !== undefined)
            {
                filename = filename.split('/').pop();
                filename = filename.substr(0, filename.lastIndexOf('.'));

                this.app.models.push(filename);
                this.app.selectedModel = filename;
                this.lastDroppedFilename = filename;
            }
        });
    }

    static getInputObservables(inputDomElement)
    {
        const observables = {};

        const simpleDropzoneObservabel = new Observable(subscriber => {
            const dropCtrl = new SimpleDropzone(inputDomElement, inputDomElement);
            dropCtrl.on('drop', ({files}) => {
                subscriber.next(files);
            });
            dropCtrl.on('droperror', () => {
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
                const mainFile = files.find( (file) => getIsGlb(file.name) || getIsGltf(file.name));
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
        return observables;
    }

    attachGltfLoaded(glTFLoadedStateObservable)
    {
        const gltfLoadedAndInit = glTFLoadedStateObservable.pipe(
            map( state => state.gltf ),
            startWith(new glTF())
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
    }

    updateStatistics(statisticsUpdateObservable)
    {
        statisticsUpdateObservable.subscribe(
            data => {this.app.statistics = [
                {title: "Mesh Count", value: data.meshCount},
                {title: "Triangle Count", value: data.faceCount},
                {title: "Opaque Material Count", value: data.opaqueMaterialsCount},
                {title: "Transparent Material Count", value: data.transparentMaterialsCount}
            ];
            }
        );
    }


    attachCameraChangeObservable(sceneChangeObservable)
    {
        const cameraIndices = sceneChangeObservable.pipe(
            map( (state) => {
                let gltf = state.gltf;
                let cameraIndices = [{title: "User Camera", index: -1}];
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
}

export { UIModel };
