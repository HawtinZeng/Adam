import { Matrix3, Point, Polygon } from "@zenghawtin/graph2d";
import { cloneDeep } from "lodash";
import { nanoid } from "nanoid";
import { FreedrawComp } from "src/drawingElements/data/freedrawElement";
import { logger } from "src/setup";

const getFreeDrawElementAbsoluteCoords = (
  element: FreedrawComp
): [number, number, number, number, number, number] => {
  const [minPt, maxPt] = getBoundsFromPoints(element.points);
  const x1 = minPt.x + element.position.x;
  const y1 = minPt.y + element.position.y;
  const x2 = maxPt.x + element.position.x;
  const y2 = maxPt.y + element.position.y;

  return [x1, y1, x2, y2, (x1 + x2) / 2, (y1 + y2) / 2];
};

export const getBoundsFromPoints = (points: Point[]): Point[] => {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const { x, y } of points) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }

  return [
    { x: minX, y: minY },
    { x: maxX, y: maxY },
  ];
};

type HasId = {
  id: string;
};
export function cloneDeepGenId<T extends HasId>(e: T) {
  const createdE = cloneDeep(e);
  createdE.id = nanoid();
  return createdE;
}

export function calculateNormalVector(
  x1: number,
  y1: number,
  x2: number,
  y2: number
) {
  let dx = x2 - x1;
  let dy = y2 - y1;
  // Left normal
  let leftNormal = { x: -dy, y: dx };
  // Right normal
  let rightNormal = { x: dy, y: -dx };

  return { leftNormal, rightNormal };
}

export function transformPointZ(pt: Point, m: Matrix3) {
  const x = pt.x,
    y = pt.y,
    z = 1;
  const e = m.elements;

  const tx = e[0] * x + e[3] * y + e[6] * z,
    ty = e[1] * x + e[4] * y + e[7] * z;

  return new Point(tx, ty);
}

export async function downloadImage(
  imageBitmap: ImageBitmap,
  filename: string
) {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = imageBitmap.width;
    canvas.height = imageBitmap.height;
    const context = canvas.getContext("2d")!;
    context.drawImage(imageBitmap, 0, 0);
    const b = (await new Promise((res, rej) => {
      canvas.toBlob((b) => {
        if (b) res(b);
      });
    })) as Blob;

    const url = URL.createObjectURL(b);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url); // Clean up the temporary URL
  } catch (e) {
    logger.error(e as Error);
  }
}

export async function downloadCvs(canvas: HTMLCanvasElement, filename: string) {
  const b = (await new Promise((res, rej) => {
    canvas.toBlob((b) => {
      if (b) res(b);
    });
  })) as Blob;

  const url = URL.createObjectURL(b);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url); // Clean up the temporary URL
}

export function generateCvs(img: ImageBitmap) {
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const context = canvas.getContext("2d")!;
  context.drawImage(img, 0, 0);
  return canvas;
}

export function generateCenterPartialCvs(img: ImageBitmap) {
  const canvas = document.createElement("canvas");
  canvas.width = 100;
  canvas.height = 100;
  const context = canvas.getContext("2d")!;
  context.drawImage(img, -img.width / 2, -img.height / 2);
  return canvas;
}

export function clipCvs(cvs: HTMLCanvasElement) {
  const ctx = cvs.getContext("2d")!;
  ctx.beginPath();
  ctx.rect(0, cvs.height / 2, 100, 100);
  ctx.closePath();
  ctx.clip();
}
/**
 * @author Jan Marsch @kekscom)
 * @example see http://jsfiddle.net/osmbuildings/2e5KX/5/
 * @example thickLineToPolygon([{x:50,y:155}, {x:75,y:150}, {x:100,y:100}, {x:50,y:100}], 20)
 * @param polyline {array} a list of point objects in format {x:75,y:150}
 * @param thickness {int} line thickness
 */

function getOffsets(a, b, thickness) {
  var dx = b.x - a.x,
    dy = b.y - a.y,
    len = Math.sqrt(dx * dx + dy * dy),
    scale = thickness / (2 * len);
  return {
    x: -scale * dy,
    y: scale * dx,
  };
}

function getIntersection(a1, b1, a2, b2) {
  // directional constants
  var k1 = (b1.y - a1.y) / (b1.x - a1.x),
    k2 = (b2.y - a2.y) / (b2.x - a2.x),
    x,
    y,
    m1,
    m2;

  // if the directional constants are equal, the lines are parallel
  if (k1 === k2) {
    return;
  }

  // y offset constants for both lines
  m1 = a1.y - k1 * a1.x;
  m2 = a2.y - k2 * a2.x;

  // compute x
  x = (m1 - m2) / (k2 - k1);

  // use y = k * x + m to get y coordinate
  y = k1 * x + m1;

  return { x: x, y: y };
}

export function thickLineToPolygon(points: Point[], thickness: number) {
  var off,
    poly: any[] = [],
    isFirst,
    isLast,
    prevA,
    prevB,
    interA,
    interB,
    p0a,
    p1a,
    p0b,
    p1b;

  for (var i = 0, il = points.length - 1; i < il; i++) {
    isFirst = !i;
    isLast = i === points.length - 2;

    off = getOffsets(points[i], points[i + 1], thickness);

    p0a = { x: points[i].x + off.x, y: points[i].y + off.y };
    p1a = { x: points[i + 1].x + off.x, y: points[i + 1].y + off.y };
    p0b = { x: points[i].x - off.x, y: points[i].y - off.y };
    p1b = { x: points[i + 1].x - off.x, y: points[i + 1].y - off.y };

    if (!isFirst) {
      if ((interA = getIntersection(prevA[0], prevA[1], p0a, p1a)) as any) {
        poly.unshift(interA);
      }

      if ((interB = getIntersection(prevB[0], prevB[1], p0b, p1b))) {
        poly.push(interB);
      }
    }

    if (isFirst) {
      poly.unshift(p0a);
      poly.push(p0b);
    }

    if (isLast) {
      poly.unshift(p1a);
      poly.push(p1b);
    }

    if (!isLast) {
      prevA = [p0a, p1a];
      prevB = [p0b, p1b];
    }
  }

  return new Polygon(poly.map((p) => new Point(p.x, p.y)));
}
