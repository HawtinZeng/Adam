import { Box, Point, Polygon } from "@zenghawtin/graph2d";
import { getBoundryPoly } from "src/CoreRenderer/boundary";
import { Transform2DOperator } from "src/CoreRenderer/DrawCanvas/Transform2DOperator";
import { Scene } from "src/drawingElements/data/scene";
import { Rect } from "src/geometries/Rect";
import { Shot } from "src/screenShot/Shot";

export class ScreenShotter {
  shotRectangle: Transform2DOperator | undefined;
  oriImageData: ImageData | undefined;
  shot: Shot | undefined;

  overlay: Rect | undefined;

  firstPt: Point | undefined;
  secondPt: Point | undefined;
  drawCanvas!: HTMLCanvasElement;
  scene: Scene;

  constructor(scene: Scene) {
    this.scene = scene;
  }

  get leftTop() {
    return this.shotRectangle?.rect.polygon.vertices[0];
  }

  transform(e: MouseEvent) {
    if (this.firstPt && !this.secondPt) {
      if (!this.oriImageData || !this.firstPt) return;
      const bgCtx = this.drawCanvas!.getContext("2d")!;
      bgCtx.putImageData(this.oriImageData, 0, 0);

      const newPol = new Polygon(
        new Box(this.firstPt.x, this.firstPt.y, e.clientX, e.clientY)
      );
      this.shotRectangle = new Transform2DOperator(
        newPol,
        0,
        bgCtx,
        false,
        false
      );
      this.shotRectangle.draw();
    }
  }

  async startScreenShot(drawCanvas: HTMLCanvasElement) {
    this.drawCanvas = drawCanvas;
    this.oriImageData = this.drawCanvas
      .getContext("2d", { willReadFrequently: true })!
      .getImageData(0, 0, this.drawCanvas.width, this.drawCanvas.height);
    const ctx = this.drawCanvas.getContext("2d")!;
    if (!ctx) return;
    ctx.save();
    const source = (window as any).sourceId;
    if (source) {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          // @ts-ignore
          mandatory: {
            chromeMediaSource: "desktop",
            chromeMediaSourceId: source,
            minWidth: this.drawCanvas.width,
            minHeight: this.drawCanvas.height,
          },
        },
      });
      const i = new ImageCapture(stream.getVideoTracks()[0]);
      const screenImg = await i.grabFrame();
      this.shot = new Shot(screenImg);

      this.overlay = new Rect(new Box(0, 0, screenImg.width, screenImg.height));
    }
  }

  addPoint(e: MouseEvent, s: Scene, ss: Function, setSelected: Function) {
    if (!this.firstPt) {
      this.firstPt = new Point(e.clientX, e.clientY);
      return;
    }

    if (!this.secondPt) {
      this.secondPt = new Point(e.clientX, e.clientY);

      this.shot!.position = this.firstPt;
      this.shot!.width = Math.abs(this.secondPt.x - this.firstPt.x);
      this.shot!.height = Math.abs(this.secondPt.y - this.firstPt.y);

      if (this.secondPt.x - this.firstPt.x < 0) {
        this.shot!.scale.x = -1;
      }

      if (this.secondPt.y - this.firstPt.y < 0) {
        this.shot!.scale.y = -1;
      }

      this.shot!.boundary[0] = getBoundryPoly(this.shot as any)!;
      this.shot!.rotateOrigin = this.shot!.boundary[0].box.center;

      setSelected(2);
    }
  }

  terminate() {}
}
