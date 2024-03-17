const { screen } = require("electron");
const { ipcMain } = require("electron");
const { app, BrowserWindow } = require("electron/main");
const path = require("path");
const isDev = import("electron-is-dev");
const createWindow = () => {
  console.log("createWindow");
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  const win = new BrowserWindow({
    width,
    height,
    frame: false,
    titleBarStyle: "hidden",
    transparent: true,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true, // 允許在 Render Process 使用 Remote Module
      preload: path.join(__dirname, "./preload.js"),
    },
  });
  const servePort = process.env.PORT ?? 3000;
  const startURL = isDev
    ? `http://localhost:${servePort}`
    : `file://${path.join(__dirname, "../build/index.html")}`;

  win.loadURL(startURL);
};

ipcMain.on("set-ignore-mouse-events", (event, ignore, options) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  console.log(ignore);
  console.log(options);
  win.setIgnoreMouseEvents(ignore, options);
});

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
