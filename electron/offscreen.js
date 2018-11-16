const { app, BrowserWindow } = require('electron');

// Electron app based on Don McCurdy's glTF viewer.

const url  = require('url');
const path = require('path');
const open = require('open');
const fs = require('fs');

let mainWindow;

let argv = process.argv;
let args = argv.lastIndexOf('--') !== -1 ? argv.slice(argv.lastIndexOf('--')+1) : [];

let ArgumentParser = require('argparse').ArgumentParser;
let parser = new ArgumentParser({
    version: '0.0.1',
    addHelp: true,
    description: 'glTF Reference Viewer'
});

parser.addArgument(
    [ '--eye-position' ],
    {
        defaultValue: [0.0,0.0,1.0],
        nargs: 3,
        type: 'float',
        help: "The coordinates of the eye (camera)."
    }
);
parser.addArgument(
[ '--target-position' ],
{
    defaultValue: [0.0,0.0,0.0],
    nargs: 3,
    type: 'float',
    help: "The coordinates of the eye focus point."
}
);
parser.addArgument(
    '--up',
    {
        defaultValue: [0.0,1.0,0.0],
        nargs: 3,
        type: 'float',
        help: "The up direction vector."
    }
)
parser.addArgument(
    '--projection',
    {
        defaultValue: "perspective",
        help: "The projection mode of the camera",
        choices: ["perspective", "ortographic"]
    }
)
parser.addArgument(
    '--znear',
    {
        defaultValue: 0.01,
        type: 'float',
        help: "The near clip plane"
    }
)
parser.addArgument(
    '--zfar',
    {
        defaultValue: 10000.0,
        type: 'float',
        help: "The far clip plane"
    }
)
parser.addArgument(
    '--yfov',
    {
        defaultValue: 60.0,
        type: 'float',
        help: "The vertical field of view in degrees."
    }
)
parser.addArgument(
    '--xmag',
    {
        defaultValue: 1.0,
        type: 'float',
        help: "The size of the ortographic camera in x direction."
    }
)
parser.addArgument(
    '--ymag',
    {
        defaultValue: 1.0,
        type: 'float',
        help: "The size of the ortographic camera in y direction."
    }
)
args = parser.parseArgs(args);
global.sharedObject = {args: args}

function createWindow () {
    mainWindow = new BrowserWindow({ width: 1920, height: 1080,
        //show: false,
        //frame: false,
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
    const {ipcMain} = require('electron')
    ipcMain.on('rendererReady', (event) => {
        if (rendererReady)
            return;

        rendererReady = true;

        mainWindow.webContents.on('paint', (event, dirty, image) => {
            if (writeLock)
                return;

            writeLock = true;

            lastImage = image;

            fs.writeFile('output.png', lastImage.toPNG(), (err) => {
                if (err) throw err;
                console.log('The file has been saved!');

                app.quit();
            });
        });
    });
}

app.on('ready', createWindow);
