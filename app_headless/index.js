#!/usr/bin/env node
async function main()
{
    const yargs = require("yargs");
    const sample_viewer = require("gltf-sample-viewer");

    const options = yargs
        .usage("Usage: <name>")
        .option("w", { alias: "width", describe: "Output width", type: "number", demandOption: false })
        .option("h", { alias: "height", describe: "Output height", type: "number", demandOption: false })
        .argv;

    const width = 1024;
    const height = 1024;

    const gl = require('gl')(width, height, { preserveDrawingBuffer: true })

    const view = new sample_viewer.GltfView(gl);
    const state = view.createState();

    state.environment = await sample_viewer.loadEnvironment("../app_web/assets/environments/footprint_court_512.hdr", view);
    state.gltf = await sample_viewer.loadGltf("../app_web/assets/models/avocado/glTF-Binary/Avocado.glb", view);

    const defaultScene = state.gltf.scene;
    state.sceneIndex = defaultScene === undefined ? 0 : defaultScene;
    const scene = state.gltf.scenes[state.sceneIndex];
    scene.applyTransformHierarchy(state.gltf);
    sample_viewer.computePrimitiveCentroids(state.gltf);
    state.userCamera.fitViewToScene(state.gltf, state.sceneIndex);
    state.userCamera.updatePosition();

    view.animate(state);
    view.renderFrame(state);

    var pixels = new Uint8Array(width * height * 4)
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels)
}

main().then(() => console.log("Done"));
