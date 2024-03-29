
interface FreeDrawing extends DrawingElement {
  readonly type: 'FreeDraw';
  readonly points: Point[];
  readonly pressures: number[];
  needSimulate: boolean;
}