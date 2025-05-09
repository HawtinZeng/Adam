import Flatten, {
  Circle,
  Face,
  ORIENTATION,
  Point as PointZ,
  Polygon,
} from "@zenghawtin/graph2d";
import * as d3c from "d3-color";
import { partition } from "lodash";
import { StrokeOptions } from "perfect-freehand";
import { Transform2DOperator } from "src/CoreRenderer/DrawCanvas/Transform2DOperator";
import { DrawingType } from "src/CoreRenderer/drawingElementsTemplate";
import { URL } from "url";

export type Point = {
  x: number;
  y: number;
  pressure?: number; // 0 - 1
  timestamp?: number;
};

export type Degree = number; // 0 - 359
/**
 * Core interface.
 */
export type DrawingElement = {
  type: DrawingType;
  points: Point[];
  id: string;
  strokeColor: string;
  strokeStyle: "solid" | "dashed";
  fillStyle: "solid" | "hachuo" | "cross-hatch" | "none";
  opacity: number;

  belongedFrame: string;
  belongedGroup: string;

  status: "locked" | "notLocked";

  isDeleted: boolean;

  position: Point;
  rotation: Degree;
  scale: Point;
  imgSrc?: URL;

  boundary: Polygon[]; // 世界坐标
  excludeArea: Polygon[]; // 世界坐标

  needCacheCanvas: boolean;
  locator?: HTMLCanvasElement;

  rotateOrigin: Flatten.Point; // 旋转中心

  includingPart: string; // area id

  handleOperator?: Transform2DOperator;
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
  polygons: Polygon[],
  eraserCircle: Circle,
  excludeHoles: boolean = false
) {
  const solidsAndHoles = partition(polygons, (poly) => {
    const f = [...poly.faces][0] as Face;

    return f.orientation() === ORIENTATION.CW;
  });

  const outer = solidsAndHoles[0][0];
  const holes = solidsAndHoles[1];
  if (!outer) return;
  const intOuter = eraserCircle.intersect(outer);

  if (!intOuter.length) return false;

  if (!excludeHoles) return true;
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
  incPolygons: Polygon[],
  excPolygons: Polygon[],
  pt: PointZ
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
export type TransformTRS = {
  translate: Point;
  rotate: Degree;
  scale: Point;
};
export type ShapeSettings = {
  fillColor?: d3c.Color;
  borderColor?: d3c.Color;
  thickness?: number;
};
