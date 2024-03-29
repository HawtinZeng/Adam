import { getStroke } from "perfect-freehand"
import pointsJson from "test/points.json"

export function renderDrawCanvas(sceneData: SceneData, appCanvas: HTMLCanvasElement) {
  // set scale.
    const { scale, elements } = sceneData;
    const ctx = appCanvas.getContext("2d")!;
    elements.forEach(ele => {
      const drawingCvs = createDrawingCvs(ele);
    })
  // set canvas background.
  // draw with CanvaElement.
  
}
function createDrawingCvs(ele: DrawingElement) {
  switch (ele.type) {
    case "FreeDrawing":
      const freeDrawing = ele as FreeDrawing;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext("2d")!;
      const { points } = ele;
      ctx.fillStyle = "red";
      const outlinePoints = getStroke()
      break;
  
    default:
      break;
  }
}