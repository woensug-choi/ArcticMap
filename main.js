const { app, BrowserWindow } = require("electron");
const path = require("path");
const express = require("express");

function getOutDir() {
  // In packaged apps, extraResource ends up in process.resourcesPath
  if (app.isPackaged) return path.join(process.resourcesPath, "out");
  // In dev, your project folder
  return path.join(__dirname, "out");
}

let win;

app.whenReady().then(() => {
  const server = express();
  const outDir = getOutDir();

  server.use(express.static(outDir));

  server.get("/", (req, res) => {
    res.sendFile(path.join(outDir, "index.html"));
  });

  // Optional: SPA-style fallback (if you have client-side routing)
  // server.get("*", (req, res) => {
  //   res.sendFile(path.join(outDir, "index.html"));
  // });

  const listener = server.listen(0, "127.0.0.1", () => {
    const { port } = listener.address();
    win = new BrowserWindow({
      width: 1200,
      height:950,
    });
    win.loadURL(`http://127.0.0.1:${port}/`);
    // win.webContents.openDevTools(); // uncomment to debug
  });
});

app.on('window-all-closed', () => {
  app.quit()
})
