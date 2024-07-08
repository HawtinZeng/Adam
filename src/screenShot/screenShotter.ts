import { Box, Polygon } from "@zenghawtin/graph2d";
import { Transform2DOperator } from "src/CoreRenderer/DrawCanvas/Transform2DOperator";
import { Point } from "src/CoreRenderer/basicTypes";
import { Rect } from "src/geometries/Rect";

export class ScreenShotter {
  shotRectangle: Transform2DOperator;
  oriImageData: ImageData;
  overlay: Rect = new Rect(
    new Box(0, 0, window.innerWidth, window.innerHeight)
  );
  constructor(sr: Transform2DOperator, ori: ImageData) {
    this.shotRectangle = sr;
    this.oriImageData = ori;
    sr.ctx.fillStyle = "red";
    sr.ctx.fillRect(200, 200, 20, 20);

    this.shotRectangle.draw();
  }

  get leftTop() {
    return this.shotRectangle.rect.polygon.vertices[0];
  }

  updateRightBottom(p: Point) {
    const globalCtx = this.shotRectangle.ctx;
    globalCtx.putImageData(this.oriImageData, 0, 0);

    const newPol = new Polygon(
      new Box(this.leftTop.x, this.leftTop.y, p.x, p.y)
    );
    this.shotRectangle = new Transform2DOperator(newPol, 0, globalCtx, false);
    this.shotRectangle.draw();
  }
}
