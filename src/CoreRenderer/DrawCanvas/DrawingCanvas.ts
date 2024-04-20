import { DrawingElement } from "src/CoreRenderer/basicTypes";

class DrawingCanvasCache {
  ele2DrawingCanvas: WeakMap<DrawingElement, HTMLCanvasElement> = new WeakMap();
}

export const drawingCanvasCache = new DrawingCanvasCache();
