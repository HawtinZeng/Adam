import { Point } from "../../utils/data/geometry"
import { BaseDrawComp } from "./baseDrawElement";
export interface FreedrawComp extends BaseDrawComp {
  type: 'freedraw';
  points: Point[];
  pressures: number[];
  simulatePressure: boolean;
}