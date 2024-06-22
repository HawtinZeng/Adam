import Flatten, { Box, Edge, Face, Polygon } from "@flatten-js/core";
import * as d3c from "d3-color";
import { rotate } from "src/CoreRenderer/DrawCanvas/core";
import { Degree, Point } from "src/CoreRenderer/basicTypes";
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

export class Transform2DOperator {
  handles: TransformHandles = {};
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
  polygon: Polygon;

  constructor(pol: Polygon, rotation: Degree) {
    this.rotation = rotation;
    this.polygon = pol.clone();

    [...this.polygon.edges].forEach((e: Edge) => {
      const midPt = new Flatten.Point(
        (e.start.x + e.end.x) / 2,
        (e.start.y + e.end.y) / 2
      );
      this.polygon.addVertex(midPt, e);
    });

    const pts = [...this.polygon.faces].flatMap((f: Face) => {
      const ptInFace: Point[] = [];
      f.edges.forEach((edge) => {
        ptInFace.push(edge.start);
      });
      return ptInFace;
    });

    const offsetAlignDiagonal = this.pointW / 2;

    const referenceN = pts[1];
    this.handles[TransformHandle.n] = new Polygon(
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
    this.handles[TransformHandle.ne] = new Polygon(
      new Box(
        referenceNe.x - offsetAlignDiagonal,
        referenceNe.y - offsetAlignDiagonal,
        referenceNe.x + offsetAlignDiagonal,
        referenceNe.y + offsetAlignDiagonal
      )
        .toPoints()
        .map((p) => rotate(p.x, p.y, referenceN.x, referenceN.y, this.rotation))
    );

    const referenceE = pts[3];
    this.handles[TransformHandle.e] = new Polygon(
      new Box(
        referenceE.x - offsetAlignDiagonal,
        referenceE.y - offsetAlignDiagonal,
        referenceE.x + offsetAlignDiagonal,
        referenceE.y + offsetAlignDiagonal
      )
        .toPoints()
        .map((p) => rotate(p.x, p.y, referenceN.x, referenceN.y, this.rotation))
    );

    const referenceES = pts[4];
    this.handles[TransformHandle.se] = new Polygon(
      new Box(
        referenceES.x - offsetAlignDiagonal,
        referenceES.y - offsetAlignDiagonal,
        referenceES.x + offsetAlignDiagonal,
        referenceES.y + offsetAlignDiagonal
      )
        .toPoints()
        .map((p) => rotate(p.x, p.y, referenceN.x, referenceN.y, this.rotation))
    );

    const referenceS = pts[5];
    this.handles[TransformHandle.s] = new Polygon(
      new Box(
        referenceS.x - offsetAlignDiagonal,
        referenceS.y - offsetAlignDiagonal,
        referenceS.x + offsetAlignDiagonal,
        referenceS.y + offsetAlignDiagonal
      )
        .toPoints()
        .map((p) => rotate(p.x, p.y, referenceN.x, referenceN.y, this.rotation))
    );

    const referenceSW = pts[6];
    this.handles[TransformHandle.sw] = new Polygon(
      new Box(
        referenceSW.x - offsetAlignDiagonal,
        referenceSW.y - offsetAlignDiagonal,
        referenceSW.x + offsetAlignDiagonal,
        referenceSW.y + offsetAlignDiagonal
      )
        .toPoints()
        .map((p) => rotate(p.x, p.y, referenceN.x, referenceN.y, this.rotation))
    );

    const referenceW = pts[7];
    this.handles[TransformHandle.w] = new Polygon(
      new Box(
        referenceW.x - offsetAlignDiagonal,
        referenceW.y - offsetAlignDiagonal,
        referenceW.x + offsetAlignDiagonal,
        referenceW.y + offsetAlignDiagonal
      )
        .toPoints()
        .map((p) => rotate(p.x, p.y, referenceN.x, referenceN.y, this.rotation))
    );

    const referenceWN = pts[0];
    this.handles[TransformHandle.nw] = new Polygon(
      new Box(
        referenceWN.x - offsetAlignDiagonal,
        referenceWN.y - offsetAlignDiagonal,
        referenceWN.x + offsetAlignDiagonal,
        referenceWN.y + offsetAlignDiagonal
      )
        .toPoints()
        .map((p) => rotate(p.x, p.y, referenceN.x, referenceN.y, this.rotation))
    );

    const referenceRotation = {
      x: pts[1].x,
      y: pts[1].y + 30,
    };
    this.handles[TransformHandle.ro] = new Polygon(
      new Box(
        referenceRotation.x - (offsetAlignDiagonal + 5),
        referenceRotation.y - (offsetAlignDiagonal + 5),
        referenceRotation.x + (offsetAlignDiagonal + 5),
        referenceRotation.y + (offsetAlignDiagonal + 5)
      )
        .toPoints()
        .map((p) => rotate(p.x, p.y, referenceN.x, referenceN.y, this.rotation))
    );
  }
}
