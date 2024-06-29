export class Rect {
  polygon: Flatten.Polygon;
  constructor(polygon: Flatten.Polygon) {
    this.polygon = polygon;
  }
  computeNormal(edgeIdx: number) {
    return this.polygon.computeNormal(edgeIdx);
  }
  get center() {
    return this.polygon.box.center;
  }
}
