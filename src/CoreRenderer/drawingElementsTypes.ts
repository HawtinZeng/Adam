import {
  DrawingElement,
  Point,
  AStrokeOptions,
} from "src/coreRenderer/basicTypes";

export interface FreeDrawing extends DrawingElement {
  readonly type: DrawingType.freeDraw;
  readonly points: Point[];
  readonly pressures: number[];
  needSimulate: boolean;
  strokeOptions: AStrokeOptions;
}
export enum DrawingType {
  freeDraw = "freeDraw",
}

export const newFreeDrawingElement: FreeDrawing = {
  type: DrawingType.freeDraw,
  points: [] as Point[],
  pressures: [] as number[],
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
