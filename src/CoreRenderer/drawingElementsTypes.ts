import { StrokeOptions } from "perfect-freehand";
import { DrawingElement, Point } from "src/coreRenderer/basicTypes";

export interface FreeDrawing extends DrawingElement {
  readonly type: DrawingType.freeDraw;
  readonly points: Point[];
  readonly pressures: number[];
  needSimulate: boolean;
  strokeOptions?: StrokeOptions;
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
  strokeColor: "black",
  strokeWidth: 20,
  strokeStyle: "solid",
  fillStyle: "solid",
  opacity: 40,

  belongedFrame: "defaultFrameId",
  belongedGroup: "defaultGrp",

  status: "notLocked",
  isDeleted: false,

  position: { x: 0, y: 0 },
  rotation: 0,
};
