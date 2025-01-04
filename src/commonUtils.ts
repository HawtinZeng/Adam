const ipcRenderer = (window as any).ipcRenderer;

export const setTransparentOption = {
  enabled: true,
};

const ori = console.log;
console.log = (msg) => {
  ori(JSON.stringify(msg));
};

export const setTransparent = () => {
  ipcRenderer &&
    setTransparentOption.enabled &&
    ipcRenderer.send("set-ignore-mouse-events", true, { forward: true });
};

export const unsetTransparent = () => {
  ipcRenderer && ipcRenderer.send("set-ignore-mouse-events", false);
};
