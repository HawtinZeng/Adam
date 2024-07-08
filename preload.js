window.ipcRenderer = require("electron").ipcRenderer; // expose ipcRenderer to window scope

window.ipcRenderer.on("SET_SOURCE", async (_, sourceId) => {
  window.sourceId = sourceId;
});

window.ipcRenderer.on("SET_MENUBAR_HEIGHT", (height) => {
  window.menubarHeight = height;
});
