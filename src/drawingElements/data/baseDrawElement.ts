import { Point } from "src/coreRenderer/basicTypes";
export type FillStyle = "hachure" | "cross-hatch" | "solid" | "zigzag";
export type StrokeStyle = "solid" | "dashed";
export type BaseDrawComp = {
  strokeColor: string;
  strokeStyle: StrokeStyle;
  fillStyle: FillStyle;
  opacity: number;
  rotation: number;
  position: Point;
  isDeleted: boolean;
  groupIds: string[];
  frameId: string | null;
  customData: Record<string, any>;
};
