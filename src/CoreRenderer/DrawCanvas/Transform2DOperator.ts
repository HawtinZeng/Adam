import { Box } from "@flatten-js/core";
import * as d3c from "d3-color";
enum TransformHandle {
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
  [T in TransformHandle]: Box;
}>;

export class Transform2DOperator {
  handles: TransformHandles = {};
  border: number = 2;
  pointW: number = 10;
  fillColor: d3c.Color = d3c.rgb("#ffffff");
  borderColor: d3c.Color = d3c.rgb("#14C0E0");

  constructor(eleStaticBbx: Box) {
    const c = eleStaticBbx.center;
    const w = eleStaticBbx.width;
    const h = eleStaticBbx.height;
    const offsetAlignDiagonal = this.pointW / 2;

    const referenceN = { x: c.x, y: c.y - h / 2 };
    this.handles[TransformHandle.n] = new Box(
      referenceN.x - offsetAlignDiagonal,
      referenceN.y + offsetAlignDiagonal,
      referenceN.x + offsetAlignDiagonal,
      referenceN.y - offsetAlignDiagonal
    );

    const referenceNe = { x: c.x + w / 2, y: c.y - h / 2 };
    this.handles[TransformHandle.ne] = new Box(
      referenceNe.x - offsetAlignDiagonal,
      referenceNe.y + offsetAlignDiagonal,
      referenceNe.x + offsetAlignDiagonal,
      referenceNe.y - offsetAlignDiagonal
    );

    const referenceE = { x: c.x + w / 2, y: c.y };
    this.handles[TransformHandle.e] = new Box(
      referenceE.x - offsetAlignDiagonal,
      referenceE.y + offsetAlignDiagonal,
      referenceE.x + offsetAlignDiagonal,
      referenceE.y - offsetAlignDiagonal
    );

    const referenceES = { x: c.x + w / 2, y: c.y + h / 2 };
    this.handles[TransformHandle.se] = new Box(
      referenceES.x - offsetAlignDiagonal,
      referenceES.y + offsetAlignDiagonal,
      referenceES.x + offsetAlignDiagonal,
      referenceES.y - offsetAlignDiagonal
    );

    const referenceS = { x: c.x, y: c.y + h / 2 };
    this.handles[TransformHandle.s] = new Box(
      referenceS.x - offsetAlignDiagonal,
      referenceS.y + offsetAlignDiagonal,
      referenceS.x + offsetAlignDiagonal,
      referenceS.y - offsetAlignDiagonal
    );

    const referenceSW = { x: c.x - w / 2, y: c.y + h / 2 };
    this.handles[TransformHandle.sw] = new Box(
      referenceSW.x - offsetAlignDiagonal,
      referenceSW.y + offsetAlignDiagonal,
      referenceSW.x + offsetAlignDiagonal,
      referenceSW.y - offsetAlignDiagonal
    );

    const referenceW = { x: c.x - w / 2, y: c.y };
    this.handles[TransformHandle.w] = new Box(
      referenceW.x - offsetAlignDiagonal,
      referenceW.y + offsetAlignDiagonal,
      referenceW.x + offsetAlignDiagonal,
      referenceW.y - offsetAlignDiagonal
    );

    const referenceWN = { x: c.x - w / 2, y: c.y - h / 2 };
    this.handles[TransformHandle.nw] = new Box(
      referenceWN.x - offsetAlignDiagonal,
      referenceWN.y + offsetAlignDiagonal,
      referenceWN.x + offsetAlignDiagonal,
      referenceWN.y - offsetAlignDiagonal
    );

    const referenceRotation = {
      x: c.x,
      y: c.y - h / 2 - 30,
    };
    this.handles[TransformHandle.ro] = new Box(
      referenceRotation.x - (offsetAlignDiagonal + 5),
      referenceRotation.y + (offsetAlignDiagonal + 5),
      referenceRotation.x + (offsetAlignDiagonal + 5),
      referenceRotation.y - (offsetAlignDiagonal + 5)
    );
  }
}
