const ipcRenderer = (window as any).ipcRenderer;
export const setTranspanrent = () => {
  ipcRenderer && ipcRenderer.send("set-ignore-mouse-events", true, { forward: true });
};
export const unsetTranspanrent = () => {
  ipcRenderer && ipcRenderer.send("set-ignore-mouse-events", false);
};
