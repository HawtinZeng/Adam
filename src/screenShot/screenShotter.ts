import { Box, Point, Polygon } from "@zenghawtin/graph2d";
import { cloneDeepGenId } from "src/common/utils";
import { Transform2DOperator } from "src/CoreRenderer/DrawCanvas/Transform2DOperator";
import {
  ImageElement,
  newImgElement,
} from "src/CoreRenderer/drawingElementsTemplate";
import { Rect } from "src/geometries/Rect";
type Status =
  | "entering"
  | "addedFirstPt"
  | "addedSecondPt"
  | "created"
  | "ended";
let moduleScope_eventListener_transform: (...args: any[]) => void;
let moduleScope_eventListener_addPoint: (...args: any[]) => void;

export class ScreenShotter {
  shotRectangle: Transform2DOperator | undefined;
  oriImageData: ImageData | undefined;
  screenImg!: ImageElement;
  overlay: Rect = new Rect(
    new Box(0, 0, window.innerWidth, window.innerHeight)
  );
  firstPt: Point | undefined;
  secondPt: Point | undefined;
  drawCanvas!: HTMLCanvasElement;

  transform(e: MouseEvent) {
    if (this.firstPt) {
      this.updateTranasform2DOperator(new Point(e.clientX, e.clientY));
    }
  }

  async startScreenShot(drawCanvas: HTMLCanvasElement) {
    this.drawCanvas = drawCanvas;
    moduleScope_eventListener_transform = this.transform.bind(this);
    moduleScope_eventListener_addPoint = this.addPoint.bind(this);
    this.drawCanvas.addEventListener(
      "mousemove",
      moduleScope_eventListener_transform
    );
    this.drawCanvas.addEventListener(
      "mousedown",
      moduleScope_eventListener_addPoint
    );
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
      this.screenImg = cloneDeepGenId(newImgElement);
      this.screenImg.image = screenImg; // captured img
    }
  }
  addPoint(e: MouseEvent) {
    if (!this.firstPt) {
      this.firstPt = new Point(e.clientX, e.clientY);
      return;
    }

    if (!this.secondPt) {
      this.secondPt = new Point(e.clientX, e.clientY);
      this.created();
      return;
    }
  }
  created() {
    this.drawCanvas.removeEventListener(
      "mousemove",
      moduleScope_eventListener_transform
    );
    this.drawCanvas.removeEventListener(
      "mousedown",
      moduleScope_eventListener_addPoint
    );

    this.drawCanvas.addEventListener("mousedown", this.intersect);
  }
  intersect(e: MouseEvent) {}
  get leftTop() {
    return this.shotRectangle?.rect.polygon.vertices[0];
  }

  updateTranasform2DOperator(p: Point) {
    if (!this.oriImageData || !this.firstPt) return;

    const bgCtx = this.drawCanvas!.getContext("2d")!;

    bgCtx.putImageData(this.oriImageData, 0, 0);

    const newPol = new Polygon(
      new Box(this.firstPt.x, this.firstPt.y, p.x, p.y)
    );
    this.shotRectangle = new Transform2DOperator(newPol, 0, bgCtx, false);
    this.shotRectangle.draw();
  }
}
