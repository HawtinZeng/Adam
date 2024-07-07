import { Box } from "@zenghawtin/graph2d";
import { Transform2DOperator } from "src/CoreRenderer/DrawCanvas/Transform2DOperator";
import { Rect } from "src/geometries/Rect";

export class ScreenShotter {
  shotRectangle: Transform2DOperator;
  overlay: Rect = new Rect(
    new Box(0, 0, window.innerWidth, window.innerHeight)
  );
  constructor(sr: Transform2DOperator) {
    this.shotRectangle = sr;
  }
}
