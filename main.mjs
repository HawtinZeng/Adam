import {
  clipboard,
  desktopCapturer,
  dialog,
  globalShortcut,
  ipcMain,
  nativeImage,
  screen,
} from "electron";
import isDev from "electron-is-dev";
import { BrowserWindow, app } from "electron/main";
import * as fs from "fs";
import { activeWindow } from "get-windows";
import mouseEvt from "global-mouse-events";
import path, { dirname } from "path";
import { Server } from "socket.io";
import { fileURLToPath, format } from "url";
import { Window } from "win-control";

import { ActiveWindow } from "@paymoapp/active-window";
import electronSquirrelStartup from "electron-squirrel-startup";
import { createServer } from "http";

const httpServer = createServer();
const server = new Server(httpServer, {});
if (electronSquirrelStartup) app.quit();

server.on("connection", (socket) => {
  socket.on("testLatency", (d) => {
    console.log(`Got: ${d}, received at ${new Date().getTime()}`);
  });

  socket.on("scrollElement", (areaInfo) => {
    win.webContents.send("scrollElement", areaInfo);
  });

  socket.on("initializeArea", (areaInfo) => {
    win.webContents.send("initializeArea", areaInfo);
  });
  socket.on("zoom", (areaInfo) => {
    win.webContents.send("zoom", areaInfo);
  });

  socket.on("onBoundsChanged", (areaInfo) => {
    console.log("onBoundsChanged");
    console.log(JSON.parse(areaInfo));
  });

  socket.on("activeBrowserTab", async (tabId) => {
    const currentWindow = await activeWindow();

    win.webContents.send("activeBrowserTab", tabId, currentWindow);
    changeWindowHandler();
  });

  socket.on("deliverActiveTabId", (tabId) => {
    win.webContents.send("activeBrowserTab", tabId);
  });
});

httpServer.listen(5555);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
let win;
let globalMousePress = "unPressing";

const createWindow = () => {
  const { width, height } = screen.getPrimaryDisplay().size;
  win = new BrowserWindow({
    width,
    height,
    frame: false,
    titleBarStyle: "hidden",
    resizable: false,
    skipTaskbar: true,
    transparent: true,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegrationInWorker: true,
      contextIsolation: false,
      preload: path.join(__dirname, "./preload.cjs"),
    },
  });
  win.webContents.send("SET_MENUBAR_HEIGHT", [width, height]);

  win.setAlwaysOnTop(true, "screen-saver");

  const servePort = process.env.PORT ?? 3000;

  if (isDev) {
    const startURL = `http://localhost:${servePort}`;

    win.loadURL(startURL);
  } else {
    const startURL = format({
      protocol: "file",
      slashes: true,
      pathname: path.join(__dirname, "index.html"),
    });
    win.loadURL(startURL);
    changeWindowHandler();
  }
};

ipcMain.on("set-ignore-mouse-events", (event, ignore, options) => {
  win.setIgnoreMouseEvents(ignore, options);
  if (ignore) {
    win.blur();
    if (lastActiveWindow?.title)
      Window.getByTitle(lastActiveWindow.title)?.setForeground();
  } else {
    win.focus();
  }
});

ipcMain.on("saveImg", (_, img) => {
  const base64Content = img.replace(/^data:image\/png;base64,/, "");
  dialog
    .showSaveDialog({
      title: "Select the File Path to save",
      // defaultPath: path.join(__dirname, "../assets/sample.txt"),
      buttonLabel: "Save",
      properties: [],
    })
    .then((file) => {
      if (!file.canceled) {
        if (file.filePath.slice(-4) !== ".png") file.filePath += ".png";
        fs.writeFile(
          file.filePath.toString(),
          base64Content,
          "base64",
          function (err) {
            if (err) throw err;
            win.webContents.send("saveImgFinish");
          }
        );
      }
    })
    .catch((err) => {
      console.log(err);
    });
});

ipcMain.on("copyShot", (_, img) => {
  const image = nativeImage.createFromDataURL(img);
  clipboard.writeImage(image);
});

ipcMain.on("focusAdamWindow", (_) => {
  win.focus();
});

ipcMain.on("checkWindow", (e) => {
  changeWindowHandler();
});

ipcMain.on("queryActiveTabId", () => {
  server.emit("queryActiveTabId");
});

ActiveWindow.initialize();
ActiveWindow.subscribe((windowInfo) => {
  if (windowInfo) {
    changeWindowHandler();
  }
});

let lastActiveWindow;

ipcMain.on("logActiveWindow", async () => {
  console.log(await activeWindow());
});

async function changeWindowHandler() {
  const currentWindow = await activeWindow();

  if (!currentWindow || lastActiveWindow?.id === currentWindow.id) return;
  if (
    currentWindow?.id &&
    currentWindow?.title !== "Adam" &&
    currentWindow?.title !== "Open" &&
    currentWindow?.title !== "" &&
    currentWindow?.title !== "Task Switching" &&
    currentWindow?.title !== "EVCapture" &&
    currentWindow?.title !== "ScreenToGif"
  ) {
    win.webContents.send("changeWindow", currentWindow);
    lastActiveWindow = currentWindow;
  }
}

app.whenReady().then(async () => {
  createWindow();
  mouseEvt.on("mousewheel", (wheel) => {
    win.webContents.send("mouseWheel", wheel);
  });

  mouseEvt.on("mousemove", async () => {
    if (globalMousePress === "pressing") {
      const winInfo = await activeWindow();

      if (winInfo?.title.includes("Chrome"))
        server.sockets.emit("initializeAreaFromNode2Chrome");

      win.webContents.send("mousedrag", winInfo);
    }
  });

  mouseEvt.on("mousedown", async () => {
    globalMousePress =
      globalMousePress === "unPressing" ? "pressing" : "unPressing";
  });

  mouseEvt.on("mouseup", async () => {
    globalMousePress =
      globalMousePress === "unPressing" ? "pressing" : "unPressing";
    const winInfo = await activeWindow();
    win.webContents.send("mousedrag", winInfo);
  });

  // adam won't be focused at start up
  // win.blur();
  const winInfo = await activeWindow();
  win.webContents.send("SET_INITIAL_WINDOWID", winInfo.id);

  // exclude the electron window to avoid screen rendering loop.
  // win.setContentProtection(true);can't set within this context, because we need to enable screen sharing app to share this electron app.
  // must be wrapped with when ready
  desktopCapturer.getSources({ types: ["screen"] }).then(async (sources) => {
    const source = sources[0];
    win.webContents.send("SET_SOURCE", source.id); // used in screen shot function
  });

  // global shortcuts
  globalShortcut.register("Alt+`", () => {
    win.webContents.send("Alt`");
  });
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
  globalShortcut.register("Alt+C", () => {
    win.webContents.send("AltC");
  });
  globalShortcut.register("Alt+Q", () => {
    win.webContents.send("AltQ");
  });
  globalShortcut.register("Alt+Q", () => {
    win.webContents.send("AltQ");
  });
  globalShortcut.register("Alt+D", () => {
    win.webContents.send("back");
  });
  globalShortcut.register("Alt+F", () => {
    win.webContents.send("forward");
  });

  globalShortcut.register("Ctrl+Q", () => {
    app.quit();
  });
  globalShortcut.register("Ctrl+R", () => {
    restartApp();
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    server.close();
  }
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});
// Function to restart the app
function restartApp() {
  app.relaunch();
  app.exit(0);
}
