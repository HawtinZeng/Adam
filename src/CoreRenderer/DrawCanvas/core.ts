import { Point as PointF, Polygon, Vector } from "@zenghawtin/graph2d";
import * as d3c from "d3-color";
import { groupBy } from "lodash";
import {
  StrokeOptions,
  getStrokeOutlinePoints,
  getStrokePoints,
} from "perfect-freehand";
import { debugShowEleId, debugShowHandlesPosition } from "src/App";
import { drawingCanvasCache } from "src/CoreRenderer/DrawCanvas/DrawingCanvas";
import {
  Transform2DOperator,
  TransformHandle,
} from "src/CoreRenderer/DrawCanvas/Transform2DOperator";
import { DrawingElement, Point } from "src/CoreRenderer/basicTypes";
import {
  DrawingType,
  FreeDrawing,
  ImageElement,
} from "src/CoreRenderer/drawingElementsTypes";
import { TransformHandles } from "src/CoreRenderer/utilsTypes";
import { throttleRAF } from "src/animations/requestAniThrottle";
import {
  ActionType,
  Scene,
  UpdatingElement,
} from "src/drawingElements/data/scene";
import { coreThreadPool, logger } from "src/setup";
// @ts-ignore
import SVGPathCommander from "svg-path-commander";

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
  const groupedElements = groupBy<UpdatingElement>(
    sceneData.updatingElements,
    (up) => up.type
  ) as Partial<Record<ActionType, UpdatingElement[]>>;
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
    if (cachedCvs && checkUpdating) appCtx.drawImage(cachedCvs!, 0, 0);
  });

  const { elements } = sceneData;
  // 绘制橡皮效果
  groupedElements.erase?.forEach((checkUpdating) => {
    const { ele } = checkUpdating;
    const cachedCvs = createDrawingCvs(ele, appCanvas)!;
    drawingCanvasCache.ele2DrawingCanvas.set(ele, cachedCvs);

    checkUpdating.ele.eraserPolygons.forEach((_, idx) => {
      drawEraserOutline(ele, idx, cachedCvs!);
    });
  });
  if (groupedElements.erase?.length && groupedElements.erase.length > 0) {
    // 重绘全部元素
    redrawAllEles(appCtx, appCanvas, elements);
  }

  // create image cache, and draw it to app context
  if (groupedElements.addImg?.length && groupedElements.addImg.length > 0) {
    redrawAllEles(appCtx, appCanvas, elements);
    groupedElements.addImg?.forEach((t) => {
      const { ele } = t;
      if (t.oriImageData && ele.type === DrawingType.img) {
        const cachedCvs = createDrawingCvs(ele, appCanvas)!;
        drawingCanvasCache.ele2DrawingCanvas.set(ele, cachedCvs);

        appCtx.save();
        appCtx.translate(ele.position.x, ele.position.y);
        appCtx.scale(ele.scale.x, ele.scale.y);
        appCtx.drawImage(cachedCvs, 0, 0);

        appCtx.restore();
      }
    });
  }

  // render transform handler
  groupedElements.transform?.forEach((u) => {
    if (u.ele.type === DrawingType.img) {
      const img = u.ele as ImageElement;
      redrawAllEles(appCtx, appCanvas, elements, u.ele);

      const handles = new Transform2DOperator(
        img.polygons[0],
        img.rotation,
        appCtx
      );
      u.handles = handles;

      const cornerPolygon = new Polygon(
        handles.rect.polygon.vertices.filter((_, idx) => idx % 2 === 0)
      );

      drawRectBorder(
        appCtx,
        cornerPolygon,
        handles.borderColor,
        handles.border
      );

      drawHandles(handles, appCtx);
    }
  });
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
/**
 *
 * @param appCtx
 * @param appCanvas
 * @param elements 需要重绘的元素，从cache中拿图像
 * @param u 不从cache中拿图像的元素，重新新建cache
 * @returns
 */
export function redrawAllEles(
  appCtx: CanvasRenderingContext2D | undefined,
  appCanvas: HTMLCanvasElement | undefined,
  elements: DrawingElement[],
  u?: DrawingElement
) {
  if (appCtx) globalAppCtx = appCtx;
  if (appCanvas) globalCvs = appCanvas;
  if (!globalAppCtx || !globalCvs) {
    console.error("globalAppCtx or globalCvs is not initialized");
    return;
  }
  globalAppCtx.clearRect(0, 0, globalCvs.width, globalCvs.height);
  elements.forEach((el) => {
    let cachedCvs = drawingCanvasCache.ele2DrawingCanvas.get(el);
    if (el.type === DrawingType.img) {
      const cachedCvs = drawingCanvasCache.ele2DrawingCanvas.get(el)!;
      if (el.type === "img") {
        const c = el.polygons[0]!.box.center;
        globalAppCtx!.save();

        globalAppCtx!.translate(c.x, c.y);
        globalAppCtx!.rotate(el.rotation);
        globalAppCtx!.translate(-c.x, -c.y);

        globalAppCtx!.translate(el.position.x, el.position.y);
        globalAppCtx!.scale(el.scale.x, el.scale.y);
        globalAppCtx!.drawImage(cachedCvs, 0, 0);

        globalAppCtx!.restore();
      }
    } else {
      globalAppCtx!.drawImage(
        cachedCvs!,
        0,
        0,
        cachedCvs!.width,
        cachedCvs!.height
      );
    }
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

  const canvas = document.createElement("canvas") as HTMLCanvasElement;
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

      if (debugShowHandlesPosition) {
        drawText(
          ctx,
          ele.points[0],
          `x: ${ele.points[0].x}, y: ${ele.points[0].y}`
        );
      }

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

      ctx.drawImage(i.image, 0, 0, i.image.width, i.image.height);

      break;
    }
  }

  if (debugShowEleId) {
    const textPos = ele.points[0];
    drawText(ctx, textPos, ele.id);
  }

  return canvas;
}

function drawText(
  ctx: CanvasRenderingContext2D,
  pos: Point,
  text: string,
  color: string = "red"
) {
  ctx.save();
  const fontSize = 30;
  const fontStyle = "Arial";

  ctx.fillStyle = color;
  ctx.font = `${fontSize}px ${fontStyle}`;
  ctx.fillText(text, pos.x, pos.y);
  ctx.restore();
}

function drawSvgPathOnCanvas(
  ctx: CanvasRenderingContext2D,
  svgPathData: string,
  color: d3c.Color
) {
  ctx.save();

  const path = new Path2D(svgPathData);
  ctx.fillStyle = color.formatHex();
  ctx.fill(path);

  ctx.restore();
}

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
    const h = op.handles[k as keyof TransformHandles] as Polygon;
    const rotationIcon = new SVGPathCommander(
      "M11.031 24a11.033 11.033 0 0 0 1-22.021V0L7.125 4.1 12.033 8V6.007a7.032 7.032 0 0 1-1 13.993A7.032 7.032 0 0 1 4 13H0a11.026 11.026 0 0 0 11.031 11z"
    );
    rotationIcon.transform({
      translate: [h.box.center.x - 10, h.box.center.y - 10],
    });
    if (k === TransformHandle.ro) {
      drawSvgPathOnCanvas(ctx, rotationIcon.toString(), op.borderColor);
    } else {
      drawRectFill(ctx, h, op.fillColor);
      drawRectBorder(ctx, h, op.borderColor, op.border);
      // if (debugShowHandlesPosition) {
      //   drawText(ctx, h.center, `x: ${h.center.x}, y: ${h.center.y}`);
      // }
    }
  });
}

function drawRectFill(
  ctx: CanvasRenderingContext2D,
  rect: Polygon,
  color: d3c.Color
) {
  ctx.save();

  const vs = rect.vertices;
  ctx.fillStyle = color.formatHex();

  ctx.beginPath();
  ctx.moveTo(vs[0].x, vs[0].y);
  ctx.lineTo(vs[1].x, vs[1].y);
  ctx.lineTo(vs[2].x, vs[2].y);
  ctx.lineTo(vs[3].x, vs[3].y);
  ctx.lineTo(vs[0].x, vs[0].y);
  ctx.closePath();

  ctx.fill();

  ctx.restore();
}

function drawRectBorder(
  ctx: CanvasRenderingContext2D,
  rect: Polygon,
  color: d3c.Color,
  thickness: number
) {
  ctx.save();

  ctx.strokeStyle = color.formatHex();
  ctx.lineWidth = thickness;

  const vs = rect.vertices;

  ctx.beginPath();
  ctx.moveTo(vs[0].x, vs[0].y);
  ctx.lineTo(vs[1].x, vs[1].y);
  ctx.lineTo(vs[2].x, vs[2].y);
  ctx.lineTo(vs[3].x, vs[3].y);
  ctx.lineTo(vs[0].x, vs[0].y);

  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

export function drawPolygonPointIndex(
  ctx: CanvasRenderingContext2D,
  polygon: Polygon
) {
  ctx.save();

  ctx.beginPath();
  ctx.moveTo(polygon.vertices[0].x, polygon.vertices[0].y);
  polygon.vertices.forEach((pt, i) => {
    ctx.lineTo(pt.x, pt.y);
    const fontSize = 20;
    const fontStyle = "Arial";
    ctx.fillStyle = "red";
    ctx.font = `${fontSize}px ${fontStyle}`;
    ctx.fillText(`${i}`, pt.x, pt.y);
  });
  ctx.closePath();
  ctx.stroke();

  ctx.restore();
}
