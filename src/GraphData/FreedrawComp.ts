import { Point } from "../utils/data/geometry"
import { BaseDrawComp } from "./baseDrawComp";
export class FreedrawComp extends BaseDrawComp{
  readonly type = 'freedraw'
  points: readonly Point[]
  pressures: readonly number[];
  simulatePressure: boolean;
}