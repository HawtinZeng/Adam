import Flatten, { Face } from "@flatten-js/core";
import { partition } from "lodash";
import { StrokeOptions } from "perfect-freehand";

export type Point = {
  x: number;
  y: number;
  pressure?: number; // 0 - 1
  timestamp?: number;
};
export type Degree = number;
export type DrawingElement = {
  type: string;
  points: Point[];
  id: string;
  strokeColor: string;
  strokeStyle: "solid" | "dashed";
  fillStyle: "solid" | "hachuo" | "cross-hatch";
  opacity: number;

  belongedFrame: string;
  belongedGroup: string;

  status: "locked" | "notLocked";

  isDeleted: boolean;

  position: Point;
  rotation: Degree;

  polygons: Flatten.Polygon[]; // 用于点击鼠标之后，判断鼠标点击到哪个元素
};

export function isContained(polygons: Flatten.Polygon[], pt: Flatten.Point) {
  const solidsAndHoles = partition(polygons, (poly) => {
    const f = [...poly.faces][0] as Face;

    return f.orientation() === Flatten.ORIENTATION.CCW;
  });

  const outer = solidsAndHoles[0][0];
  const holes = solidsAndHoles[1];

  const inOuter = outer.contains(pt);
  if (!inOuter) return false;

  for (let i = 0; i < holes.length; i++) {
    const h = holes[i];
    if (h.contains(pt)) return false;
  }
  return true;
}
export type FrameData = {
  width: number;
  height: number;
  position: Point;

  status: "locked" | "notLocked";

  isDeleted: boolean;
};

export type SceneOptions = {
  backgroundColor?: string;
  scale: number;
};
export type Bounds = [number, number, number, number]; // [minX, minY, maxX, maxY];

export type AStrokeOptions = StrokeOptions & {
  last?: boolean;
  // 放的是比较私有的配置
  isCtxStroke?: boolean;
  haveTrailling?: boolean;
  strokeColor: string;
};
