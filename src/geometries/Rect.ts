import { Box, Polygon } from "@zenghawtin/graph2d";

export class Rect {
  polygon: Flatten.Polygon;
  constructor(passedShape: Flatten.Polygon | Box) {
    if (passedShape instanceof Box) {
      this.polygon = new Polygon(passedShape);
    } else {
      this.polygon = passedShape;
    }
  }
  computeNormal(edgeIdx: number) {
    return this.polygon.computeNormal(edgeIdx);
  }
  get center() {
    return this.polygon.box.center;
  }
}
