#!/usr/bin/env node

const yargs = require("yargs");
const sample_viewer = require("@khronosgroup/gltf-viewer");
const fs = require("fs");
const node_gles = require("node-gles");
const png = require("fast-png");

async function main()
{

    const options = yargs
        .usage("Usage: <name>")
        .option("w", { alias: "width", describe: "Output width", type: "number", demandOption: false })
        .option("h", { alias: "height", describe: "Output height", type: "number", demandOption: false })
        .argv;

    const width = 1024;
    const height = 1024;

    const gl = node_gles.createWebGLRenderingContext();

    const view = new sample_viewer.GltfView(gl);
    const state = view.createState();

    const environment_file = new Uint8Array(fs.readFileSync(__dirname + "/../assets/environments/footprint_court.hdr")).buffer;
    const luts = {
        lut_ggx_file: new Uint8Array(fs.readFileSync(__dirname + "/../assets/images/lut_ggx.png")).buffer,
        lut_charlie_file: new Uint8Array(fs.readFileSync(__dirname + "/../assets/images/lut_charlie.png")).buffer,
        lut_sheen_E_file: new Uint8Array(fs.readFileSync(__dirname + "/../assets/images/lut_sheen_E.png")).buffer,
    };

    state.environment = await sample_viewer.loadEnvironment(environment_file, view, luts);
    const glb_file = new Uint8Array(fs.readFileSync(__dirname + "/../assets/models/2.0/Box/glTF-Binary/Box.glb")).buffer;
    state.gltf = await sample_viewer.loadGltf(glb_file, view);

    const defaultScene = state.gltf.scene;
    state.sceneIndex = defaultScene === undefined ? 0 : defaultScene;
    if (state.gltf.scenes.length != 0)
    {
        if(state.sceneIndex > state.gltf.scenes.length - 1)
        {
            state.sceneIndex = 0;
        }
        const scene = state.gltf.scenes[state.sceneIndex];
        scene.applyTransformHierarchy(state.gltf);
        state.userCamera.fitViewToScene(state.gltf, state.sceneIndex);

        view.renderFrame(state, width, height);

        let pixels = new Uint8Array(width * height * 4);
        gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

        const image = {
            width: width,
            height: height,
            data: pixels
        };
        const pngFile = png.encode(image);
        fs.writeFileSync(__dirname + "/render.png", pngFile);
    }
}

main().then(() => console.log("Done"));
