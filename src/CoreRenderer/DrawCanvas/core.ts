import { Point as PointF, Vector } from "@flatten-js/core";
import {
  StrokeOptions,
  getStrokeOutlinePoints,
  getStrokePoints,
} from "perfect-freehand";
import { drawingCanvasCache } from "src/CoreRenderer/DrawCanvas/DrawingCanvas";
import { DrawingElement } from "src/CoreRenderer/basicTypes";
import {
  DrawingType,
  FreeDrawing,
} from "src/CoreRenderer/drawingElementsTypes";
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

    const checkUpdating = sceneData.updatingElements.find(
      (up) => up.ele === ele
    );

    // 渐变的画笔需要实时更新
    if (
      cachedCvs === undefined ||
      checkUpdating?.type === "addPoints" ||
      (ele as FreeDrawing).strokeOptions?.haveTrailling
    ) {
      cachedCvs = createDrawingCvs(ele, appCanvas);

      ele.eraserOutlines.forEach((_, idx) => {
        drawEraserOutline(ele, idx, cachedCvs!);
      });

      if (cachedCvs) drawingCanvasCache.ele2DrawingCanvas.set(ele, cachedCvs);
    }

    // 将一个eraserOutline叠加至element canvas上
    if (checkUpdating?.type === "erase") {
      drawEraserOutline(ele, checkUpdating.eraserOutlineIdx!, cachedCvs!);
    }

    if (cachedCvs) appCtx.drawImage(cachedCvs!, 0, 0);
  });
}

export function createDrawingCvs(
  ele: DrawingElement,
  targetCvs: HTMLCanvasElement
) {
  if (ele.points.length === 0) return;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  switch (ele.type) {
    case DrawingType.freeDraw:
      const freeDrawing = ele as FreeDrawing;
      const strokeOptions = freeDrawing.strokeOptions;
      canvas.width = targetCvs.width;
      canvas.height = targetCvs.height;

      const { strokeColor } = strokeOptions;
      const { points } = freeDrawing;
      ctx.strokeStyle = strokeColor!;
      ctx.lineCap = "round";
      ctx.fillStyle = strokeColor!;
      if (strokeOptions?.isCtxStroke) {
        let { size } = strokeOptions;

        let vx = 0,
          vy = 0,
          spring = 0.5,
          splitNum = 3,
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
        if (points.length === 1) {
          ctx.arc(points[0].x, points[0].y, size!, 0, Math.PI * 2, false);
          ctx.fill();
        }
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
      } else {
        const strokePoints = getStrokePoints(
          points.map((pt) => {
            const ptObj = new PointF(pt.x, pt.y)
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
        fillPolygon(outlinePoints, strokeColor!, ctx);
      }
  }

  return canvas;
}

function drawEraserOutline(
  ele: DrawingElement,
  updatingEraser: number,
  canvas: HTMLCanvasElement
) {
  const eraserOutlinePoints = ele.eraserOutlines;
  const ctx = canvas.getContext("2d")!;

  ctx.globalCompositeOperation = "destination-out";
  if (updatingEraser !== undefined && eraserOutlinePoints[updatingEraser])
    fillPolygon(
      eraserOutlinePoints[updatingEraser].map((pt) => {
        return [pt.x, pt.y];
      }),
      "rgb(100 0 0 / 100%)",
      ctx
    );
  ctx.globalCompositeOperation = "source-over";
}

export function fillPolygon(
  outlinePoints: number[][],
  color: string | CanvasGradient,
  ctx: CanvasRenderingContext2D
) {
  if (outlinePoints.length === 0) return;
  const p = getSvgPathFromStroke(outlinePoints);
  const path = new Path2D(p);
  path.moveTo(outlinePoints[0][0], outlinePoints[0][1]);

  ctx.fillStyle = color;
  ctx.fill(path);
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
