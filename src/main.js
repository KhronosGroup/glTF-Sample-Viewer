import { GltfView } from "@khronosgroup/gltf-viewer";

import { UIModel } from "./logic/uimodel.js";
import { app } from "./ui/ui.js";
import { EMPTY, from, merge } from "rxjs";
import { mergeMap, map, share, catchError } from "rxjs/operators";
import {
    GltfModelPathProvider,
    fillEnvironmentWithPaths,
} from "./model_path_provider.js";

import {validateBytes} from "gltf-validator";

export default async () => {
    const canvas = document.getElementById("canvas");
    const context = canvas.getContext("webgl2", {
        alpha: false,
        antialias: true,
    });
    const view = new GltfView(context);
    const resourceLoader = view.createResourceLoader();
    const state = view.createState();
    state.renderingParameters.useDirectionalLightsWithDisabledIBL = true;

    const pathProvider = new GltfModelPathProvider(
        "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main"
    );
    await pathProvider.initialize();
    const environmentPaths = fillEnvironmentWithPaths(
        {
            Cannon_Exterior: "Cannon Exterior",
            footprint_court: "Footprint Court",
            pisa: "Pisa",
            doge2: "Doge's palace",
            ennis: "Dining room",
            field: "Field",
            helipad: "Helipad Goldenhour",
            papermill: "Papermill Ruins",
            neutral: "Studio Neutral",
            Colorful_Studio: "Colorful Studio",
            Wide_Street: "Wide Street",
        },
        "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Environments/low_resolution_hdrs/"
    );

    const uiModel = new UIModel(app, pathProvider, environmentPaths);


    const validation = uiModel.model.pipe(
        mergeMap((model) => {
            const func = async(model) => {
                try {
                    const fileType = typeof model.mainFile;
                    if (fileType == "string"){
                        const externalRefFunction = (uri) => {
                            const parent = model.mainFile.substring(0, model.mainFile.lastIndexOf("/") + 1);
                            return new Promise((resolve, reject) => {
                                fetch(parent + uri).then(response => {
                                    response.arrayBuffer().then(buffer => {
                                        resolve(new Uint8Array(buffer));
                                    }).catch(error => {
                                        reject(error);
                                    });
                                }).catch(error => {
                                    reject(error);
                                });
                            });
                        };
                        const response = await fetch(model.mainFile);
                        const buffer = await response.arrayBuffer();
                        return await validateBytes(new Uint8Array(buffer), {
                            externalResourceFunction: externalRefFunction,
                            uri: model.mainFile
                        });
                    } else if (Array.isArray(model.mainFile)) {
                        const externalRefFunction = (uri) => {
                            uri = "/" + uri;
                            return new Promise((resolve, reject) => {
                                let foundFile = undefined;
                                for (let i = 0; i < model.additionalFiles.length; i++) {
                                    const file = model.additionalFiles[i];
                                    if (file[0] == uri) {
                                        foundFile = file[1];
                                        break;
                                    }
                                }
                                if (foundFile) {
                                    foundFile.arrayBuffer().then((buffer) => {
                                        resolve(new Uint8Array(buffer));
                                    }).catch((error) => {
                                        reject(error);
                                    });
                                } else {
                                    reject("File not found");
                                }
                            });
                        };

                        const buffer = await model.mainFile[1].arrayBuffer();
                        return await validateBytes(new Uint8Array(buffer),
                            {externalResourceFunction: externalRefFunction, uri: model.mainFile[0]});
                    }
                } catch (error) {
                    console.error(error);
                }
            };
            return from(func(model)).pipe(catchError((error) => { console.error(`Validation failed: ${error}`); return EMPTY; }));
        })
    );

    // whenever a new model is selected, load it and when complete pass the loaded gltf
    // into a stream back into the UI
    const gltfLoaded = uiModel.model.pipe(
        mergeMap((model) => {
            uiModel.goToLoadingState();

            // Workaround for errors in ktx lib after loading an asset with ktx2 files for the second time:
            resourceLoader.initKtxLib();

            return from(
                resourceLoader
                    .loadGltf(model.mainFile, model.additionalFiles)
                    .then((gltf) => {
                        state.gltf = gltf;
                        const defaultScene = state.gltf.scene;
                        state.sceneIndex = defaultScene === undefined ? 0 : defaultScene;
                        state.cameraIndex = undefined;

                        if (state.gltf.scenes.length != 0) {
                            if (state.sceneIndex > state.gltf.scenes.length - 1) {
                                state.sceneIndex = 0;
                            }
                            const scene = state.gltf.scenes[state.sceneIndex];
                            scene.applyTransformHierarchy(state.gltf);
                            state.userCamera.perspective.aspectRatio = canvas.width / canvas.height;
                            state.userCamera.resetView(state.gltf, state.sceneIndex);

                            // Try to start as many animations as possible without generating conficts.
                            state.animationIndices = [];
                            for (let i = 0; i < gltf.animations.length; i++) {
                                if (
                                    !gltf
                                        .nonDisjointAnimations(state.animationIndices)
                                        .includes(i)
                                ) {
                                    state.animationIndices.push(i);
                                }
                            }
                            state.animationTimer.start();
                        }

                        uiModel.exitLoadingState();

                        return state;
                    }).catch((error) => {
                        console.error("Loading failed: "+ error);
                        resourceLoader
                            .loadGltf(undefined, undefined)
                            .then((gltf) => {
                                state.gltf = gltf;
                                state.sceneIndex = 0;
                                state.cameraIndex = undefined;

                                uiModel.exitLoadingState();
                                redraw = true;
                            }); 
                        return state;
                    })
            );
        }),
        catchError((error) => {
            console.error(error);
            uiModel.exitLoadingState();
            return EMPTY;
        }),
        share()
    );

    // Disable all animations which are not disjoint to the current selection of animations.
    uiModel.disabledAnimations(
        uiModel.activeAnimations.pipe(
            map((animationIndices) =>
                state.gltf.nonDisjointAnimations(animationIndices)
            )
        )
    );

    const sceneChangedObservable = uiModel.scene.pipe(
        map((sceneIndex) => {
            state.sceneIndex = sceneIndex;
            state.cameraIndex = undefined;
            const scene = state.gltf.scenes[state.sceneIndex];
            if (scene !== undefined) {
                scene.applyTransformHierarchy(state.gltf);
                state.userCamera.resetView(state.gltf, state.sceneIndex);
            }
        }),
        share()
    );

    const statisticsUpdateObservable = merge(
        sceneChangedObservable,
        gltfLoaded
    ).pipe(map(() => view.gatherStatistics(state)));

    const cameraExportChangedObservable = uiModel.cameraValuesExport.pipe(
        map(() => {
            const camera =
        state.cameraIndex === undefined
            ? state.userCamera
            : state.gltf.cameras[state.cameraIndex];
            return camera.getDescription(state.gltf);
        })
    );

    const downloadDataURL = (filename, dataURL) => {
        const element = document.createElement("a");
        element.setAttribute("href", dataURL);
        element.setAttribute("download", filename);
        element.style.display = "none";
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    cameraExportChangedObservable.subscribe((cameraDesc) => {
        const gltf = JSON.stringify(cameraDesc, undefined, 4);
        const dataURL = "data:text/plain;charset=utf-8," + encodeURIComponent(gltf);
        downloadDataURL("camera.gltf", dataURL);
    });

    uiModel.captureCanvas.subscribe(() => {
        view.renderFrame(state, canvas.width, canvas.height);
        const dataURL = canvas.toDataURL();
        downloadDataURL("capture.png", dataURL);
    });

    // Only redraw glTF view upon user inputs, or when an animation is playing.
    let redraw = false;
    const listenForRedraw = (stream) => stream.subscribe(() => (redraw = true));

    uiModel.scene.subscribe(
        (scene) => (state.sceneIndex = scene !== -1 ? scene : undefined)
    );
    listenForRedraw(uiModel.scene);

    uiModel.camera.subscribe(
        (camera) => (state.cameraIndex = camera !== -1 ? camera : undefined)
    );
    listenForRedraw(uiModel.camera);

    uiModel.variant.subscribe((variant) => (state.variant = variant));
    listenForRedraw(uiModel.variant);

    uiModel.tonemap.subscribe(
        (tonemap) => (state.renderingParameters.toneMap = tonemap)
    );
    listenForRedraw(uiModel.tonemap);

    uiModel.debugchannel.subscribe(
        (debugchannel) => (state.renderingParameters.debugOutput = debugchannel)
    );
    listenForRedraw(uiModel.debugchannel);

    uiModel.skinningEnabled.subscribe(
        (skinningEnabled) => (state.renderingParameters.skinning = skinningEnabled)
    );
    listenForRedraw(uiModel.skinningEnabled);

    uiModel.exposure.subscribe(
        (exposure) =>
            (state.renderingParameters.exposure = 1.0 / Math.pow(2.0, exposure))
    );
    listenForRedraw(uiModel.exposure);

    uiModel.morphingEnabled.subscribe(
        (morphingEnabled) => (state.renderingParameters.morphing = morphingEnabled)
    );
    listenForRedraw(uiModel.morphingEnabled);

    uiModel.clearcoatEnabled.subscribe(
        (clearcoatEnabled) =>
            (state.renderingParameters.enabledExtensions.KHR_materials_clearcoat =
        clearcoatEnabled)
    );
    listenForRedraw(uiModel.clearcoatEnabled);

    uiModel.sheenEnabled.subscribe(
        (sheenEnabled) =>
            (state.renderingParameters.enabledExtensions.KHR_materials_sheen =
        sheenEnabled)
    );
    listenForRedraw(uiModel.sheenEnabled);

    uiModel.transmissionEnabled.subscribe(
        (transmissionEnabled) =>
            (state.renderingParameters.enabledExtensions.KHR_materials_transmission =
        transmissionEnabled)
    );
    listenForRedraw(uiModel.transmissionEnabled);

    uiModel.diffuseTransmissionEnabled.subscribe(
        (diffuseTransmissionEnabled) =>
            (state.renderingParameters.enabledExtensions.KHR_materials_diffuse_transmission =
        diffuseTransmissionEnabled)
    );
    listenForRedraw(uiModel.diffuseTransmissionEnabled);

    uiModel.volumeEnabled.subscribe(
        (volumeEnabled) =>
            (state.renderingParameters.enabledExtensions.KHR_materials_volume =
        volumeEnabled)
    );
    listenForRedraw(uiModel.volumeEnabled);

    uiModel.iorEnabled.subscribe(
        (iorEnabled) =>
            (state.renderingParameters.enabledExtensions.KHR_materials_ior =
        iorEnabled)
    );
    listenForRedraw(uiModel.iorEnabled);

    uiModel.iridescenceEnabled.subscribe(
        (iridescenceEnabled) =>
            (state.renderingParameters.enabledExtensions.KHR_materials_iridescence =
        iridescenceEnabled)
    );
    listenForRedraw(uiModel.iridescenceEnabled);

    uiModel.anisotropyEnabled.subscribe(
        (anisotropyEnabled) =>
            (state.renderingParameters.enabledExtensions.KHR_materials_anisotropy =
        anisotropyEnabled)
    );
    listenForRedraw(uiModel.anisotropyEnabled);

    uiModel.dispersionEnabled.subscribe(
        (dispersionEnabled) =>
            (state.renderingParameters.enabledExtensions.KHR_materials_dispersion =
        dispersionEnabled)
    );
    listenForRedraw(uiModel.dispersionEnabled);

    uiModel.specularEnabled.subscribe(
        (specularEnabled) =>
            (state.renderingParameters.enabledExtensions.KHR_materials_specular =
        specularEnabled)
    );
    listenForRedraw(uiModel.specularEnabled);

    uiModel.emissiveStrengthEnabled.subscribe(
        (enabled) =>
            (state.renderingParameters.enabledExtensions.KHR_materials_emissive_strength =
        enabled)
    );
    listenForRedraw(uiModel.emissiveStrengthEnabled);

    uiModel.iblEnabled.subscribe(
        (iblEnabled) => (state.renderingParameters.useIBL = iblEnabled)
    );
    listenForRedraw(uiModel.iblEnabled);

    uiModel.iblIntensity.subscribe(
        (iblIntensity) =>
            (state.renderingParameters.iblIntensity = Math.pow(10, iblIntensity))
    );
    listenForRedraw(uiModel.iblIntensity);

    uiModel.renderEnvEnabled.subscribe(
        (renderEnvEnabled) =>
            (state.renderingParameters.renderEnvironmentMap = renderEnvEnabled)
    );
    listenForRedraw(uiModel.renderEnvEnabled);

    uiModel.blurEnvEnabled.subscribe(
        (blurEnvEnabled) =>
            (state.renderingParameters.blurEnvironmentMap = blurEnvEnabled)
    );
    listenForRedraw(uiModel.blurEnvEnabled);

    uiModel.punctualLightsEnabled.subscribe(
        (punctualLightsEnabled) =>
            (state.renderingParameters.usePunctual = punctualLightsEnabled)
    );
    listenForRedraw(uiModel.punctualLightsEnabled);

    uiModel.environmentRotation.subscribe((environmentRotation) => {
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

    uiModel.clearColor.subscribe(
        (clearColor) => (state.renderingParameters.clearColor = clearColor)
    );
    listenForRedraw(uiModel.clearColor);

    uiModel.animationPlay.subscribe((animationPlay) => {
        if (animationPlay) {
            state.animationTimer.unpause();
        } else {
            state.animationTimer.pause();
        }
    });

    uiModel.activeAnimations.subscribe(
        (animations) => (state.animationIndices = animations)
    );
    listenForRedraw(uiModel.activeAnimations);

    uiModel.hdr.subscribe((hdrFile) => {
        resourceLoader.loadEnvironment(hdrFile).then((environment) => {
            state.environment = environment;
            // We need to wait until the environment is loaded to redraw
            redraw = true;
        });
    });

    uiModel.attachGltfLoaded(gltfLoaded);
    uiModel.updateValidationReport(validation);
    uiModel.updateStatistics(statisticsUpdateObservable);
    const sceneChangedStateObservable = uiModel.scene.pipe(map(() => state));
    uiModel.attachCameraChangeObservable(sceneChangedStateObservable);

    uiModel.orbit.subscribe((orbit) => {
        if (state.cameraIndex === undefined) {
            state.userCamera.orbit(orbit.deltaPhi, orbit.deltaTheta);
        }
    });
    listenForRedraw(uiModel.orbit);

    uiModel.pan.subscribe((pan) => {
        if (state.cameraIndex === undefined) {
            state.userCamera.pan(pan.deltaX, -pan.deltaY);
        }
    });
    listenForRedraw(uiModel.pan);

    uiModel.zoom.subscribe((zoom) => {
        if (state.cameraIndex === undefined) {
            state.userCamera.zoomBy(zoom.deltaZoom);
        }
    });
    listenForRedraw(uiModel.zoom);

    listenForRedraw(gltfLoaded);

    // configure the animation loop
    const past = {};
    const update = () => {
        const devicePixelRatio = window.devicePixelRatio || 1;

        // set the size of the drawingBuffer based on the size it's displayed.
        canvas.width = Math.floor(canvas.clientWidth * devicePixelRatio);
        canvas.height = Math.floor(canvas.clientHeight * devicePixelRatio);
        redraw |= !state.animationTimer.paused && state.animationIndices.length > 0;
        redraw |= past.width != canvas.width || past.height != canvas.height;

        // Refit view if canvas changes significantly
        if((canvas.width/past.width <0.5 || canvas.width/past.width>2.0 )||
            (canvas.height/past.height <0.5 || canvas.height/past.height>2.0 ))
        {
            state.userCamera.perspective.aspectRatio = canvas.width / canvas.height;
            state.userCamera.fitViewToScene(state.gltf, state.sceneIndex);
        }


        past.width = canvas.width;
        past.height = canvas.height;

        if (redraw) {
            view.renderFrame(state, canvas.width, canvas.height);
            redraw = false;
        }

        window.requestAnimationFrame(update);
    };

    // After this start executing animation loop.
    window.requestAnimationFrame(update);
};
