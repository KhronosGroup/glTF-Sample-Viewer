const { app, BrowserWindow } = require('electron');

// Electron app based on Don McCurdy's glTF viewer.

const url  = require('url');
const path = require('path');
const open = require('open');
const fs = require('fs');

let mainWindow;

function createWindow () {
    mainWindow = new BrowserWindow({ width: 1920, height: 1080,
        webPreferences: {
        offscreen: true
      }
    });

    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, "../index.html"),
        protocol: 'file',
        slashes: true
    }));

    setTimeout(function() {
        mainWindow.webContents.on('paint', (event, dirty, image) => {
          fs.writeFile('output.png', image.toPNG(), (err) => {
                if (err) throw err;
                console.log('The file has been saved!');

                app.quit();
            });
        });
    }, 3000);
}

app.on('ready', createWindow);
