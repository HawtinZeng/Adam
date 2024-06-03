import Flatten from "@flatten-js/core";
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
}

export const newFreeDrawingElement: FreeDrawing = {
  type: DrawingType.freeDraw,
  points: [],
  eraserPolygons: [],
  needSimulate: true,

  id: "1",
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
  polygons: [] as Flatten.Polygon[],
};
export const newImgElement: DrawingElement = {
  type: DrawingType.img,
  points: [],

  id: "1",
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
  scale: { x: 1, y: 1 },

  polygons: [],
  eraserPolygons: [],
};
