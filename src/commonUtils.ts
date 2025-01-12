const ipcRenderer = (window as any).ipcRenderer;

export const setTransparentOption = {
  enabled: true,
};

const ori = console.log;
console.log = (msg) => {
  try {
    ori(JSON.stringify(msg));
  } catch (e) {
    console.log(e);
  }
};

export const setTransparent = () => {
  ipcRenderer &&
    setTransparentOption.enabled &&
    ipcRenderer.send("set-ignore-mouse-events", true, { forward: true });

  window.ipcRenderer.send("checkWindow");
};

export const unsetTransparent = () => {
  ipcRenderer && ipcRenderer.send("set-ignore-mouse-events", false);
};
