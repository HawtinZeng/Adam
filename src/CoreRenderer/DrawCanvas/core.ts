import { getStroke } from "perfect-freehand";
import { DrawingElement } from "src/coreRenderer/basicTypes";
import {
  FreeDrawing,
  DrawingType,
} from "src/coreRenderer/drawingElementsTypes";
import { Point, Vector } from "@flatten-js/core";
import { Scene } from "src/drawingElements/data/scene";
export function renderDrawCanvas(
  sceneData: Scene,
  appCanvas: HTMLCanvasElement
) {
  // set scale.
  const { elements } = sceneData;
  const appCtx = appCanvas.getContext("2d")!;
  elements.forEach((ele) => {
    const drawingCvs = createDrawingCvs(ele, appCanvas);
    appCtx.drawImage(drawingCvs!, 0, 0);
  });
}

function createDrawingCvs(ele: DrawingElement, targetCvs: HTMLCanvasElement) {
  switch (ele.type) {
    case DrawingType.freeDraw:
      const freeDrawing = ele as FreeDrawing;
      const canvas = document.createElement("canvas");
      canvas.width = targetCvs.offsetWidth;
      canvas.height = targetCvs.offsetHeight;
      const ctx = canvas.getContext("2d")!;
      const { points, strokeColor, strokeWidth } = freeDrawing;
      ctx.save();
      ctx.fillStyle = strokeColor;
      const outlinePoints = getStroke(
        points.map((pt) => {
          const ptObj = new Point(pt.x, pt.y)
            .translate(
              new Vector(freeDrawing.position.x, freeDrawing.position.y)
            )
            .rotate(freeDrawing.rotation);

          return { x: ptObj.x, y: ptObj.y };
        }),
        {
          size: strokeWidth,
        }
      );
      const path = new Path2D();
      path.moveTo(outlinePoints[0][0], outlinePoints[0][1]);
      outlinePoints.forEach((pt) => {
        path.lineTo(pt[0], pt[1]);
      });
      ctx.fill(path);
      return canvas;
  }
  return;
}
