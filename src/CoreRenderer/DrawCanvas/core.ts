import { Point, Vector } from "@flatten-js/core";
import { cloneDeep } from "lodash";
import {
  StrokeOptions,
  getStrokeOutlinePoints,
  getStrokePoints,
} from "perfect-freehand";
import { drawingCanvasCache } from "src/CoreRenderer/DrawCanvas/DrawingCanvas";
import { hexToRgb } from "src/CoreRenderer/DrawCanvas/colorUtils";
import { DrawingElement } from "src/CoreRenderer/basicTypes";
import {
  DrawingType,
  FreeDrawing,
} from "src/CoreRenderer/drawingElementsTypes";
import { potrace } from "src/Utils/portrace";
import { throttleRAF } from "src/animations/requestAniThrottle";
import { Scene } from "src/drawingElements/data/scene";
// Trim SVG path data so number are each two decimal points. This
// improves SVG exports, and prevents rendering errors on points
// with long decimals.
const TO_FIXED_PRECISION = /(\s?[A-Z]?,?-?[0-9]*\.[0-9]{0,2})(([0-9]|e|-)*)/g;

function med(A: number[], B: number[]) {
  return [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
}

// generate quatric Bézier Curves
function getSvgPathFromStroke(points: number[][]): string {
  if (!points.length) {
    return "";
  }

  const max = points.length - 1;

  return points
    .reduce(
      (acc, point, i, arr) => {
        if (i === max) {
          acc.push(point, med(point, arr[0]), "L", arr[0], "Z");
        } else {
          acc.push(point, med(point, arr[i + 1]));
        }
        return acc;
      },
      ["M", points[0], "Q"]
    )
    .join(" ")
    .replace(TO_FIXED_PRECISION, "$1");
}

export const throttledRenderDC = throttleRAF(renderDrawCanvas, {
  trailing: true,
});

export function renderDrawCanvas(
  sceneData: Scene,
  appCanvas: HTMLCanvasElement
) {
  const { elements } = sceneData;
  const appCtx = appCanvas.getContext("2d")!;
  elements.forEach((ele) => {
    let cachedCvs = drawingCanvasCache.ele2DrawingCanvas.get(ele);
    // 渐变的画笔需要实时更新
    if (
      cachedCvs === undefined ||
      sceneData.updatingElements[0]?.ele === ele ||
      (ele as FreeDrawing).strokeOptions?.haveTrailling
    ) {
      cachedCvs = createDrawingCvs(ele, appCanvas);
      if (cachedCvs) drawingCanvasCache.ele2DrawingCanvas.set(ele, cachedCvs);
    }
    if (cachedCvs) appCtx.drawImage(cachedCvs!, 0, 0);
  });
}

// 在该过程中会将ele上的points转换成outline
function createDrawingCvs(ele: DrawingElement, targetCvs: HTMLCanvasElement) {
  if (ele.points.length === 0) return;
  switch (ele.type) {
    case DrawingType.freeDraw:
      const freeDrawing = ele as FreeDrawing;
      const strokeOptions = freeDrawing.strokeOptions;
      const canvas = document.createElement("canvas");
      const _canvas = cloneDeep(canvas);
      const ctx = canvas.getContext("2d")!;
      const { strokeColor } = strokeOptions;
      const { points } = freeDrawing;
      ctx.strokeStyle = strokeColor;
      ctx.lineCap = "round";
      if (strokeOptions?.isCustom) {
        const { size } = strokeOptions;
        let vx = 0,
          vy = 0,
          spring = 0.5,
          splitNum = 10,
          diff = size! / 5,
          friction = 0.45,
          x = points[0].x,
          y = points[0].y,
          v = 0.5,
          r = 0,
          oldR,
          oldX,
          oldY,
          dR;

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
          dR = size! - v - r;

          oldX = x;
          oldY = y;

          x += vx;
          y += vy;

          for (let i = 0; i < splitNum; i++) {
            const ratio = i / splitNum;
            x = oldX + ratio * vx;
            y = oldY + ratio * vy;

            r = Math.max(oldR + ratio * dR, 1);

            drawStrokeLine(ctx, oldX, oldY, x, y, r + diff);

            drawStrokeLine(
              ctx,
              oldX + diff * 2,
              oldY + diff * 2,
              x + diff * 1.5,
              y + diff * 2,
              r
            );
            drawStrokeLine(
              ctx,
              oldX - diff,
              oldY - diff,
              x - diff,
              y - diff,
              r
            );
          }
        });

        const { process, getPath } = potrace(_canvas);
        process();
        const paths = getPath();
        console.log(paths);
        // freeDrawing.outline = paths[0];
        // const ptsArray = freeDrawing.outline.map((pt) => [pt.x, pt.y]);
        // const path = new Path2D(getSvgPathFromStroke(ptsArray));
        // path.moveTo(ptsArray[0][0], ptsArray[0][1]);
        // const rgbValues = hexToRgb(strokeColor);
        // ctx.fillStyle = `rgba(${rgbValues[0]}, ${rgbValues[1]}, ${rgbValues[2]}, ${ele.opacity})`;
        // ctx.fill(path);
      } else {
        const strokePoints = getStrokePoints(
          points.map((pt) => {
            const ptObj = new Point(pt.x, pt.y)
              .translate(
                new Vector(freeDrawing.position.x, freeDrawing.position.y)
              )
              .rotate(freeDrawing.rotation);

            return { x: ptObj.x, y: ptObj.y, pressure: pt.pressure };
          }),
          strokeOptions as StrokeOptions
        );

        const outlinePoints = getStrokeOutlinePoints(
          strokePoints,
          strokeOptions as StrokeOptions
        );

        freeDrawing.outline = outlinePoints.map(
          (pt) => new Point(pt[0], pt[1])
        );

        const path = new Path2D(getSvgPathFromStroke(outlinePoints));
        path.moveTo(outlinePoints[0][0], outlinePoints[0][1]);

        const rgbValues = hexToRgb(strokeColor);
        ctx.fillStyle = `rgba(${rgbValues[0]}, ${rgbValues[1]}, ${rgbValues[2]}, ${ele.opacity})`;
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
