import { Box, Edge, Point, Polygon } from "@zenghawtin/graph2d";
import * as d3c from "d3-color";
import {
  drawHandles,
  drawPolygonPointIndex,
  drawRectBorder,
  rotate,
} from "src/CoreRenderer/DrawCanvas/core";
import { Degree } from "src/CoreRenderer/basicTypes";
import { Rect } from "src/geometries/Rect";
export enum TransformHandle {
  n = "n",
  s = "s",
  w = "w",
  e = "e",
  nw = "nw",
  ne = "ne",
  sw = "sw",
  se = "se",
  ro = "ro",
}
type TransformHandles = Partial<{
  [T in TransformHandle]: Polygon;
}>;
export function sortPoints(pts: Point[]) {
  // Calculate the centroid of the points
  let centroid = pts.reduce(
    (acc, pt) => {
      acc.x += pt.x;
      acc.y += pt.y;
      return acc;
    },
    { x: 0, y: 0 }
  );

  centroid.x /= pts.length;
  centroid.y /= pts.length;

  // Function to calculate the angle from centroid to the point
  const angleFromCentroid = (pt) => {
    return Math.atan2(pt.y - centroid.y, pt.x - centroid.x);
  };

  // Sort points by angle from centroid
  pts.sort((a, b) => {
    return angleFromCentroid(a) - angleFromCentroid(b);
  });

  return pts;
}
export class Transform2DOperator {
  handleOperator: TransformHandles = {};
  ableTransform: boolean = true;
  ctx: CanvasRenderingContext2D;
  cursorStyle: { [T in TransformHandle]: string } = {
    [TransformHandle.n]: "n-resize",
    [TransformHandle.s]: "s-resize",
    [TransformHandle.w]: "w-resize",
    [TransformHandle.e]: "e-resize",
    [TransformHandle.ne]: "ne-resize",
    [TransformHandle.nw]: "nw-resize",
    [TransformHandle.se]: "se-resize",
    [TransformHandle.sw]: "sw-resize",
    [TransformHandle.ro]: "pointer",
  };
  border: number = 2;
  pointW: number = 10;
  fillColor: d3c.Color = d3c.rgb("#ffffff");
  borderColor: d3c.Color = d3c.rgb("#14C0E0");
  rotation: Degree;
  rect: Rect;

  constructor(
    pol: Polygon,
    rotation: Degree,
    ctx: CanvasRenderingContext2D,
    revertYDirection: boolean,
    showRotation: boolean = true,
    ableTransform: boolean = true
  ) {
    this.ctx = ctx;
    this.rotation = rotation;
    this.rect = new Rect(pol.clone()); // 这个pol是绝对坐标，是旋转之后的boundingBox，原始值，不是对象所有世界坐标点的boundingBox
    [...this.rect.polygon.edges].forEach((e: Edge) => {
      const midPt = new Point(
        (e.start.x + e.end.x) / 2,
        (e.start.y + e.end.y) / 2
      );
      this.rect.polygon.addVertex(midPt, e);
    });

    this.ableTransform = ableTransform;
    const pts = this.rect.polygon.vertices;
    const offsetAlignDiagonal = this.pointW / 2;

    // for debug
    drawPolygonPointIndex(this.ctx, this.rect.polygon);
    if (pts.length !== 8) return;
    const referenceWN = pts[0];
    this.handleOperator[TransformHandle.nw] = new Polygon(
      new Box(
        referenceWN.x - offsetAlignDiagonal,
        referenceWN.y - offsetAlignDiagonal,
        referenceWN.x + offsetAlignDiagonal,
        referenceWN.y + offsetAlignDiagonal
      )
        .toPoints()
        .map((p) =>
          rotate(p.x, p.y, referenceWN.x, referenceWN.y, this.rotation)
        )
    );

    const referenceN = pts[1];
    this.handleOperator[TransformHandle.n] = new Polygon(
      new Box(
        referenceN.x - offsetAlignDiagonal,
        referenceN.y - offsetAlignDiagonal,
        referenceN.x + offsetAlignDiagonal,
        referenceN.y + offsetAlignDiagonal
      )
        .toPoints()
        .map((p) => rotate(p.x, p.y, referenceN.x, referenceN.y, this.rotation))
    );

    const referenceNe = pts[2];
    this.handleOperator[TransformHandle.ne] = new Polygon(
      new Box(
        referenceNe.x - offsetAlignDiagonal,
        referenceNe.y - offsetAlignDiagonal,
        referenceNe.x + offsetAlignDiagonal,
        referenceNe.y + offsetAlignDiagonal
      )
        .toPoints()
        .map((p) =>
          rotate(p.x, p.y, referenceNe.x, referenceNe.y, this.rotation)
        )
    );

    const referenceE = pts[3];
    this.handleOperator[TransformHandle.e] = new Polygon(
      new Box(
        referenceE.x - offsetAlignDiagonal,
        referenceE.y - offsetAlignDiagonal,
        referenceE.x + offsetAlignDiagonal,
        referenceE.y + offsetAlignDiagonal
      )
        .toPoints()
        .map((p) => rotate(p.x, p.y, referenceE.x, referenceE.y, this.rotation))
    );

    const referenceES = pts[4];
    this.handleOperator[TransformHandle.se] = new Polygon(
      new Box(
        referenceES.x - offsetAlignDiagonal,
        referenceES.y - offsetAlignDiagonal,
        referenceES.x + offsetAlignDiagonal,
        referenceES.y + offsetAlignDiagonal
      )
        .toPoints()
        .map((p) =>
          rotate(p.x, p.y, referenceES.x, referenceES.y, this.rotation)
        )
    );

    const referenceS = pts[5];
    this.handleOperator[TransformHandle.s] = new Polygon(
      new Box(
        referenceS.x - offsetAlignDiagonal,
        referenceS.y - offsetAlignDiagonal,
        referenceS.x + offsetAlignDiagonal,
        referenceS.y + offsetAlignDiagonal
      )
        .toPoints()
        .map((p) => rotate(p.x, p.y, referenceS.x, referenceS.y, this.rotation))
    );

    const referenceSW = pts[6];
    this.handleOperator[TransformHandle.sw] = new Polygon(
      new Box(
        referenceSW.x - offsetAlignDiagonal,
        referenceSW.y - offsetAlignDiagonal,
        referenceSW.x + offsetAlignDiagonal,
        referenceSW.y + offsetAlignDiagonal
      )
        .toPoints()
        .map((p) =>
          rotate(p.x, p.y, referenceSW.x, referenceSW.y, this.rotation)
        )
    );

    const referenceW = pts[7];
    this.handleOperator[TransformHandle.w] = new Polygon(
      new Box(
        referenceW.x - offsetAlignDiagonal,
        referenceW.y - offsetAlignDiagonal,
        referenceW.x + offsetAlignDiagonal,
        referenceW.y + offsetAlignDiagonal
      )
        .toPoints()
        .map((p) => rotate(p.x, p.y, referenceW.x, referenceW.y, this.rotation))
    );

    if (showRotation) {
      // referenceNE
      const referenceRotation = {
        x: pts[1].x,
        y: revertYDirection ? pts[1].y + 30 : pts[1].y - 30,
      };
      this.handleOperator[TransformHandle.ro] = new Polygon(
        new Box(
          referenceRotation.x - (offsetAlignDiagonal + 5),
          referenceRotation.y - (offsetAlignDiagonal + 5),
          referenceRotation.x + (offsetAlignDiagonal + 5),
          referenceRotation.y + (offsetAlignDiagonal + 5)
        )
          .toPoints()
          .map((p) =>
            rotate(p.x, p.y, referenceN.x, referenceN.y, this.rotation)
          )
      );
    }
  }

  draw() {
    if (Object.keys(this.handleOperator).length < 8) return;
    const cornerPolygon = new Polygon(
      this.rect.polygon.vertices.filter((_, idx) => idx % 2 === 0)
    );

    drawRectBorder(this.ctx, cornerPolygon, this.borderColor, this.border);
    drawHandles(this, this.ctx);
  }
}
