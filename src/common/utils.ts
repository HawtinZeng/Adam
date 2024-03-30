import { Bounds, Point } from "src/coreRenderer/basicTypes";
import { FreedrawComp } from "src/drawingElements/freedrawComp";

import { Matrix } from "@flatten-js/core"

const getFreeDrawElementAbsoluteCoords = (
  element: FreedrawComp,
): [number, number, number, number, number, number] => {
  const [minPt, maxPt] = getBoundsFromPoints(element.points);
  const x1 = minPt.x + element.position.x;
  const y1 = minPt.y + element.position.y;
  const x2 = maxPt.x + element.position.x;
  const y2 = maxPt.y + element.position.y;
  return [x1, y1, x2, y2, (x1 + x2) / 2, (y1 + y2) / 2];
};
export const getBoundsFromPoints = (
  points: Point[],
): Point[] => {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const {x, y} of points) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }

  return [{x: minX, y: minY}, {x: maxX, y: maxY}];
};