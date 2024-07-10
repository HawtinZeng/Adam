import { Box, Point, Polygon } from "@zenghawtin/graph2d";
import { Transform2DOperator } from "src/CoreRenderer/DrawCanvas/Transform2DOperator";
import { Rect } from "src/geometries/Rect";
type Status =
  | "entering"
  | "addedFirstPt"
  | "addedSecondPt"
  | "afterCreating"
  | "ending";
let moduleScope_eventListener_transform: (...args: any[]) => void;
let moduleScope_eventListener_addPoint: (...args: any[]) => void;

export class ScreenShotter {
  shotRectangle: Transform2DOperator | undefined;
  oriImageData: ImageData | undefined;
  overlay: Rect = new Rect(
    new Box(0, 0, window.innerWidth, window.innerHeight)
  );
  startPt: Point | undefined;
  // TODO: 使用数据点的个数去表示状态
  status: Status = "ending";
  bgCanvas: HTMLCanvasElement;

  constructor(bg: HTMLCanvasElement) {
    this.bgCanvas = bg;
  }

  transform(e: MouseEvent) {
    const ctx = this.bgCanvas.getContext("2d")!;
    if (this.status === "addedFirstPt" || !this.startPt || !ctx) return;
    const pt = { x: e.clientX, y: e.clientY };

    ctx.clearRect(0, 0, this.bgCanvas.width, this.bgCanvas.height);
    if (this.startPt) {
      const pol = new Polygon(
        new Box(this.startPt.x, this.startPt.y, pt.x, pt.y)
      );
      this.shotRectangle = new Transform2DOperator(pol, 0, ctx, false, false);
    } else {
      this.updateTranasform2DOperator(new Point(e.clientX, e.clientY));
    }
  }

  addPoint(e: MouseEvent) {
    if (this.status === "ending") return;
    else if (this.status === "addedFirstPt") {
      this.status = "addedSecondPt";
      this.startPt = new Point(e.clientX, e.clientY);
    } else if (this.status === "addedSecondPt") this.status = "afterCreating";
    else if (this.status === "entering") {
      this.status = "addedFirstPt";
    }
  }

  async startScreenShot() {
    if (this.status === "entering") return;
    this.status = "entering";

    moduleScope_eventListener_transform = this.transform.bind(this);
    moduleScope_eventListener_addPoint = this.addPoint.bind(this);
    this.bgCanvas.addEventListener(
      "mousemove",
      moduleScope_eventListener_transform
    );
    this.bgCanvas.addEventListener(
      "mousedown",
      moduleScope_eventListener_addPoint
    );

    this.oriImageData = this.bgCanvas
      .getContext("2d", { willReadFrequently: true })!
      .getImageData(0, 0, this.bgCanvas.width, this.bgCanvas.height);

    const ctx = this.bgCanvas.getContext("2d")!;
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
            minWidth: this.bgCanvas.width,
            minHeight: this.bgCanvas.height,
          },
        },
      });
    }
  }

  terminateScreenShot() {
    this.status = "ending";

    const ctx = this.bgCanvas.getContext("2d")!;
    if (!ctx) return;
    ctx.clearRect(0, 0, this.bgCanvas.width, this.bgCanvas.height);
    this.bgCanvas.removeEventListener(
      "mousemove",
      moduleScope_eventListener_transform
    );
    this.bgCanvas.removeEventListener(
      "mousedown",
      moduleScope_eventListener_addPoint
    );
  }

  get leftTop() {
    return this.shotRectangle?.rect.polygon.vertices[0];
  }

  updateTranasform2DOperator(p: Point) {
    if (!this.shotRectangle || !this.oriImageData || !this.leftTop) return;

    const bgCtx = this.shotRectangle.ctx;
    bgCtx.putImageData(this.oriImageData, 0, 0);

    const newPol = new Polygon(
      new Box(this.leftTop.x, this.leftTop.y, p.x, p.y)
    );
    this.shotRectangle = new Transform2DOperator(newPol, 0, bgCtx, false);
    this.shotRectangle.draw();
  }
}
