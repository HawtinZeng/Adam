// const getWin = import("get-windows");
import { desktopCapturer, globalShortcut, ipcMain, screen } from "electron";
import isDev from "electron-is-dev";
import { BrowserWindow, app } from "electron/main";
import { appendFileSync } from "fs";
import { activeWindow } from "get-windows";
import mouseEvt from "global-mouse-events";
import { GlobalKeyboardListener } from "node-global-key-listener";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import {
  decoder,
  getMessage,
} from "./node-native-messaging/adam_extension.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
let win;

console.error = () => {};

const createWindow = () => {
  const { width, height } = screen.getPrimaryDisplay().size;
  win = new BrowserWindow({
    width,
    height,
    frame: false,
    titleBarStyle: "hidden",
    resizable: false,

    transparent: true,
    skipTaskbar: true,
    alwaysOnTop: true,
    webPreferences: {
      // nodeIntegration: true,
      nodeIntegrationInWorker: true,
      contextIsolation: false,
      preload: path.join(__dirname, "./preload.js"),
    },
  });
  win.webContents.send("SET_MENUBAR_HEIGHT", [width, height]);

  win.setAlwaysOnTop(true, "screen-saver");

  const servePort = process.env.PORT ?? 3000;

  if (isDev) {
    const startURL = `http://localhost:${servePort}`;

    win.loadURL(startURL);
  } else {
    // TODO: test build process, add the output into .gitignore
    const startURL = require("url").format({
      protocol: "file",
      slashes: true,
      pathname: require("path").join(__dirname, "build/index.html"),
    });
    win.loadURL(startURL);
  }
};

ipcMain.on("set-ignore-mouse-events", (event, ignore, options) => {
  win.setIgnoreMouseEvents(ignore, options);
  if (ignore) {
    win.blur();
  } else {
    win.focus();
  }
});

const v = new GlobalKeyboardListener();
v.addListener(function (e) {
  if ((e.name === "LEFT ALT" || e.name === "RIGHT ALT") && e.state === "UP") {
    setTimeout(changeWindowHandler, 10);
  } else if (e.name === "MOUSE LEFT" && e.state === "DOWN") {
    setTimeout(changeWindowHandler, 10);
  }
});
let preFocusedWindow = undefined;
async function changeWindowHandler() {
  const currentWindow = await activeWindow();
  win.webContents.send("changeWindowWithoutCondition");

  if (
    currentWindow?.id &&
    currentWindow?.title !== "Adam" &&
    currentWindow?.title !== "Open" &&
    preFocusedWindow?.id !== currentWindow.id
  ) {
    win.webContents.send("changeWindow", currentWindow);
    preFocusedWindow = currentWindow;
  }
}
// ipcMain.on("updateFocusedWindow", changeWindowHandler);

app.whenReady().then(async () => {
  createWindow();
  mouseEvt.on("mousewheel", (wheel) => {
    win.webContents.send("mouseWheel", wheel);
  });

  // adam won't be focused at start up
  win.blur();
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
  //   win.webContents.send("Alt9");
  // });
  globalShortcut.register("Alt+C", () => {
    win.webContents.send("AltC");
  });
  globalShortcut.register("Alt+Q", () => {
    win.webContents.send("AltQ");
  });
  globalShortcut.register("Alt+Q", () => {
    win.webContents.send("AltQ");
  });
  globalShortcut.register("Ctrl+Q", () => {
    app.quit();
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
  }
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

// const decoder = new TextDecoder();
// try {
//   for await (const message of getMessage()) {
//     await sendMessage(encodeMessage("node echo " + decoder.decode(message)));
//   }
// } catch (e) {
//   console.log("exit");
//   exit();
// }

// try {
//   for await (const message of getMessage()) {
//     await sendMessage(encodeMessage("node echo " + decoder.decode(message)));
//   }
// } catch (e) {
//   exit();
// }

function Send(message) {
  let msgStr = JSON.stringify(message);
  let lengthStr = String.fromCharCode(
    msgStr.length & 0x000000ff,
    (msgStr.length >> 8) & 0x000000ff,
    (msgStr.length >> 16) & 0x000000ff,
    (msgStr.length >> 24) & 0x000000ff
  );
  process.stdout.write(lengthStr + msgStr);
}

process.stdin.setEncoding("utf8");

// process.stdout

for await (const message of getMessage()) {
  appendFileSync("output.txt", decoder.decode(message));
}
// function AppendInputString(chunk) {
//   msgBacklog += chunk;
//   while (true) {
//     if (msgBacklog.length < 4) return;
//     let msgLength =
//       msgBacklog.charCodeAt(0) +
//       (msgBacklog.charCodeAt(1) << 8) +
//       (msgBacklog.charCodeAt(2) << 16) +
//       (msgBacklog.charCodeAt(3) << 24);
//     if (msgBacklog.length < msgLength + 4) return;
//     try {
//       let msgObject = JSON.parse(msgBacklog.substring(4, 4 + msgLength));
//       appendFileSync("out.tex", JSON.stringify(msgObject));
//       // handle received message
//     } catch (e) {}
//     msgBacklog = msgBacklog.substring(4 + msgLength);
//   }
// }
