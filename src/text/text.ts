import { Polygon } from "@zenghawtin/graph2d";
import { cloneDeep } from "lodash";
import { nanoid } from "nanoid";
import { drawingCanvasCache } from "src/CoreRenderer/DrawCanvas/canvasCache";
import { DrawingElement, Point } from "src/CoreRenderer/basicTypes";
import { DrawingType } from "src/CoreRenderer/drawingElementsTypes";
import { AnimationScheduler } from "src/animations/requestAniThrottle";
import { lightBlue } from "src/theme/colors";

type Steps4 = 1 | 2 | 3 | 4;

export class Text implements DrawingElement {
  points: Point[] = [];
  id: string = "will be overwritten";
  strokeColor: string = "#ff0000";
  strokeStyle: "solid" | "dashed" = "solid";
  fillStyle: "solid" | "hachuo" | "cross-hatch" | "none" = "solid";
  opacity: number = 1;
  belongedFrame: string = "defaultFrameId";
  belongedGroup: string = "defaultGrp";
  status: "locked" | "notLocked" = "notLocked";
  isDeleted: boolean = false;
  position: Point = { x: 100, y: 100 };
  lastPos: Point = { x: 0, y: 0 };
  rotation: number = 0;
  scale: Point = { x: 1, y: 1 };
  boundary: Polygon[] = [];
  excludeArea: Polygon[] = [];
  needCacheCanvas: boolean = true;
  rotateOrigin: Point = { x: 0, y: 0 };

  content: string;

  layoutType: "multipleLine" | "oneLine" = "oneLine";
  type: DrawingType = DrawingType.text;
  color: string = "#ff0000";
  fontFamily: string = "黑体";
  fontSize: string = "30px";

  boundingLineAboveBaseLine?: number;
  canvas?: HTMLCanvasElement;
  oriImageData?: ImageData;
  textWidth?: number;

  cursorStep: Steps4 = 1;
  cursorAnimation: AnimationScheduler;

  /** 后缀G表示为getter属性 */
  get fontSizeNumberG() {
    return Number(this.fontSize.replace("px", ""));
  }

  constructor(content: string, fontFamily: string, color: string) {
    this.content = content;
    this.position = { x: 0, y: this.fontSizeNumberG };

    this.fontFamily = fontFamily;
    this.color = color;
    this.id = nanoid();

    this.cursorAnimation = new AnimationScheduler(
      this.animateCursor.bind(this),
      1
    );
  }

  createTextCanvas(mainCanva: HTMLCanvasElement) {
    const canvas = document.createElement("canvas") as HTMLCanvasElement;
    canvas.width = mainCanva.width;
    canvas.height = mainCanva.height;

    const ctx = canvas.getContext("2d")!;
    ctx.save();
    ctx.font = this.fontSize + " " + this.fontFamily;
    ctx.fillStyle = this.color;

    const textMetrics = ctx.measureText(this.content);
    this.boundingLineAboveBaseLine = textMetrics.fontBoundingBoxAscent;
    this.textWidth = textMetrics.width;
    ctx.fillText(this.content, this.position.x, this.position.y);
    ctx.restore();

    this.canvas = canvas;
    drawingCanvasCache.ele2DrawingCanvas.set(this, canvas);

    this.cursorAnimation.start();
  }

  animateCursor() {
    if (this.cursorStep === 4) {
      this.clearCursor();
    } else {
      this.drawCursor();
      this.lastPos = cloneDeep(this.position);
    }
    this.cursorStep = (
      this.cursorStep + 1 > 4 ? 1 : this.cursorStep + 1
    ) as Steps4;
  }

  drawCursor() {
    const ctx = this.canvas!.getContext("2d");

    ctx!.save();
    ctx!.fillStyle = lightBlue;
    ctx!.fillRect(
      this.position.x + this.textWidth!,
      this.position.y - this.boundingLineAboveBaseLine!,
      3,
      30
    );
    ctx!.restore();
  }
  clearCursor() {
    const ctx = this.canvas!.getContext("2d");
    ctx!.clearRect(
      this.lastPos.x + this.textWidth!,
      this.lastPos.y - this.boundingLineAboveBaseLine!,
      3,
      30
    );
  }
}
