import { Line } from "@zenghawtin/graph2d";

export class Rect {
  polygon: Flatten.Polygon;
  constructor(polygon: Flatten.Polygon) {
    this.polygon = polygon;
  }
  getNormal(edgeIdx: number) {
    const currentPoint = this.polygon.vertices[edgeIdx];
    const nextPoint = this.polygon.vertices[(edgeIdx + 1) % 4];
    const l = new Line(currentPoint, nextPoint);

    return l.norm;
  }
}
