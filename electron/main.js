const { app, BrowserWindow } = require('electron');

// Electron app based on Don McCurdy's glTF viewer.

const url  = require('url');
const path = require('path');
const open = require('open');

let mainWindow;

function createWindow () {
    mainWindow = new BrowserWindow({ width: 1920, height: 1080,
        icon: path.join(__dirname, "../assets/images/gltf.png"),
        webPreferences: {
            nodeIntegration: true
        }
    });

    mainWindow.setMenu(null);

    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, "../index.html"),
        protocol: 'file',
        slashes: true
    }));

    mainWindow.webContents.on('new-window', function(event, url) {
        event.preventDefault();
        open(url);
    });

    mainWindow.on('closed', function() {
        mainWindow = null;
    });
}

app.on('ready', createWindow);

app.on('window-all-closed', function() {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on('activate', function() {
    if (mainWindow === null) {
        createWindow();
    }
});
