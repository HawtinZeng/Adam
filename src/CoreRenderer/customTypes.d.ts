declare global {
  interface HTMLCanvasElement {
    transformOrigin: TransformTRS; // 记录缓存的drawing的初始位置，用于变换缓存的drawing
  }
}
// Ensure this file is treated as a module
export {};
