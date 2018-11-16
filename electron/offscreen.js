const { app, BrowserWindow } = require('electron');

// Electron app based on Don McCurdy's glTF viewer.

const url  = require('url');
const path = require('path');
const open = require('open');
const fs = require('fs');

let mainWindow;

function createWindow () {
    mainWindow = new BrowserWindow({ width: 1920, height: 1080,
        show: false,
        frame: false,
        webPreferences: {
          offscreen: true,
          transparent: true,
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
