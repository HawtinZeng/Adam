declare global {
  interface HTMLCanvasElement {
    transformOrigin: TransformTRS;
  }
  interface Window {
    logger: Logger;
    initialWindowId?: number; // the previous window after start up adam, from get-window.js
    focusedWindowId?: number; // the id of current focused window, from get-window.js
    sourceId?: string; // from electron
  }
}
// Ensure this file is treated as a module
export {};
