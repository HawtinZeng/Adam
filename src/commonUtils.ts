const ipcRenderer = (window as any).ipcRenderer;
export const setTransparent = () => {
  ipcRenderer &&
    ipcRenderer.send("set-ignore-mouse-events", true, { forward: true });
};

export const unsetTransparent = () => {
  ipcRenderer && ipcRenderer.send("set-ignore-mouse-events", false);
};
