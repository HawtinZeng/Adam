import { Box, Point as PointF, Vector } from "@flatten-js/core";
import * as d3c from "d3-color";
import { groupBy } from "lodash";
import {
  StrokeOptions,
  getStrokeOutlinePoints,
  getStrokePoints,
} from "perfect-freehand";
import { debugShowEleId } from "src/App";
import { drawingCanvasCache } from "src/CoreRenderer/DrawCanvas/DrawingCanvas";
import { Transform2DOperator } from "src/CoreRenderer/DrawCanvas/Transform2DOperator";
import { DrawingElement, Point } from "src/CoreRenderer/basicTypes";
import {
  DrawingType,
  FreeDrawing,
  ImageElement,
} from "src/CoreRenderer/drawingElementsTypes";
import { TransformHandles } from "src/CoreRenderer/utilsTypes";
import { throttleRAF } from "src/animations/requestAniThrottle";
import { Scene } from "src/drawingElements/data/scene";
import { coreThreadPool, logger } from "src/setup";
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

export const throttledRenderDC = throttleRAF(
  (s, c) => {
    renderDrawCanvas(s, c);
  },
  {
    trailing: true,
  }
);

export function renderDrawCanvas(
  sceneData: Scene,
  appCanvas: HTMLCanvasElement
) {
  const appCtx = appCanvas.getContext("2d")!;
  const groupedElements = groupBy(sceneData.updatingElements, (up) => up.type);
  groupedElements.addPoints?.forEach((checkUpdating) => {
    const { ele } = checkUpdating;
    let cachedCvs = drawingCanvasCache.ele2DrawingCanvas.get(checkUpdating.ele);
    cachedCvs = createDrawingCvs(ele, appCanvas);

    ele.eraserPolygons.forEach((_, idx) => {
      drawEraserOutline(ele, idx, cachedCvs!);
    });

    if (cachedCvs && checkUpdating?.oriImageData) {
      appCtx.putImageData(checkUpdating.oriImageData, 0, 0);
      drawingCanvasCache.ele2DrawingCanvas.set(ele, cachedCvs);
    }

    // 绘制checkUpdating到画布上
    if (cachedCvs && checkUpdating) {
      appCtx.drawImage(cachedCvs!, 0, 0);
    }
  });

  const { elements } = sceneData;
  // 绘制橡皮效果
  groupedElements.erase?.forEach((checkUpdating) => {
    const { ele } = checkUpdating;
    const cachedCvs = drawingCanvasCache.ele2DrawingCanvas.get(ele);

    if (cachedCvs) {
      drawEraserOutline(ele, checkUpdating.eraserOutlineIdx!, cachedCvs!);
      drawingCanvasCache.ele2DrawingCanvas.set(ele, cachedCvs);
    }
  });
  if (groupedElements.erase?.length > 0) {
    // 重绘全部元素
    redrawAllEles(appCtx, appCanvas, elements);
  }

  // Draw image scaling effect.
  groupedElements.scale?.forEach((t) => {
    const { ele } = t;
    if (t.oriImageData && ele.type === DrawingType.img) {
      const cachedCvs = createDrawingCvs(ele, appCanvas)!;
      drawingCanvasCache.ele2DrawingCanvas.set(ele, cachedCvs);

      appCtx.putImageData(t.oriImageData, 0, 0);
      appCtx.drawImage(cachedCvs, 0, 0);
    }
  });

  // Render transform handler
  if (sceneData.updatingElements.length > 0) {
    sceneData.updatingElements.forEach((u) => {
      if (u.type !== "transform") return;
      // 重绘全部元素
      redrawAllEles(appCtx, appCanvas, elements);
      if (u.ele.type === DrawingType.img) {
        const img = u.ele as ImageElement;
        const bbx = new Box(
          img.points[0].x,
          img.points[0].y + img.originalHeight * img.scale.y,
          img.points[0].x + img.originalWidth * img.scale.x,
          img.points[0].y
        );
        const handles = new Transform2DOperator(bbx);
        drawRectBorder(appCtx, bbx, handles.borderColor, handles.border);
        drawHandles(handles, appCtx);
      }
    });
  }
}

export const fillCircle = (
  context: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  stroke = true
) => {
  context.beginPath();
  context.arc(cx, cy, radius, 0, Math.PI * 2);
  context.fill();
  if (stroke) {
    context.stroke();
  }
};

export const rotate = (
  // target point to rotate
  x: number,
  y: number,
  // point to rotate against
  cx: number,
  cy: number,
  angle: number
): [number, number] =>
  // 𝑎′𝑥=(𝑎𝑥−𝑐𝑥)cos𝜃−(𝑎𝑦−𝑐𝑦)sin𝜃+𝑐𝑥
  // 𝑎′𝑦=(𝑎𝑥−𝑐𝑥)sin𝜃+(𝑎𝑦−𝑐𝑦)cos𝜃+𝑐𝑦.
  // https://math.stackexchange.com/questions/2204520/how-do-i-rotate-a-line-segment-in-a-specific-point-on-the-line
  [
    (x - cx) * Math.cos(angle) - (y - cy) * Math.sin(angle) + cx,
    (x - cx) * Math.sin(angle) + (y - cy) * Math.cos(angle) + cy,
  ];

const getIsDeletedFlag = (arr: Uint8ClampedArray) => {
  let sum = 0,
    length = arr.length,
    half = Math.floor(length / 2);
  let i: number = 0;
  for (i = 0; i < half; i++) {
    if ((i + 1) % 4 === 0) {
      sum += arr[i] + arr[length - i + 4 - 2];
    }
  }

  if (length % 2) {
    sum += arr[half];
  }
  return sum < 1000;
};

let globalAppCtx: CanvasRenderingContext2D | null = null,
  globalCvs: HTMLCanvasElement | null = null;
export function redrawAllEles(
  appCtx: CanvasRenderingContext2D | undefined,
  appCanvas: HTMLCanvasElement | undefined,
  elements: DrawingElement[]
) {
  if (appCtx) globalAppCtx = appCtx;
  if (appCanvas) globalCvs = appCanvas;
  if (!globalAppCtx || !globalCvs) {
    console.error("globalAppCtx or globalCvs is not initialized");
    return;
  }
  globalAppCtx.clearRect(0, 0, globalCvs.width, globalCvs.height);
  elements.forEach((el) => {
    const cachedCvs = drawingCanvasCache.ele2DrawingCanvas.get(el);
    globalAppCtx!.drawImage(cachedCvs!, 0, 0);
  });
}

export function removeBlankEle(
  els: DrawingElement[],
  sceneState: Scene,
  updateAtomStatus: () => any
) {
  els.forEach((el) => {
    if (el.type === DrawingType.img) return;
    const prevLen = sceneState.elements.length;
    const elCvs = drawingCanvasCache.ele2DrawingCanvas.get(el)!;
    const ctx = elCvs.getContext("2d", { willReadFrequently: true })!;
    const imageData = ctx.getImageData(0, 0, elCvs.width, elCvs.height);
    coreThreadPool.exec(getIsDeletedFlag, [imageData.data]).then((r) => {
      el.isDeleted = r;
      sceneState.elements = sceneState.elements.filter((el) => !el.isDeleted);
      updateAtomStatus();
      if (prevLen - sceneState.elements.length > 0)
        logger.log(`removed ${prevLen - sceneState.elements.length} elements`);
    });
  });
}

export function createDrawingCvs(
  ele: DrawingElement,
  targetCvs: HTMLCanvasElement
) {
  if (ele.points.length === 0) return;

  const canvas = document.createElement("canvas");
  canvas.width = targetCvs.width;
  canvas.height = targetCvs.height;
  const ctx = canvas.getContext("2d")!;

  switch (ele.type) {
    case DrawingType.freeDraw:
      const freeDrawing = ele as FreeDrawing;
      const strokeOptions = freeDrawing.strokeOptions;

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
      break;
    case DrawingType.img: {
      const i = ele as ImageElement;
      if (!i.image) return;
      ctx.drawImage(
        i.image,
        i.points[0].x,
        i.points[0].y,
        i.image.width * i.scale.x,
        i.image.height * i.scale.y
      );
      break;
    }
  }

  if (debugShowEleId) {
    const textPos = ele.points[0];
    drawText(ctx, textPos, ele.id);
  }

  return canvas;
}

function drawText(ctx: CanvasRenderingContext2D, pos: Point, text: string) {
  const fontSize = 30;
  const fontStyle = "Arial";

  ctx.font = `${fontSize}px ${fontStyle}`;
  ctx.fillText(text, pos.x, pos.y);
}

function drawSvgPathOnCanvas(
  ctx: CanvasRenderingContext2D,
  svgPathData: string,
  color: d3c.Color,
  translate: PointF
) {
  ctx.save();
  const box = getBoundingBoxOfSVGPath(svgPathData);
  if (box)
    ctx.translate(translate.x - box.width / 2, translate.y - box.height / 2);
  else ctx.translate(translate.x, translate.y);

  const path = new Path2D(svgPathData);
  ctx.fillStyle = color.formatHex();
  ctx.fill(path);
  ctx.restore();
}

function getBoundingBoxOfSVGPath(svgPathData: string): Box | undefined {
  const pathElement = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "path"
  );
  const svgElement = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "svg"
  );
  pathElement.setAttribute("d", svgPathData);

  svgElement.appendChild(pathElement);
  document.body.appendChild(svgElement);
  if (pathElement) {
    const db = pathElement.getBBox();
    const bbx = new Box(0, 0, db.width, db.height);
    document.body.removeChild(svgElement);
    return bbx;
  }
  return undefined;
}

// Ex
function drawEraserOutline(
  ele: DrawingElement,
  updatingEraser: number,
  canvas: HTMLCanvasElement
) {
  const eraserOutlinePoints = ele.eraserPolygons;
  const ctx = canvas.getContext("2d")!;

  ctx.globalCompositeOperation = "destination-out";
  if (updatingEraser !== undefined && eraserOutlinePoints[updatingEraser])
    fillPolygon(
      [...eraserOutlinePoints[updatingEraser].vertices].map((pt) => {
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

export function drawCircle(
  ctx: CanvasRenderingContext2D,
  circle: Flatten.Circle
) {
  ctx.beginPath();
  ctx.arc(circle.center.x, circle.center.y, circle.r, 0, 2 * Math.PI); // Full circle
  ctx.fillStyle = "red";
  ctx.fill();
}

function drawHandles(op: Transform2DOperator, ctx: CanvasRenderingContext2D) {
  Object.keys(op.handles).forEach((k) => {
    const h = op.handles[k as keyof TransformHandles] as Box;
    if (k === "ro") {
      drawSvgPathOnCanvas(
        ctx,
        `M11.031 24a11.033 11.033 0 0 0 1-22.021V0L7.125 4.1 12.033 8V6.007a7.032 7.032 0 0 1-1 13.993A7.032 7.032 0 0 1 4 13H0a11.026 11.026 0 0 0 11.031 11z`,
        op.borderColor,
        h.center
      );
    } else {
      drawRect(ctx, h, op.fillColor);
      drawRectBorder(ctx, h, op.borderColor, op.border);
    }
  });
}

function drawRect(ctx: CanvasRenderingContext2D, rect: Box, color: d3c.Color) {
  ctx.save();
  ctx.fillStyle = color.formatHex();
  ctx.fillRect(rect.xmin, rect.ymin - rect.height, rect.width, rect.height);
  ctx.restore();
}

function drawRectBorder(
  ctx: CanvasRenderingContext2D,
  rect: Box,
  color: d3c.Color,
  thickness: number
) {
  ctx.save();
  ctx.strokeStyle = color.formatHex();
  ctx.lineWidth = thickness;
  ctx.strokeRect(rect.xmin, rect.ymin - rect.height, rect.width, rect.height);
  ctx.restore();
}
