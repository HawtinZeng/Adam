import Flatten, { Polygon } from "@zenghawtin/graph2d";
import {
  AStrokeOptions,
  DrawingElement,
  Point,
} from "src/CoreRenderer/basicTypes";

export interface FreeDrawing extends DrawingElement {
  readonly type: DrawingType.freeDraw;
  readonly points: Point[];
  needSimulate: boolean;
  strokeOptions: AStrokeOptions;
}

export enum DrawingType {
  freeDraw = "freeDraw",
  eraser = "eraser",
  img = "img",
  arrow = "arrow",
}

export const newFreeDrawingElement: FreeDrawing = {
  type: DrawingType.freeDraw,
  points: [],
  excludeArea: [],
  needSimulate: true,

  id: "will be overwritten",
  strokeColor: "#000000",
  strokeStyle: "solid",
  fillStyle: "solid",
  opacity: 1,

  belongedFrame: "defaultFrameId",
  belongedGroup: "defaultGrp",

  status: "notLocked",
  isDeleted: false,

  position: { x: 0, y: 0 },
  rotation: 0,
  strokeOptions: {} as AStrokeOptions,
  boundary: [] as Flatten.Polygon[],
  scale: {
    x: 0,
    y: 0,
  },
  rotateOrigin: { x: 0, y: 0 },
  needCacheCanvas: true,
};
export type ImageElement = DrawingElement & {
  image: HTMLImageElement | undefined;
  originalHeight: number;
  originalWidth: number;
};

export type ArrowShapeElement = DrawingElement & {
  arrowTriangle: Polygon;
  strokeWidth: number;
};

export const newImgElement: ImageElement = {
  type: DrawingType.img,
  points: [],

  id: "will be overwritten",
  strokeColor: "#000000",
  strokeStyle: "solid",
  fillStyle: "solid",
  opacity: 1,

  belongedFrame: "defaultFrameId",
  belongedGroup: "defaultGrp",

  status: "notLocked",
  isDeleted: false,

  // 位置和缩放的中心均位于左上角
  position: { x: 0, y: 0 },
  rotation: 0,
  scale: { x: 1, y: 1 },

  boundary: [],
  excludeArea: [],
  image: undefined,
  originalHeight: 0,
  originalWidth: 0,
  // 位置和缩放的中心均位于左上角
  rotateOrigin: { x: 0, y: 0 },
  needCacheCanvas: true,
};

export const newArrowShapeElement: ArrowShapeElement = {
  strokeStyle: "dashed",
  arrowTriangle: new Polygon(),
  needCacheCanvas: false,

  type: DrawingType.arrow,
  points: [],
  id: "will be overwritten",
  strokeColor: "#000000",
  strokeWidth: 10,
  fillStyle: "none",
  opacity: 1,

  belongedFrame: "defaultFrameId",
  belongedGroup: "defaultGrp",

  status: "notLocked",
  isDeleted: false,

  position: { x: 0, y: 0 },
  rotation: 0,
  scale: { x: 1, y: 1 },

  boundary: [],
  excludeArea: [],
  // 默认为箭头线的中点
  rotateOrigin: { x: 0, y: 0 },
};
