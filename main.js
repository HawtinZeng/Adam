const {
  default: installExtension,
  REACT_DEVELOPER_TOOLS,
} = require("electron-devtools-installer");
// import installExtension, { REDUX_DEVTOOLS } from "electron-devtools-installer";
const { screen, globalShortcut } = require("electron");
const { ipcMain } = require("electron");
const { app, BrowserWindow, desktopCapturer } = require("electron/main");
const path = require("path");
const isDev = import("electron-is-dev");
let win;

const createWindow = () => {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  win = new BrowserWindow({
    width,
    height,
    frame: false,
    titleBarStyle: "hidden",

    transparent: true,

    alwaysOnTop: true,
    webPreferences: {
      // nodeIntegration: true,
      nodeIntegrationInWorker: true,
      contextIsolation: false,
      preload: path.join(__dirname, "./preload.js"),
    },
  });
  win.setAlwaysOnTop(true, "screen-saver");

  const servePort = process.env.PORT ?? 3000;
  const startURL = isDev
    ? `http://localhost:${servePort}`
    : `file://${path.join(__dirname, "../build/index.html")}`;

  win.loadURL(startURL);
};

ipcMain.on("set-ignore-mouse-events", (event, ignore, options) => {
  // const win = BrowserWindow.fromWebContents(event.sender);
  win.setIgnoreMouseEvents(ignore, options);
  if (ignore) {
    win.blur();
  } else {
    win.focus();
  }
});

app.whenReady().then(() => {
  createWindow();

  // exclude the electron window to avoid screen rendering loop.
  win.setContentProtection(true);
  // must be wrapped with when ready
  desktopCapturer.getSources({ types: ["screen"] }).then(async (sources) => {
    const source = sources[0];
    win.webContents.send("SET_SOURCE", source.id);
  });

  win.webContents.send("SET_MENUBAR_HEIGHT", win.menuBarHeight);

  // global shortcuts
  globalShortcut.register("Alt+1", () => {
    win.webContents.send("Alt1");
  });
  globalShortcut.register("Alt+2", () => {
    win.webContents.send("Alt2");
  });
  globalShortcut.register("Alt+3", () => {
    win.webContents.send("Alt3");
  });
  globalShortcut.register("Alt+4", () => {
    win.webContents.send("Alt4");
  });
  globalShortcut.register("Alt+5", () => {
    win.webContents.send("Alt5");
  });
  globalShortcut.register("Alt+6", () => {
    win.webContents.send("Alt6");
  });
  globalShortcut.register("Alt+7", () => {
    win.webContents.send("Alt7");
  });
  globalShortcut.register("Alt+8", () => {
    win.webContents.send("Alt8");
  });
  // setting?
  // globalShortcut.register("Alt+9", () => {
  //   win.webContents.send("Alt8");
  // });
  globalShortcut.register("Alt+C", () => {
    win.webContents.send("AltC");
  });
  globalShortcut.register("Alt+Q", () => {
    win.webContents.send("AltQ");
  });

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
