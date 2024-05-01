import Flatten from "@flatten-js/core";
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

  eraserOutlines: Point[][];
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
