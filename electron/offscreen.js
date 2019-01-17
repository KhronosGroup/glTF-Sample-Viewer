// needs to be in sync with the dictionary in rendering_parameters.js
// TODO: better solution?
const Environments =
[
    "Papermill Ruins E",
    "Papermill Ruins E (LDR)",
    "Field",
    "Courtyard of the Doge's palace",
    "Pisa courtyard nearing sunset",
    "Footprint Court",
    "Helipad GoldenHour",
    "Dining room of the Ennis-Brown House"
];

const { app, BrowserWindow } = require('electron');

// Electron app based on Don McCurdy's glTF viewer.

const url = require('url');
const path = require('path');
const fs = require('fs');

const defaultModel = "assets/models/2.0/BoomBox/glTF/BoomBox.gltf";
const outputFile = "output.png";

const argv = process.argv;
const args = argv.lastIndexOf('--') !== -1 ? argv.slice(argv.lastIndexOf('--') + 1) : [];

const ArgumentParser = require('argparse').ArgumentParser;
const parsedArgs = parseArguments(args);
global.sharedObject = { args: parsedArgs };

app.on('ready', () => createWindow(1024, 1024));

function parseArguments(args)
{
    const parser = new ArgumentParser();

    parser.addArgument(
        ['--camera-index'],
        {
            defaultValue: "orbit camera",
            help: "Index of the glTF camera to use (instead of the orbit camera)."
        }
    );
    parser.addArgument(
        ['--eye-position'],
        {
            defaultValue: [0.0, 0.0, 1.0],
            metavar: ['X', 'Y', 'Z'],
            nargs: 3,
            type: 'float',
            help: "The coordinates of the eye (camera)"
        }
    );
    parser.addArgument(
        ['--target-position'],
        {
            defaultValue: [0.0, 0.0, 0.0],
            metavar: ['X', 'Y', 'Z'],
            nargs: 3,
            type: 'float',
            help: "The coordinates of the eye focus point"
        }
    );
    parser.addArgument(
        '--up',
        {
            defaultValue: [0.0, 1.0, 0.0],
            metavar: ['X', 'Y', 'Z'],
            nargs: 3,
            type: 'float',
            help: "The up direction vector"
        }
    );
    parser.addArgument(
        '--projection',
        {
            defaultValue: "perspective",
            help: "The projection mode of the camera",
            choices: ["perspective", "ortographic"]
        }
    );
    parser.addArgument(
        '--znear',
        {
            defaultValue: 0.01,
            type: 'float',
            help: "The near clip plane"
        }
    );
    parser.addArgument(
        '--zfar',
        {
            defaultValue: 10000.0,
            type: 'float',
            help: "The far clip plane"
        }
    );
    parser.addArgument(
        '--yfov',
        {
            defaultValue: 45.0,
            type: 'float',
            help: "The vertical field of view in degrees"
        }
    );
    parser.addArgument(
        '--xmag',
        {
            defaultValue: 1.0,
            type: 'float',
            help: "The size of the orthographic camera in x direction"
        }
    );
    parser.addArgument(
        '--ymag',
        {
            defaultValue: 1.0,
            type: 'float',
            help: "The size of the orthographic camera in y direction"
        }
    );
    parser.addArgument(
        '--environment',
        {
            defaultValue: "Courtyard of the Doge's palace",
            type: 'string',
            help: 'The environment map to use for image based lighting',
            choices: Environments
        }
    );
    parser.addArgument(
        'gltf_path',
        {
            nargs: "?",
            help: "The path of the glTF file"
        }
    );

    const parsedArgs = parser.parseArgs(args);

    if (parsedArgs.gltf_path === null)
    {
        console.log("%s\n", parser.description);
        console.info("IMPORTANT NOTICE: \n\
            Add '-- --' to get your arguments through to the tool. \n\
            Example: 'npm run start-offscreen -- -- --help'");
        console.error("\nNo gltf_path was given, defaulting to '%s'\n", defaultModel);
        parsedArgs.gltf_path = defaultModel;
    }

    return parsedArgs;
}

function createWindow(width, height)
{
    const mainWindow = new BrowserWindow({
        width: width, height: height,
        show: false,
        frame: false,
        webPreferences: {
            offscreen: true,
            //transparent: true,
        }
    });

    //mainWindow.webContents.openDevTools();

    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, "../headless.html"),
        protocol: 'file',
        slashes: true
    }));

    let rendererReady = false;
    let writeLock = false;

    // In main process.
    const { ipcMain } = require('electron');
    ipcMain.on('rendererReady', () =>
    {
        if (rendererReady)
            return;

        rendererReady = true;

        mainWindow.webContents.on('paint', (event, dirty, image) =>
        {
            if (writeLock)
                return;

            writeLock = true;

            const lastImage = image;

            fs.writeFile(outputFile, lastImage.toPNG(), (err) =>
            {
                if (err) throw err;
                console.log("The file has been saved to '%s'", outputFile);

                app.quit();
            });
        });
    });
}
