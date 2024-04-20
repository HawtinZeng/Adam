import {
  DrawingElement,
  Point,
  AStrokeOptions,
} from "src/CoreRenderer/basicTypes";

export interface FreeDrawing extends DrawingElement {
  readonly type: DrawingType.freeDraw;
  readonly points: Point[];
  needSimulate: boolean;
  strokeOptions: AStrokeOptions;
}
export enum DrawingType {
  freeDraw = "freeDraw",
}

export const newFreeDrawingElement: FreeDrawing = {
  type: DrawingType.freeDraw,
  points: [] as Point[],
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
};
