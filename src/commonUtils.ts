const ipcRenderer = (window as any).ipcRenderer;
export const setTransparentOption = {
  enabled: true,
};
export const setTransparent = () => {
  ipcRenderer &&
    setTransparentOption.enabled &&
    ipcRenderer.send("set-ignore-mouse-events", true, { forward: true });
  console.log(setTransparentOption.enabled);
};

export const unsetTransparent = () => {
  console.log("unsetTransparent");
  ipcRenderer && ipcRenderer.send("set-ignore-mouse-events", false);
};
