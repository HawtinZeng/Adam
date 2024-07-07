import { Box } from "@zenghawtin/graph2d";
import { Transform2DOperator } from "src/CoreRenderer/DrawCanvas/Transform2DOperator";
import { Point } from "src/CoreRenderer/basicTypes";
import { Rect } from "src/geometries/Rect";

export class ScreenShotter {
  shotRectangle: Transform2DOperator;
  overlay: Rect = new Rect(
    new Box(0, 0, window.innerWidth, window.innerHeight)
  );
  constructor(sr: Transform2DOperator) {
    this.shotRectangle = sr;
  }
  updateRightBottom(p: Point) {
    //     this.shotRectangle.rect;
  }
}
