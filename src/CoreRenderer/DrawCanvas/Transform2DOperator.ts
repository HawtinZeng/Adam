import { Box } from "@flatten-js/core";
import * as d3c from "d3-color";
import { colorLabel2Key } from "src/MainMenu";
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
  border: number = 5;
  pointW: number = 20;
  fillColor: d3c.Color = d3c.rgb(colorLabel2Key["橙色"]);
  borderColor: d3c.Color = d3c.rgb(colorLabel2Key["黑色"]);

  constructor(eleStaticBbx: Box) {
    const c = eleStaticBbx.center;

    const w = eleStaticBbx.width;
    const h = eleStaticBbx.height;
    const offsetAlignDiagonal = this.pointW / 2;

    const referenceN = { x: c.x, y: c.y - h / 2 };
    this.handles[TransformHandle.n] = new Box(
      referenceN.x - offsetAlignDiagonal,
      referenceN.y - offsetAlignDiagonal,
      referenceN.x + offsetAlignDiagonal,
      referenceN.y + offsetAlignDiagonal
    );

    const referenceNe = { x: c.x + w / 2, y: c.y - h / 2 };
    this.handles[TransformHandle.ne] = new Box(
      referenceNe.x - offsetAlignDiagonal,
      referenceNe.y - offsetAlignDiagonal,
      referenceNe.x + offsetAlignDiagonal,
      referenceNe.y + offsetAlignDiagonal
    );

    const referenceE = { x: c.x + w / 2, y: c.y };
    this.handles[TransformHandle.ne] = new Box(
      referenceE.x - offsetAlignDiagonal,
      referenceE.y - offsetAlignDiagonal,
      referenceE.x + offsetAlignDiagonal,
      referenceE.y + offsetAlignDiagonal
    );

    const referenceES = { x: c.x + w / 2, y: c.y + h / 2 };
    this.handles[TransformHandle.se] = new Box(
      referenceES.x - offsetAlignDiagonal,
      referenceES.y - offsetAlignDiagonal,
      referenceES.x + offsetAlignDiagonal,
      referenceES.y + offsetAlignDiagonal
    );

    const referenceS = { x: c.x, y: c.y + h / 2 };
    this.handles[TransformHandle.s] = new Box(
      referenceS.x - offsetAlignDiagonal,
      referenceS.y - offsetAlignDiagonal,
      referenceS.x + offsetAlignDiagonal,
      referenceS.y + offsetAlignDiagonal
    );

    const referenceSW = { x: c.x - h / 2, y: c.y + h / 2 };
    this.handles[TransformHandle.sw] = new Box(
      referenceSW.x - offsetAlignDiagonal,
      referenceSW.y - offsetAlignDiagonal,
      referenceSW.x + offsetAlignDiagonal,
      referenceSW.y + offsetAlignDiagonal
    );

    const referenceW = { x: c.x - h / 2, y: c.y };
    this.handles[TransformHandle.sw] = new Box(
      referenceW.x - offsetAlignDiagonal,
      referenceW.y - offsetAlignDiagonal,
      referenceW.x + offsetAlignDiagonal,
      referenceW.y + offsetAlignDiagonal
    );

    const referenceWN = { x: c.x - h / 2, y: c.y - h / 2 };
    this.handles[TransformHandle.nw] = new Box(
      referenceWN.x - offsetAlignDiagonal,
      referenceWN.y - offsetAlignDiagonal,
      referenceWN.x + offsetAlignDiagonal,
      referenceWN.y + offsetAlignDiagonal
    );

    const referenceRotation = {
      x: eleStaticBbx.center.x,
      y: eleStaticBbx.center.y - eleStaticBbx.height / 2 - 30,
    };
    this.handles[TransformHandle.ro] = new Box(
      referenceRotation.x - offsetAlignDiagonal,
      referenceRotation.y - offsetAlignDiagonal,
      referenceRotation.x + offsetAlignDiagonal,
      referenceRotation.y + offsetAlignDiagonal
    );
  }
}
