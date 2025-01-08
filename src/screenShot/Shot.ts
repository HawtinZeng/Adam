import { Point, Polygon } from "@zenghawtin/graph2d";
import { Degree } from "src/CoreRenderer/basicTypes";
import { getBoundryPoly } from "src/CoreRenderer/boundary";
import { DrawingType } from "src/CoreRenderer/drawingElementsTemplate";

export class Shot {
  position: Point = new Point(0, 0);
  rotation: Degree = 0;
  scale: Point = new Point(1, 1);
  needCacheCanvas: boolean = false;
  constructor(
    public width: number = 0,
    public height: number = 0,
    public screen: ImageBitmap
  ) {
    // @ts-ignore
    this.boundary = getBoundryPoly(this);
  }
  type: DrawingType.shot = DrawingType.shot;
  boundary: Polygon[] = [];

  drawHander() {}

  drawImg() {}
}
