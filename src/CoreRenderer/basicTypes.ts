import Flatten from "@flatten-js/core";
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
  scale?: Point;

  polygons: Flatten.Polygon[]; // stroke outline
  eraserPolygons: Flatten.Polygon[]; // stroke exclusion
  boundingBox?: Flatten.Box;
};

export type DomElement = {
  type: "note";
  position: Point;
  text: string;
  createTime: Date;
  color: number;
};

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
  strokeColor?: string;
};
export function isContained(
  polygons: Flatten.Polygon[],
  eraserCircle: Flatten.Circle,
  excludeHoles: boolean = false
) {
  const solidsAndHoles = partition(polygons, (poly) => {
    const f = [...poly.faces][0] as Flatten.Face;

    return f.orientation() === Flatten.ORIENTATION.CCW;
  });

  const outer = solidsAndHoles[0][0];
  const holes = solidsAndHoles[1];
  if (!outer) return;
  const intOuter = eraserCircle.intersect(outer);
  if (!intOuter.length) return false;

  if (excludeHoles) return true;
  for (let i = 0; i < holes.length; i++) {
    const h = holes[i];
    try {
      const isInter = h.contains(eraserCircle);
      if (isInter) return false;
    } catch (e) {
      console.log(e);
    }
  }
  return true;
}

export function ptIsContained(
  incPolygons: Flatten.Polygon[],
  excPolygons: Flatten.Polygon[],
  pt: Flatten.Point
) {
  if (!incPolygons || !excPolygons) return;
  for (let i = 0; i < excPolygons.length; i++) {
    const isExc = excPolygons[i]?.contains(pt);
    if (isExc) return false;
  }

  for (let i = 0; i < incPolygons.length; i++) {
    const isInc = incPolygons[i].contains(pt);
    if (isInc) return true;
  }

  return false;
}
