import { Matrix3, Point as PointZ } from "@zenghawtin/graph2d";
import { cloneDeep } from "lodash";
import { nanoid } from "nanoid";
import { Point } from "src/CoreRenderer/basicTypes";
import { FreedrawComp } from "src/drawingElements/data/freedrawElement";

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
    z = 0;
  const e = m.elements;

  const tx = e[0] * x + e[3] * y + e[6] * z,
    ty = e[1] * x + e[4] * y + e[7] * z;

  return new PointZ(tx, ty);
}
