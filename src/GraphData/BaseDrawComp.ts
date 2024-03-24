export type FillStyle = "hachure" | "cross-hatch" | "solid" | "zigzag";
export type StrokeStyle = "solid" | "dashed";
export abstract class BaseDrawComp {
  strokeColor: string
  strokeWidth: number
  strokeStyle: StrokeStyle
  fillStyle: FillStyle
  opacity: number;
  bbxWidth: number;
  bbxHeight: number;
  rotation: number;
  isDeleted: boolean;
  groupIds: string[];
  frameId: string | null;
  customData:Record<string, any>
}