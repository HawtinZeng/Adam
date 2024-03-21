const {
  default: installExtension,
  REACT_DEVELOPER_TOOLS,
} = require("electron-devtools-installer");
// import installExtension, { REDUX_DEVTOOLS } from "electron-devtools-installer";
const { screen } = require("electron");
const { ipcMain } = require("electron");
const { app, BrowserWindow } = require("electron/main");
const path = require("path");
const isDev = import("electron-is-dev");
const createWindow = () => {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  const win = new BrowserWindow({
    width: 500,
    height: 700,
    x: width - 500,
    y: 600,
    frame: false,
    titleBarStyle: "hidden",
    transparent: true,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
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
  win.setIgnoreMouseEvents(ignore, options);
});

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  installExtension(REACT_DEVELOPER_TOOLS)
    .then((name) => console.log(`Added Extension:  ${name}`))
    .catch((err) => console.log("An error occurred: ", err));
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
