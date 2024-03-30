import { Point } from "../utils/data/geometry"
import { BaseDrawComp } from "./baseDrawComp";
export interface FreedrawComp extends BaseDrawComp {
  type: 'freedraw';
  points: Point[];
  pressures: number[];
  simulatePressure: boolean;
}