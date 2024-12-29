import { Point, Point as PointZ, Polygon, Vector } from "@zenghawtin/graph2d";

import * as d3c from "d3-color";
import { groupBy } from "lodash";
import {
  StrokeOptions,
  getStrokeOutlinePoints,
  getStrokePoints,
} from "perfect-freehand";
import {
  debugShowEleId,
  debugShowHandlesPosition,
  showEleId,
  showElePtLength,
} from "src/App";
import {
  Transform2DOperator,
  TransformHandle,
} from "src/CoreRenderer/DrawCanvas/Transform2DOperator";
import { drawingCanvasCache } from "src/CoreRenderer/DrawCanvas/canvasCache";
import { DrawingElement } from "src/CoreRenderer/basicTypes";
import {
  ArrowShapeElement,
  CircleShapeElement,
  DrawingType,
  FreeDrawing,
  ImageElement,
  PolylineShapeElement,
  RectangleShapeElement,
} from "src/CoreRenderer/drawingElementsTemplate";
import { TransformHandles } from "src/CoreRenderer/utilsTypes";
import { throttleRAF } from "src/animations/requestAniThrottle";
import {
  ActionType,
  Scene,
  UpdatingElement,
} from "src/drawingElements/data/scene";
import { coreThreadPool, logger } from "src/setup";
import { globalSynchronizer } from "src/state/synchronizer";
import { Text } from "src/text/text";
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
/**
 * 注意这个方法不会清掉已有的绘图，仅会渲染更新的元素：updatingElements
 * @param sceneData 场景中的数据
 * @param appCanvas canvasAtom
 */
export function renderDrawCanvas(
  sceneData: Scene,
  appCanvas: HTMLCanvasElement
) {
  // logger.log(sceneData.elements[0]?.id);
  const appCtx = appCanvas.getContext("2d")!;

  if (appCtx) globalAppCtx = appCtx;
  if (appCanvas) globalCvs = appCanvas;

  const groupedElements = groupBy<UpdatingElement>(
    sceneData.updatingElements,
    (up) => up.type
  ) as Partial<Record<ActionType, UpdatingElement[]>>;

  // console.log("groupedElements", JSON.stringify(groupedElements));
  groupedElements.addPoints?.forEach((checkUpdating) => {
    const { ele } = checkUpdating;
    if (ele.needCacheCanvas) {
      let cachedCvs = drawingCanvasCache.ele2DrawingCanvas.get(
        checkUpdating.ele
      );
      cachedCvs = createDrawingCvs(ele, appCanvas);

      appCtx.putImageData(checkUpdating.oriImageData!, 0, 0);
      drawingCanvasCache.ele2DrawingCanvas.set(ele, cachedCvs!);

      // 绘制checkUpdating到画布上
      if (cachedCvs) appCtx.drawImage(cachedCvs!, 0, 0);
    } else {
      appCtx.putImageData(checkUpdating.oriImageData!, 0, 0);
      drawNeedntCacheEle(ele);
    }
  });

  const { elements } = sceneData;
  // 绘制橡皮效果
  groupedElements.erase?.forEach((checkUpdating) => {
    const { ele } = checkUpdating;
    const cachedCvs = createDrawingCvs(ele, appCanvas)!;
    if (!cachedCvs) return;
    drawingCanvasCache.ele2DrawingCanvas.set(ele, cachedCvs);

    checkUpdating.ele.excludeArea.forEach((_, idx) => {
      drawEraserOutline(ele, idx, cachedCvs!);
    });
  });
  if (groupedElements.erase?.length && groupedElements.erase.length > 0) {
    // forcely redraw all elements with cache
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
    const img = u.ele as ImageElement;
    if (!img.boundary[0]) return;
    let handleOperator: Transform2DOperator;
    if (u.ele.type !== DrawingType.freeDraw) {
      handleOperator = new Transform2DOperator(
        img.boundary[0],
        img.rotation,
        appCtx,
        Math.sign(u.ele.scale.y) === -1
      );
      u.handleOperator = handleOperator;
      redrawAllEles(
        appCtx,
        appCanvas,
        elements,
        u.ele,
        handleOperator.draw.bind(handleOperator)
      );
    } else {
      const free = u.ele as FreeDrawing;
      const freeDrawBox = new Polygon(free.oriBoundary[0].box)
        .translate(new Vector(u.ele.position.x, u.ele.position.y))
        .translate(
          new Vector(
            -free.rotateOrigin.x - free.scaleOriginCorrection.x,
            -free.rotateOrigin.y - free.scaleOriginCorrection.y
          )
        )
        .scale(free.scale.x, free.scale.y)
        .translate(
          new Vector(
            free.rotateOrigin.x + free.scaleOriginCorrection.x,
            free.rotateOrigin.y + free.scaleOriginCorrection.y
          )
        )
        .rotate(free.rotation, free.rotateOrigin);

      u.handleOperator = handleOperator = new Transform2DOperator(
        freeDrawBox,
        img.rotation,
        appCtx,
        Math.sign(u.ele.scale.y) === -1,
        undefined
      );
      redrawAllEles(
        appCtx,
        appCanvas,
        elements,
        u.ele,
        handleOperator.draw.bind(handleOperator)
      );
    }
  });
}

export function clearMainCanvas() {
  if (!globalAppCtx || !globalCvs) return;
  globalAppCtx.clearRect(0, 0, globalCvs.width, globalCvs.height);
}

export function restoreOriginalmage(u: UpdatingElement) {
  if (!globalAppCtx) return;
  globalAppCtx!.putImageData(u.oriImageData!, 0, 0);
}

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
 * @param appCtx
 * @param appCanvas
 * @param elements 需要重绘的元素，从cache中拿图像
 * @param uE 需要重新绘制operator的元素
 * @returns
 */
export function redrawAllEles(
  appCtx: CanvasRenderingContext2D | undefined,
  appCanvas: HTMLCanvasElement | undefined,
  elements: DrawingElement[],
  uE?: DrawingElement,
  drawCurrentUpdatingHandle?: () => void
) {
  if (!globalAppCtx || !globalCvs) {
    console.error("globalAppCtx or globalCvs is not initialized");
    return;
  }

  globalAppCtx.clearRect(0, 0, globalCvs.width, globalCvs.height);

  elements.forEach((el, idx) => {
    if ((el as FreeDrawing).strokeOptions?.haveTrailling) return;
    if (el.needCacheCanvas) {
      let cachedCvs = drawingCanvasCache.ele2DrawingCanvas.get(el);

      if (!cachedCvs)
        throw new Error(`cannot find the canvas cache of ${el.id}`);

      drawingCanvasCache.ele2DrawingCanvas.set(el, cachedCvs);

      globalAppCtx!.save();
      // For image element.
      if (el.type === DrawingType.img) {
        const img = el as ImageElement;
        if (el.type === "img") {
          const rotateOrigin = img.rotateOrigin;
          globalAppCtx!.translate(rotateOrigin.x, rotateOrigin.y);
          globalAppCtx!.rotate(el.rotation);
          globalAppCtx!.translate(-rotateOrigin.x, -rotateOrigin.y);

          globalAppCtx!.translate(el.position.x, el.position.y);
          globalAppCtx!.scale(el.scale.x, el.scale.y);
          globalAppCtx!.drawImage(cachedCvs, 0, 0);

          globalAppCtx!.restore();
        }
      } else if (el.type === DrawingType.text) {
        const text = el as Text;
        globalAppCtx!.drawImage(
          cachedCvs!,
          text.position.x,
          text.position.y,
          cachedCvs!.width,
          cachedCvs!.height
        );
      } else if (el.type === DrawingType.freeDraw) {
        const free = el as FreeDrawing;
        const rotateOrigin = el.rotateOrigin;

        globalAppCtx!.translate(rotateOrigin.x, rotateOrigin.y);
        globalAppCtx!.rotate(el.rotation);

        globalAppCtx!.translate(
          free.scaleOriginCorrection?.x ?? 0,
          free.scaleOriginCorrection?.y ?? 0
        );
        globalAppCtx!.scale(el.scale.x, el.scale.y);
        globalAppCtx!.translate(
          -free.scaleOriginCorrection?.x ?? 0,
          -free.scaleOriginCorrection?.y ?? 0
        );
        globalAppCtx!.translate(-rotateOrigin.x, -rotateOrigin.y);

        globalAppCtx!.translate(el.position.x, el.position.y);

        globalAppCtx!.drawImage(cachedCvs!, 0, 0);
      }
      globalAppCtx!.restore();
    } else {
      drawNeedntCacheEle(el);
    }

    if (el === uE) {
      drawCurrentUpdatingHandle?.();
    }

    if (showElePtLength) {
      const textPos = el.points[0];
      drawText(globalAppCtx!, textPos, el.points.length.toString());
    }

    if (showEleId) {
      const textPos = el.points[0];
      drawText(globalAppCtx!, textPos, el.id);
    }

    if (debugShowEleId) {
      const textPos = el.points[0];
      drawText(globalAppCtx!, textPos, el.id);
    }
    // clip the area beyond window
    const eleCliping = globalSynchronizer.value?.eleToBox.get(el);
    if (eleCliping) {
      globalAppCtx!.beginPath();
      globalAppCtx!.rect(
        eleCliping.xmin,
        eleCliping.ymin,
        eleCliping.width,
        eleCliping.height
      );
      globalAppCtx!.clip();
    }
  });
}

// after transform FreeDraw, we need to record the pts of FreeDraw, then we need to update the cached canvas of this element. we use outlinePoints to recorder the pts of this FreeDraw element
export function createFreeDrawCvs(
  ele: DrawingElement,
  appCanvas: HTMLCanvasElement
) {
  if (ele.type === DrawingType.freeDraw) {
    const freeDraw = ele as FreeDrawing;

    const numberPts = freeDraw.outlinePoints.map((p) => {
      return [p.x, p.y];
    });

    const canvas = document.createElement("canvas") as HTMLCanvasElement;
    canvas.width = appCanvas.width;
    canvas.height = appCanvas.height;
    const ctx = canvas.getContext("2d")!;
    fillPolygon(numberPts, freeDraw.strokeColor!, ctx);
    drawingCanvasCache.ele2DrawingCanvas.set(ele, canvas!);
    return canvas;
  }
}

function drawNeedntCacheEle(el: DrawingElement) {
  if (!globalAppCtx) return;
  if (el.type === DrawingType.arrow) {
    const a = el as ArrowShapeElement;

    if (a.points.length === 2) {
      const [endPos, startPos] = [
        { x: a.points[1].x + a.position.x, y: a.points[1].y + a.position.y },
        { x: a.points[0].x + a.position.x, y: a.points[0].y + a.position.y },
      ];

      const reverseDir = new Vector(
        startPos.x - endPos.x,
        startPos.y - endPos.y
      );
      const verticalToBottom = new Vector(0, 1);
      if (reverseDir.length === 0 || verticalToBottom.length === 0) return;

      globalAppCtx!.save();

      globalAppCtx!.beginPath();
      globalAppCtx!.moveTo(startPos.x, startPos.y);
      globalAppCtx!.lineTo(endPos.x, endPos.y);

      globalAppCtx!.lineCap = "round";
      globalAppCtx!.lineWidth = a.strokeWidth;
      globalAppCtx!.strokeStyle = a.strokeColor;
      if (a.strokeStyle === "dashed") {
        globalAppCtx!.setLineDash([1, 8]);
        globalAppCtx!.lineWidth = 5;
      }

      globalAppCtx!.stroke();
      globalAppCtx!.restore();

      const rotation = reverseDir.angleTo(verticalToBottom);
      drawTriangleWithHeight(
        globalAppCtx!,
        endPos.x,
        endPos.y,
        a.strokeWidth * 4,
        a.strokeColor,
        -rotation,
        a.strokeStyle
      );
    }
  } else if (el.type === DrawingType.polyline) {
    const polylineShape = el as PolylineShapeElement;
    const pts = polylineShape.points;
    if (pts.length < 2) return;

    globalAppCtx!.save();
    globalAppCtx!.beginPath();
    const firtPos = pts[0];
    globalAppCtx!.moveTo(firtPos.x, firtPos.y);

    pts.slice(1).forEach((p, idx) => {
      globalAppCtx!.lineTo(p.x, p.y);
    });

    globalAppCtx!.strokeStyle = polylineShape.strokeColor;
    globalAppCtx!.lineWidth = polylineShape.strokeWidth;
    globalAppCtx!.stroke();
    globalAppCtx!.restore();
  } else if (el.type === DrawingType.circle) {
    const circle = el as CircleShapeElement;
    if (circle.radius - circle.strokeWidth / 2 <= 0) return;
    let circleCenter = circle.points[0];

    globalAppCtx!.save();
    globalAppCtx!.beginPath();

    if (circleCenter) {
      globalAppCtx!.arc(
        circleCenter.x,
        circleCenter.y,
        circle.radius - circle.strokeWidth / 2,
        0,
        2 * Math.PI
      );
    } else {
      const rotateOrigin = el.rotateOrigin;

      globalAppCtx!.translate(rotateOrigin.x, rotateOrigin.y);
      globalAppCtx!.rotate(el.rotation);
      globalAppCtx!.translate(-rotateOrigin.x, -rotateOrigin.y);

      globalAppCtx!.translate(el.position.x, el.position.y);

      globalAppCtx!.scale(el.scale.x, el.scale.y);

      globalAppCtx!.translate(circle.radius, circle.radius);
      globalAppCtx!.arc(
        0,
        0,
        circle.radius - circle.strokeWidth / 2,
        0,
        2 * Math.PI
      );
    }

    globalAppCtx!.strokeStyle = circle.strokeColor;
    globalAppCtx!.lineWidth = circle.strokeWidth;
    globalAppCtx!.stroke();

    globalAppCtx!.restore();
  } else if (el.type === DrawingType.rectangle) {
    const rect = el as RectangleShapeElement;
    const leftTop = rect.position;
    if (!leftTop) return;
    globalAppCtx!.save();
    globalAppCtx!.strokeStyle = rect.strokeColor;
    globalAppCtx!.lineWidth = rect.strokeWidth;

    const innerRectWidth =
      rect.width > 0
        ? rect.width * rect.scale.x - rect.strokeWidth
        : rect.width * rect.scale.x + rect.strokeWidth;
    const innerRectHeight =
      rect.height > 0
        ? rect.height * rect.scale.y - rect.strokeWidth
        : rect.height * rect.scale.y + rect.strokeWidth;

    globalAppCtx!.save();

    const rotateOrigin = el.rotateOrigin;

    globalAppCtx!.translate(rotateOrigin.x, rotateOrigin.y);
    globalAppCtx!.rotate(el.rotation);
    globalAppCtx!.translate(-rotateOrigin.x, -rotateOrigin.y);

    globalAppCtx!.translate(el.position.x, el.position.y);

    globalAppCtx!.strokeRect(
      rect.strokeWidth / 2,
      rect.strokeWidth / 2,
      innerRectWidth,
      innerRectHeight
    );

    globalAppCtx!.restore();
  }
}

function drawNeedCacheEle(el: DrawingElement) {
  // 先只考虑text
  if (el.type !== DrawingType.text) return;
  const text = el as Text;
  globalAppCtx!.drawImage(
    drawingCanvasCache.ele2DrawingCanvas.get(text)!,
    text.position.x,
    text.position.y
  );
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
    const ctx = elCvs?.getContext("2d", { willReadFrequently: true })!;
    if (!ctx) return;
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

export function getTriangle(
  x: number,
  y: number,
  height: number,
  rotation: number = 0
) {
  const width = (height * Math.sqrt(3)) / 2; // Calculate the base width of the equilateral triangle

  const x1 = x - width / 2;
  const y1 = y;

  const x2 = x + width / 2;
  const y2 = y;

  const x3 = x;
  const y3 = y - height;

  const [rx1, ry1] = rotate(x1, y1, x, y, rotation);
  const [rx2, ry2] = rotate(x2, y2, x, y, rotation);
  const [rx3, ry3] = rotate(x3, y3, x, y, rotation);

  return [rx1, ry1, rx2, ry2, rx3, ry3];
}

function drawTriangleWithHeight(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  height: number,
  color: string,
  rotation: number = 0,
  lineStyle: "dashed" | "solid" = "solid"
) {
  const [rx1, ry1, rx2, ry2, rx3, ry3] = getTriangle(x, y, height, rotation);

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(rx1, ry1);
  ctx.lineTo(rx2, ry2);
  ctx.lineTo(rx3, ry3);
  ctx.closePath();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (lineStyle === "dashed") {
    ctx.setLineDash([1, 10]);
    ctx.lineWidth = 5;
    ctx.strokeStyle = color;
    ctx.stroke();
  } else {
    ctx.fillStyle = color;
    ctx.fill();
  }
  ctx.restore();
}

export function createDrawingCvs(
  ele: DrawingElement,
  targetCvs: HTMLCanvasElement
) {
  if (ele.points.length === 0) return;
  // stylelint-vite-plugin
  const canvas = document.createElement("canvas") as HTMLCanvasElement;
  canvas.width = targetCvs.width;
  canvas.height = targetCvs.height;
  const ctx = canvas.getContext("2d")!;

  switch (ele.type) {
    case DrawingType.freeDraw:
      const freeDrawing = ele as FreeDrawing;
      const strokeOptions = freeDrawing.strokeOptions;

      const { strokeColor } = freeDrawing;
      const { points } = freeDrawing;
      ctx.strokeStyle = strokeColor;
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
          return;
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
            const ptObj = new PointZ(pt.x, pt.y);

            return { x: ptObj.x, y: ptObj.y, pressure: pt.pressure };
          }),
          strokeOptions as StrokeOptions
        );

        const outlinePoints = getStrokeOutlinePoints(
          strokePoints,
          strokeOptions as StrokeOptions
        );
        (ele as FreeDrawing).outlinePoints = outlinePoints.map((pt) => {
          return {
            x: pt[0],
            y: pt[1],
          };
        });
        fillPolygon(outlinePoints, strokeColor!, ctx);
      }

      break;
    case DrawingType.img: {
      const i = ele as ImageElement;
      if (!i.image) return;

      try {
        ctx.drawImage(i.image, 0, 0, i.image.width, i.image.height);
      } catch (e) {
        logger.error(e as Error);
      }

      break;
    }
  }

  return canvas;
}

export function drawText(
  ctx: CanvasRenderingContext2D | null,
  pos: Point,
  text: string,
  color: string = "red"
) {
  if (!ctx) ctx = globalAppCtx;

  if (!ctx) return;

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
  const eraserOutlinePoints = ele.excludeArea;
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
  ctx: CanvasRenderingContext2D | null,
  circle: Flatten.Circle,
  color?: string
) {
  if (!ctx) ctx = globalAppCtx!;
  ctx.beginPath();
  ctx.arc(circle.center.x, circle.center.y, circle.r, 0, 2 * Math.PI); // Full circle
  ctx.fillStyle = color ?? "red";
  ctx.fill();
}

export function drawHandles(
  op: Transform2DOperator,
  ctx: CanvasRenderingContext2D
) {
  Object.keys(op.handleOperator).forEach((k) => {
    const h = op.handleOperator[k as keyof TransformHandles] as Polygon;
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

export function drawRectBorder(
  ctx: CanvasRenderingContext2D | null,
  rect: Polygon,
  color: d3c.Color,
  thickness: number
) {
  if (!ctx) ctx = globalAppCtx!;
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

export function drawLine(
  ctx: CanvasRenderingContext2D | null,
  pts: Point[],
  color: string,
  thickness: number = 5
) {
  if (!ctx) ctx = globalAppCtx!;
  ctx.save();

  ctx.strokeStyle = color;
  ctx.lineWidth = thickness;

  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  pts.forEach((p) => {
    ctx.lineTo(p.x, p.y);
  });
  ctx.lineTo(pts[0].x, pts[0].y);

  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

export function drawPolygonPointIndex(
  ctx: CanvasRenderingContext2D | undefined,
  polygon: Polygon,
  color?: string,
  thinkness?: number
) {
  if (!polygon) return;
  if (!ctx) ctx = globalAppCtx!;
  ctx.save();

  ctx.beginPath();
  ctx.moveTo(polygon.vertices[0].x, polygon.vertices[0].y);
  polygon.vertices.forEach((pt, i) => {
    ctx.strokeStyle = color ?? "red";
    if (thinkness) {
      ctx.lineWidth = thinkness;
    }

    ctx.lineTo(pt.x, pt.y);
    const fontSize = 20;
    const fontStyle = "Arial";
    ctx.fillStyle = color ?? "red";
    ctx.font = `${fontSize}px ${fontStyle}`;
    ctx.fillText(`${i}`, pt.x, pt.y);
  });
  ctx.closePath();
  ctx.stroke();

  ctx.restore();
}

/**
 *  真正将一个元素的canvas data绘制到主画布上
 * @param ele 要绘制到主画布上的元素
 * @param originalImg 绘制之前的主画布图像，用reset
 */
export function onlyRedrawOneElement(
  ele: DrawingElement,
  originalImg: ImageData
) {
  globalAppCtx!.putImageData(originalImg, 0, 0);
  drawNeedntCacheEle(ele);
  drawNeedCacheEle(ele);

  if (showElePtLength) {
    const textPos = ele.points[0];
    drawText(globalAppCtx!, textPos, ele.points.length.toString());
  }

  if (debugShowEleId) {
    const textPos = ele.points[0];
    drawText(globalAppCtx!, textPos, ele.id);
  }
}
