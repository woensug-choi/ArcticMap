const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      contextIsolation: true,
    },
  });
  win.loadFile(path.join(__dirname, 'out', 'index.html'));
}
app.whenReady().then(createWindow);