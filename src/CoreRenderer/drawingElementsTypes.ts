import { DrawingElement, Point } from "src/coreRenderer/basicTypes";

export interface FreeDrawing extends DrawingElement {
  readonly type: DrawingType.freeDraw;
  readonly points: Point[];
  readonly pressures: number[];
  needSimulate: boolean;
}
export enum DrawingType {
  freeDraw = "freeDraw",
}