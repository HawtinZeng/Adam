import { DrawingElement, Point } from "src/coreRenderer/basicTypes";

export interface FreeDrawing extends DrawingElement {
  readonly type: FreeDrawingType.freeDraw;
  readonly points: Point[];
  readonly pressures: number[];
  needSimulate: boolean;
}
export enum FreeDrawingType {
  freeDraw = "freeDraw",
}