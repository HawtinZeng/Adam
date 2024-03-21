const ipcRenderer = (window as any).ipcRenderer;
export const setTranspanrent = () => {
  ipcRenderer.send("set-ignore-mouse-events", true, { forward: true });
};
export const unsetTranspanrent = () => {
  ipcRenderer.send("set-ignore-mouse-events", false);
};
