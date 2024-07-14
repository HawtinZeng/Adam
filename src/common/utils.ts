import { Matrix3, Point as PointZ } from "@zenghawtin/graph2d";
import { cloneDeep } from "lodash";
import { nanoid } from "nanoid";
import { Point } from "src/CoreRenderer/basicTypes";
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

export function transformPointZ(pt: PointZ, m: Matrix3) {
  const x = pt.x,
    y = pt.y,
    z = 1;
  const e = m.elements;

  const tx = e[0] * x + e[3] * y + e[6] * z,
    ty = e[1] * x + e[4] * y + e[7] * z;

  return new PointZ(tx, ty);
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
