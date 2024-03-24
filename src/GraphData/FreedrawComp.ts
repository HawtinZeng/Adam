import { Point } from "../Utils/Data/geometry"
import { BaseDrawComp } from "./BaseDrawComp";
export class FreedrawComp extends BaseDrawComp{
  readonly type = 'freedraw'
  points: readonly Point[]
  pressures: readonly number[];
  simulatePressure: boolean;
}