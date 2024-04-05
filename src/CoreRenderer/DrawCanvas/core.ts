import { StrokeOptions, getStroke } from "perfect-freehand";
import { DrawingElement } from "src/coreRenderer/basicTypes";
import {
  FreeDrawing,
  DrawingType,
} from "src/coreRenderer/drawingElementsTypes";
import { Point, Vector } from "@flatten-js/core";
import { Scene } from "src/drawingElements/data/scene";
import { drawingCanvasCache } from "src/coreRenderer/drawCanvas/DrawingCanvas";
import {
  add,
  dist2,
  div,
  dpr,
  len,
  len2,
  mul,
  per,
  sub,
} from "src/coreRenderer/drawCanvas/vec";
export function renderDrawCanvas(
  sceneData: Scene,
  appCanvas: HTMLCanvasElement,
  strokeOptions?: StrokeOptions
) {
  // set scale.
  const { elements } = sceneData;
  const appCtx = appCanvas.getContext("2d")!;
  elements.forEach((ele) => {
    let cachedCvs = drawingCanvasCache.ele2DrawingCanvas.get(ele);
    if (cachedCvs === undefined || sceneData.updatingElements.includes(ele)) {
      cachedCvs = createDrawingCvs(ele, appCanvas, strokeOptions);
      if (cachedCvs) drawingCanvasCache.ele2DrawingCanvas.set(ele, cachedCvs);
    }

    if (cachedCvs) appCtx.drawImage(cachedCvs!, 0, 0);
  });
}

function createDrawingCvs(
  ele: DrawingElement,
  targetCvs: HTMLCanvasElement,
  strokeOptions?: StrokeOptions
) {
  switch (ele.type) {
    case DrawingType.freeDraw:
      const freeDrawing = ele as FreeDrawing;
      const canvas = document.createElement("canvas");
      canvas.width = targetCvs.offsetWidth;
      canvas.height = targetCvs.offsetHeight;
      const ctx = canvas.getContext("2d")!;
      const { points, strokeColor } = freeDrawing;
      ctx.save();
      ctx.fillStyle = strokeColor;
      ctx.lineCap = "round";
      let outlinePoints: number[][];
      if (strokeOptions?.isCustom) {
        // check
        if (points.length < 2) return;

        const { size } = strokeOptions;
        let vx = 0,
          vy = 0,
          spring = 0.5,
          splitNum = 10,
          diff = size / 5,
          friction = 0.45,
          x = points[0].x,
          y = points[0].y,
          v = 0.5,
          r = 0,
          oldR,
          oldX,
          oldY;

        points.forEach((pt, idx) => {
          if (idx === 0) {
            return;
          }
          vx += (pt.x - x) * spring;
          vy += (pt.y - y) * spring;
          vx *= friction;
          vy *= friction;

          v += Math.sqrt(vx * vx + vy * vy) - v;
          v *= 0.6;

          oldR = r;
          r = size! - v;

          oldX = x;
          oldY = y;

          x += vx;
          y += vy;

          for (let i = 0; i < splitNum; i++) {
            x = oldX + (i / splitNum) * vx;
            y = oldY + (i / splitNum) * vy;

            oldR += (r - oldR) / splitNum;
            oldR = Math.max(oldR, 1);

            drawStrokeLine(ctx, oldX, oldY, x, y, oldR + diff);
            drawStrokeLine(
              ctx,
              oldX + diff * 2,
              oldY + diff * 2,
              x + diff * 1.5,
              y + diff * 2,
              oldR
            );
            drawStrokeLine(
              ctx,
              oldX - diff,
              oldY - diff,
              x - diff,
              y - diff,
              oldR
            );
          }
        });
      } else {
        outlinePoints = getStroke(
          points.map((pt) => {
            const ptObj = new Point(pt.x, pt.y)
              .translate(
                new Vector(freeDrawing.position.x, freeDrawing.position.y)
              )
              .rotate(freeDrawing.rotation);

            return { x: ptObj.x, y: ptObj.y };
          })
        );

        const path = new Path2D();
        path.moveTo(outlinePoints[0][0], outlinePoints[0][1]);
        outlinePoints.forEach((pt) => {
          path.lineTo(pt[0], pt[1]);
        });
        ctx.fill(path);
      }

      return canvas;
    default:
      return document.createElement("canvas");
  }
}

function drawStrokeLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  width: number
) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.lineWidth = width;

  ctx.stroke();
}
