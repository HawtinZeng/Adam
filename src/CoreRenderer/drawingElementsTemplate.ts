import Flatten, { Polygon } from "@zenghawtin/graph2d";
import {
  AStrokeOptions,
  DrawingElement,
  Point as PointSim,
} from "src/CoreRenderer/basicTypes";
import { Transform2DOperator } from "src/CoreRenderer/DrawCanvas/Transform2DOperator";

export interface FreeDrawing extends DrawingElement {
  readonly type: DrawingType.freeDraw;
  readonly points: PointSim[];
  needSimulate: boolean;
  strokeOptions: AStrokeOptions;

  oriBoundary: Polygon[]; // 相对坐标
  oriexcludeArea: Polygon[];

  outlinePoints: PointSim[]; // 相对坐标

  handleOperator: Transform2DOperator; // 世界坐标
}

export enum DrawingType {
  freeDraw = "freeDraw",
  eraser = "eraser",
  img = "img",
  arrow = "arrow",
  polyline = "polyline",
  circle = "circle",
  rectangle = "rectangle",
  text = "text",
}

export const newFreeDrawingElement: FreeDrawing = {
  type: DrawingType.freeDraw,
  points: [],
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
  excludeArea: [],

  scale: {
    x: 1,
    y: 1,
  },
  rotateOrigin: { x: 0, y: 0 },
  needCacheCanvas: true,
  oriBoundary: [],
  oriexcludeArea: [],
};
export type ImageElement = DrawingElement & {
  image: HTMLImageElement | undefined;
  height: number;
  width: number;
};

export type ArrowShapeElement = DrawingElement & {
  arrowTriangle: Polygon;
  strokeWidth: number;
};

export type Shape =
  | ArrowShapeElement
  | PolylineShapeElement
  | CircleShapeElement;

export type PolylineShapeElement = DrawingElement & {
  strokeWidth: number;
};

export type CircleShapeElement = DrawingElement & {
  strokeWidth: number;
  radius: number;
  width: number;
  height: number;
};

export type RectangleShapeElement = DrawingElement & {
  width: number;
  height: number;
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
  height: 0,
  width: 0,
  // 位置和缩放的中心均位于左上角
  rotateOrigin: { x: 0, y: 0 },
  needCacheCanvas: true,
};

export const newArrowShapeElement: ArrowShapeElement = {
  strokeStyle: "solid",
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

export const newPolylineShapeElement: PolylineShapeElement = {
  strokeStyle: "dashed",
  needCacheCanvas: false,

  type: DrawingType.polyline,
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
  rotation: 0, // 以rotateOrigin为中心
  scale: { x: 1, y: 1 }, // 以rotateOrigin为中心

  boundary: [],
  excludeArea: [],

  rotateOrigin: { x: 0, y: 0 }, // 默认包围盒的中心
};

export const newCircleShapeElement: CircleShapeElement = {
  strokeStyle: "dashed",
  needCacheCanvas: false,

  type: DrawingType.circle,
  points: [],
  id: "will be overwritten",
  strokeColor: "#000000",
  strokeWidth: 10,

  radius: 10,

  fillStyle: "none",
  opacity: 1,

  belongedFrame: "defaultFrameId",
  belongedGroup: "defaultGrp",

  status: "notLocked",
  isDeleted: false,

  position: { x: 0, y: 0 },
  rotation: 0, // 以 rotateOrigin 为中心
  scale: { x: 1, y: 1 }, // 以 rotateOrigin 为中心

  boundary: [],
  excludeArea: [],
  rotateOrigin: { x: 0, y: 0 }, // 默认包围盒的中心

  width: 100,
  height: 100,
};
export const newRectangleShapeElement: RectangleShapeElement = {
  width: 10,
  height: 10,
  strokeWidth: 10,

  strokeStyle: "dashed",
  needCacheCanvas: false,

  type: DrawingType.rectangle,
  points: [],
  id: "will be overwritten",
  strokeColor: "#000000",

  fillStyle: "none",
  opacity: 1,

  belongedFrame: "defaultFrameId",
  belongedGroup: "defaultGrp",

  status: "notLocked",
  isDeleted: false,

  position: { x: 0, y: 0 },
  rotation: 0, // 以rotateOrigin为中心
  scale: { x: 1, y: 1 }, // 以rotateOrigin为中心

  boundary: [],
  excludeArea: [],

  rotateOrigin: { x: 0, y: 0 }, // 默认包围盒的中心
};
