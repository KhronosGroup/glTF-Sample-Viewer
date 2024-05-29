
import { GltfView } from 'gltf-viewer-source';

import { UIModel } from './logic/uimodel.js';
import { app } from './ui/ui.js';
import { from, merge } from 'rxjs';
import { mergeMap, map, share } from 'rxjs/operators';
import { GltfModelPathProvider, fillEnvironmentWithPaths } from './model_path_provider.js';
import { mat4, quat, vec3 } from 'gl-matrix';

export default async () => {
    const canvas = document.getElementById("canvas");
    const context = canvas.getContext("webgl2", { alpha: false, antialias: true });
    const view = new GltfView(context);
    const resourceLoader = view.createResourceLoader();
    const state = view.createState();
    state.renderingParameters.useDirectionalLightsWithDisabledIBL = true;

    const pathProvider = new GltfModelPathProvider('assets/models/Models/model-index.json');
    await pathProvider.initialize();
    const environmentPaths = fillEnvironmentWithPaths({
        "footprint_court": "Footprint Court",
        "pisa": "Pisa",
        "doge2": "Doge's palace",
        "ennis": "Dining room",
        "field": "Field",
        "helipad": "Helipad Goldenhour",
        "papermill": "Papermill Ruins",
        "neutral": "Studio Neutral",
        "Cannon_Exterior": "Cannon Exterior",
        "Colorful_Studio": "Colorful Studio",
        "Wide_Street" : "Wide Street",
    }, "assets/environments/");

    const uiModel = new UIModel(app, pathProvider, environmentPaths);

    // whenever a new model is selected, load it and when complete pass the loaded gltf
    // into a stream back into the UI
    const gltfLoaded = uiModel.model.pipe(
        mergeMap(model => {
            uiModel.goToLoadingState();

            // Workaround for errors in ktx lib after loading an asset with ktx2 files for the second time:
            resourceLoader.initKtxLib();

            return from(resourceLoader.loadAsset(model.mainFile, model.additionalFiles).then( (gltfPackage) => {
                state.parsedgltf = gltfPackage.parsedgltf;
                state.gltf = gltfPackage.gltf;
                const defaultScene = state.gltf.scene;
                state.sceneIndex = defaultScene === undefined ? 0 : defaultScene;
                state.cameraIndex = undefined;
                state.highlightedNodes = [];

                if (state.gltf.scenes.length != 0) {
                    if (state.sceneIndex > state.gltf.scenes.length - 1) {
                        state.sceneIndex = 0;
                    }
                    const scene = state.gltf.scenes[state.sceneIndex];
                    scene.applyTransformHierarchy(state);
                    state.userCamera.aspectRatio = canvas.width / canvas.height;
                    state.userCamera.fitViewToScene(state.gltf, state.sceneIndex);

                    // Try to start as many animations as possible without generating conficts.
                    state.animationIndices = [];
                    for (let i = 0; i < state.gltf.animations.length; i++) {
                        if (!state.gltf.nonDisjointAnimations(state.animationIndices).includes(i)) {
                            state.animationIndices.push(i);
                        }
                    }
                    state.animationTimer.start();
                }

                uiModel.exitLoadingState();

                return state;
            }));
        }),
        share()
    );

    uiModel.droppedGltf.subscribe((files => {
        state.files=files;
    }) 
    );

    // Disable all animations which are not disjoint to the current selection of animations.
    uiModel.disabledAnimations(uiModel.activeAnimations.pipe(map(animationIndices => state.gltf.nonDisjointAnimations(animationIndices))));

    const sceneChangedObservable = uiModel.scene.pipe(
        map(sceneIndex => {
            state.sceneIndex = sceneIndex;
            state.cameraIndex = undefined;
            const scene = state.gltf.scenes[state.sceneIndex];
            if (scene !== undefined)
            {
                scene.applyTransformHierarchy(state);
                state.userCamera.fitViewToScene(state.gltf, state.sceneIndex);
            }
        }),
        share()
    );

    const statisticsUpdateObservable = merge(sceneChangedObservable, gltfLoaded).pipe(map(() => view.gatherStatistics(state)));

    const cameraExportChangedObservable = uiModel.cameraValuesExport.pipe(map(() => {
        const camera = state.cameraIndex === undefined
            ? state.userCamera
            : state.gltf.cameras[state.cameraIndex];
        return camera.getDescription(state.gltf);
    }));

    const downloadDataURL = (filename, dataURL) => {
        const element = document.createElement('a');
        element.setAttribute('href', dataURL);
        element.setAttribute('download', filename);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    cameraExportChangedObservable.subscribe(cameraDesc => {
        const gltf = JSON.stringify(cameraDesc, undefined, 4);
        const dataURL = 'data:text/plain;charset=utf-8,' +  encodeURIComponent(gltf);
        downloadDataURL("camera.gltf", dataURL);
    });

    uiModel.captureCanvas.subscribe(() => {
        view.renderFrame(state, canvas.width, canvas.height);
        const dataURL = canvas.toDataURL();
        downloadDataURL("capture.png", dataURL);
    });
    

    // Only redraw glTF view upon user inputs, or when an animation is playing.
    let redraw = false;
    const listenForRedraw = stream => stream.subscribe(() => redraw = true);
    
    uiModel.loadHighQuality.subscribe(() => {
        resourceLoader.loadAssetIncrement(state.files.mainFile, state.files.additionalFiles, state.parsedgltf).then( (gltfPackage) => {
            console.log("increment loaded");
            state.gltf = gltfPackage.gltf;
            state.parsedgltf = gltfPackage.parsedgltf;
            redraw = true;
        }).catch((e)=>{console.log("error: "+e);});
    });

    uiModel.scene.subscribe(scene => state.sceneIndex = scene !== -1 ? scene : undefined);
    listenForRedraw(uiModel.scene);

    uiModel.camera.subscribe(camera => state.cameraIndex = camera !== -1 ? camera : undefined);
    listenForRedraw(uiModel.camera);

    uiModel.variant.subscribe(variant => state.variant = variant);
    listenForRedraw(uiModel.variant);

    uiModel.tonemap.subscribe(tonemap => state.renderingParameters.toneMap = tonemap);
    listenForRedraw(uiModel.tonemap);

    uiModel.debugchannel.subscribe(debugchannel => state.renderingParameters.debugOutput = debugchannel);
    listenForRedraw(uiModel.debugchannel);

    
    uiModel.lod.subscribe(lod => state.renderingParameters.LoD = lod);
    listenForRedraw(uiModel.lod);

    uiModel.skinningEnabled.subscribe(skinningEnabled => state.renderingParameters.skinning = skinningEnabled);
    listenForRedraw(uiModel.skinningEnabled);

    uiModel.exposure.subscribe(exposure => state.renderingParameters.exposure = (1.0 / Math.pow(2.0, exposure)));
    listenForRedraw(uiModel.exposure);

    uiModel.morphingEnabled.subscribe(morphingEnabled => state.renderingParameters.morphing = morphingEnabled);
    listenForRedraw(uiModel.morphingEnabled);

    uiModel.clearcoatEnabled.subscribe(clearcoatEnabled => state.renderingParameters.enabledExtensions.KHR_materials_clearcoat = clearcoatEnabled);
    listenForRedraw(uiModel.clearcoatEnabled);

    uiModel.sheenEnabled.subscribe(sheenEnabled => state.renderingParameters.enabledExtensions.KHR_materials_sheen = sheenEnabled);
    listenForRedraw(uiModel.sheenEnabled);

    uiModel.transmissionEnabled.subscribe(transmissionEnabled => state.renderingParameters.enabledExtensions.KHR_materials_transmission = transmissionEnabled);
    listenForRedraw(uiModel.transmissionEnabled);

    uiModel.volumeEnabled.subscribe(volumeEnabled => state.renderingParameters.enabledExtensions.KHR_materials_volume = volumeEnabled);
    listenForRedraw(uiModel.volumeEnabled);

    uiModel.iorEnabled.subscribe(iorEnabled => state.renderingParameters.enabledExtensions.KHR_materials_ior = iorEnabled);
    listenForRedraw(uiModel.iorEnabled);

    uiModel.iridescenceEnabled.subscribe(iridescenceEnabled => state.renderingParameters.enabledExtensions.KHR_materials_iridescence = iridescenceEnabled);
    listenForRedraw(uiModel.specularEnabled);

    uiModel.anisotropyEnabled.subscribe(anisotropyEnabled => state.renderingParameters.enabledExtensions.KHR_materials_anisotropy = anisotropyEnabled);
    listenForRedraw(uiModel.iridescenceEnabled);

    uiModel.specularEnabled.subscribe(specularEnabled => state.renderingParameters.enabledExtensions.KHR_materials_specular = specularEnabled);
    listenForRedraw(uiModel.anisotropyEnabled);

    uiModel.emissiveStrengthEnabled.subscribe(enabled => state.renderingParameters.enabledExtensions.KHR_materials_emissive_strength = enabled);
    listenForRedraw(uiModel.emissiveStrengthEnabled);

    uiModel.iblEnabled.subscribe(iblEnabled => state.renderingParameters.useIBL = iblEnabled);
    listenForRedraw(uiModel.iblEnabled);

    uiModel.iblIntensity.subscribe(iblIntensity => state.renderingParameters.iblIntensity = Math.pow(10, iblIntensity));
    listenForRedraw(uiModel.iblIntensity);

    uiModel.renderEnvEnabled.subscribe(renderEnvEnabled => state.renderingParameters.renderEnvironmentMap = renderEnvEnabled);
    listenForRedraw(uiModel.renderEnvEnabled);
    
    uiModel.blurEnvEnabled.subscribe(blurEnvEnabled => state.renderingParameters.blurEnvironmentMap = blurEnvEnabled);
    listenForRedraw(uiModel.blurEnvEnabled);

    uiModel.punctualLightsEnabled.subscribe(punctualLightsEnabled => state.renderingParameters.usePunctual = punctualLightsEnabled);
    listenForRedraw(uiModel.punctualLightsEnabled);

    uiModel.environmentRotation.subscribe(environmentRotation => {
        switch (environmentRotation) {
        case "+Z":
            state.renderingParameters.environmentRotation = 90.0;
            break;
        case "-X":
            state.renderingParameters.environmentRotation = 180.0;
            break;
        case "-Z":
            state.renderingParameters.environmentRotation = 270.0;
            break;
        case "+X":
            state.renderingParameters.environmentRotation = 0.0;
            break;
        }
    });
    listenForRedraw(uiModel.environmentRotation);


    uiModel.clearColor.subscribe(clearColor => state.renderingParameters.clearColor = clearColor);
    listenForRedraw(uiModel.clearColor);

    uiModel.animationPlay.subscribe(animationPlay => {
        if(animationPlay) {
            state.animationTimer.unpause();
        }
        else {
            state.animationTimer.pause();
        }
    });

    uiModel.activeAnimations.subscribe(animations => state.animationIndices = animations);
    listenForRedraw(uiModel.activeAnimations);

    uiModel.hdr.subscribe(hdrFile => {
        resourceLoader.loadEnvironment(hdrFile).then( (environment) => {
            state.environment = environment;
            // We need to wait until the environment is loaded to redraw
            redraw = true;
        });
    });

    uiModel.attachGltfLoaded(gltfLoaded);
    uiModel.updateStatistics(statisticsUpdateObservable);
    const sceneChangedStateObservable = uiModel.scene.pipe(map(() => state));
    uiModel.attachCameraChangeObservable(sceneChangedStateObservable);

    uiModel.orbit.subscribe( orbit => {
        if (state.cameraIndex === undefined) {
            state.userCamera.orbit(orbit.deltaPhi, orbit.deltaTheta);
        }
    });
    listenForRedraw(uiModel.orbit);

    uiModel.pan.subscribe( pan => {
        if (state.cameraIndex === undefined) {
            state.userCamera.pan(pan.deltaX, -pan.deltaY);
        }
    });
    listenForRedraw(uiModel.pan);

    uiModel.zoom.subscribe( zoom => {
        if (state.cameraIndex === undefined) {
            state.userCamera.zoomBy(zoom.deltaZoom);
        }
    });
    listenForRedraw(uiModel.zoom);

    let select = false;
    uiModel.selection.subscribe(selection => {
        const devicePixelRatio = window.devicePixelRatio || 1;
        state.pickingX = Math.floor(selection.x * devicePixelRatio);
        state.pickingY = Math.floor(selection.y * devicePixelRatio);
        state.triggerSelection = true;
        select = true;
    });
    listenForRedraw(uiModel.selection);

    let moveNode = false;
    uiModel.moveSelection.subscribe(selection => {
        const devicePixelRatio = window.devicePixelRatio || 1;
        state.pickingX = Math.floor(selection.x * devicePixelRatio);
        state.pickingY = Math.floor(selection.y * devicePixelRatio);
        state.triggerSelection = true;
        moveNode = true;
    });
    listenForRedraw(uiModel.moveSelection);

    const selectionCallback = (selectionInfo) => {
        if (state.highlightedNodes[0] === selectionInfo.node) {
            return;
        }
        if (selectionInfo.node === undefined) {
            state.highlightedNodes = [];
        } else if (moveNode && !select && state.highlightedNodes.length > 0) {
            const node = state.highlightedNodes[0];
            let targetNode = selectionInfo.node;
            while (targetNode.parentNode !== undefined && targetNode.extras?.asset === undefined) {
                targetNode = targetNode.parentNode;
            }
            if (targetNode.extras?.asset !== undefined) {
                selectionInfo.node = targetNode;
            }
            // Change parent
            if (selectionInfo.node !== node.parentNode) {
                selectionInfo.node.children.push(node.jsonArrayIndex);
                if (node.parentNode !== undefined) {
                    const childIndex = node.parentNode.children.indexOf(node.jsonArrayIndex);
                    node.parentNode.children.splice(childIndex, 1);
                    node.parentNode.changed = true;
                } else {
                    const currentScene = state.gltf.scenes[state.sceneIndex];
                    const childIndex = currentScene.nodes.indexOf(node.jsonArrayIndex);
                    currentScene.nodes.splice(childIndex, 1);
                }
                node.parentNode = selectionInfo.node;
                selectionInfo.node.changed = true;
            }

            const parentGlobalTransform = node.parentNode?.worldTransform ?? mat4.create();

            // Rotate onto normal
            const parentGlobalRotation = mat4.getRotation(quat.create(), parentGlobalTransform);
            const constUp = vec3.fromValues(0, 1, 0);
            const up = vec3.transformQuat(vec3.create(), constUp, parentGlobalRotation);
            const inverseParentWorldRotation = quat.invert(quat.create(), parentGlobalRotation);
            const normal = vec3.transformQuat(vec3.create(), selectionInfo.normal, inverseParentWorldRotation);
            const angle = vec3.angle(up, normal);
            const axis = vec3.cross(vec3.create(), up, normal);
            const rotation = quat.create();
        

            // Handle 180 degree rotations
            if (vec3.length(axis) < 0.0001 && angle > 3.14) {
                const right = vec3.transformQuat(vec3.create(), vec3.fromValues(1, 0, 0), parentGlobalRotation);
                quat.setAxisAngle(rotation, right, angle);
            } else {
                quat.setAxisAngle(rotation, axis, angle);
            }


            // Add rotation around up from model
            const localAngle = quat.getAxisAngle(constUp, node.initialRotation);
            const localRotation = quat.setAxisAngle(quat.create(), normal, localAngle);
            quat.multiply(rotation, rotation, localRotation);
            node.rotation = rotation;
            
            // Set position
            const parentGlobalPosition = mat4.getTranslation(vec3.create(), parentGlobalTransform);
            const localTranslation = vec3.subtract(vec3.create(), selectionInfo.position, parentGlobalPosition);
            node.translation = vec3.transformQuat(localTranslation, localTranslation, inverseParentWorldRotation);
            
            node.changed = true;
            moveNode = false;
            update();
        } else if (select) {
            let assetNode = selectionInfo.node;
            while (assetNode.parentNode !== undefined && assetNode.extras?.asset === undefined) {
                assetNode = assetNode.parentNode;
            }
            if (assetNode.extras?.asset !== undefined) {
                selectionInfo.node = assetNode;
            }
            const selection = [selectionInfo.node];
            const getAllChildren = (node) => {
                if (node.children !== undefined) {
                    for (const childIdx of node.children) {
                        const child = state.gltf.nodes[childIdx];
                        selection.push(child);
                        getAllChildren(child);
                    }
                }
            };
            // Select all child nodes
            getAllChildren(selectionInfo.node);

            state.highlightedNodes = selection;
            select = false;
        }
        redraw = true;
    };

    state.selectionCallback = selectionCallback;

    // configure the animation loop
    const past = {};
    const update = () => {
        const devicePixelRatio = window.devicePixelRatio || 1;

        // set the size of the drawingBuffer based on the size it's displayed.
        canvas.width = Math.floor(canvas.clientWidth * devicePixelRatio);
        canvas.height = Math.floor(canvas.clientHeight * devicePixelRatio);
        redraw |= !state.animationTimer.paused && state.animationIndices.length > 0;
        redraw |= past.width != canvas.width || past.height != canvas.height;
        past.width = canvas.width;
        past.height = canvas.height;
        
        if (redraw) {
            redraw = false;
            view.renderFrame(state, canvas.width, canvas.height);
        }

        window.requestAnimationFrame(update);
    };

    // After this start executing animation loop.
    window.requestAnimationFrame(update);
};
