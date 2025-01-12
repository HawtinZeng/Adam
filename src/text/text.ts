import { Point as PointZ, Polygon } from "@zenghawtin/graph2d";
import { nanoid } from "nanoid";
import { drawingCanvasCache } from "src/CoreRenderer/DrawCanvas/canvasCache";
import { onlyRedrawOneElement } from "src/CoreRenderer/DrawCanvas/core";
import { DrawingElement, Point } from "src/CoreRenderer/basicTypes";
import { DrawingType } from "src/CoreRenderer/drawingElementsTemplate";
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
  rotation: number = 0;
  scale: Point = { x: 1, y: 1 };
  boundary: Polygon[] = [];
  excludeArea: Polygon[] = [];
  needCacheCanvas: boolean = true;
  rotateOrigin: PointZ = new PointZ(0, 0);

  content: string;

  layoutType: "multipleLine" | "oneLine" = "oneLine";
  type: DrawingType = DrawingType.text;
  color: string = "#ff0000";
  fontFamily: string = "黑体";
  fontSize: string = "30px";
  get size() {
    return Number(this.fontSize.slice(0, -2));
  }

  boundingLineAboveBaseLine?: number;
  canvas?: HTMLCanvasElement;
  oriImageData?: ImageData;
  textWidth?: number;

  cursorStep: Steps4 = 1;
  cursorAnimation: AnimationScheduler;
  cursorIdx: number;
  lastCursorIdx: number;
  inputElement?: HTMLInputElement;
  mainCanvas?: HTMLCanvasElement;

  constructor(
    content: string,
    fontFamily: string,
    color: string,
    fontSize: number
  ) {
    this.content = content;
    this.cursorIdx = content.length - 1;
    this.lastCursorIdx = this.cursorIdx;

    this.position = { x: 0, y: this.size };

    this.fontFamily = fontFamily;
    this.color = color;
    this.id = nanoid();

    this.fontSize = fontSize + "px";

    this.cursorAnimation = new AnimationScheduler(
      this.animateCursor.bind(this),
      4
    );
  }

  get textMetrics() {
    const ctx = this.canvas!.getContext("2d", { willReadFrequently: true })!;

    return ctx.measureText(this.content);
  }

  refreshScene(textProperties: {
    position?: Point;
    content?: string;
    size?: number;
  }) {
    const { position, content } = textProperties;
    if (textProperties.size !== undefined)
      this.fontSize = textProperties.size + "px";
    if (position) {
      this.position = position;
      this.inputElement!.style.left = this.position.x + "px";
      this.inputElement!.style.top = this.position.y + "px";
    }

    // content可能为空的字符串，在if判断中为false
    if (content !== undefined && this.mainCanvas) {
      const contentDelta = content.length - this.content.length;
      this.cursorIdx += contentDelta;

      this.content = content;
      this.createTextCanvas(this.mainCanvas!);
    } else if (textProperties.size !== undefined) {
      this.createTextCanvas(this.mainCanvas!);
    }

    onlyRedrawOneElement(this, this.oriImageData!);

    this.inputElement!.focus();
  }

  /**
   * 获取索引范围为 0 ~ idx 的文字信息
   */
  textMetricsOfIdx(idx: number) {
    const ctx = this.canvas!.getContext("2d", { willReadFrequently: true })!;

    return ctx.measureText(this.content.slice(0, idx + 1));
  }
  /**
   * 在一个空白的canvas上绘制出文字
   * @param mainCanvas 程序的主画布
   */
  createTextCanvas(mainCanvas: HTMLCanvasElement) {
    const canvas = document.createElement("canvas") as HTMLCanvasElement;
    canvas.width = mainCanvas.width;
    canvas.height = mainCanvas.height;
    this.mainCanvas = mainCanvas;

    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
    ctx.save();
    ctx.font = this.fontSize + " " + this.fontFamily; // 注意不要复原canvas的font属性，不然后续求文字宽度将会不准确
    ctx.fillStyle = this.color;
    ctx.fillText(
      this.content,
      3,
      this.size - (this.size - this.boundingLineAboveBaseLine!)
    );

    this.canvas = canvas;
    this.boundingLineAboveBaseLine = this.textMetrics.fontBoundingBoxAscent;
    this.textWidth = this.textMetrics.width;

    drawingCanvasCache.ele2DrawingCanvas.set(this, canvas);

    this.cursorAnimation.start();
    this.appendInputElement();
  }

  animateCursor() {
    this.clearCursor();
    if (this.cursorStep !== 4) {
      this.drawCursor();
      this.lastCursorIdx = this.cursorIdx;
    }
    this.cursorStep = (
      this.cursorStep + 1 > 4 ? 1 : this.cursorStep + 1
    ) as Steps4;
    onlyRedrawOneElement(this, this.oriImageData!);
  }

  drawCursor() {
    const ctx = this.canvas!.getContext("2d", { willReadFrequently: true });
    ctx!.save();
    ctx!.fillStyle = lightBlue;
    ctx!.fillRect(
      this.textMetricsOfIdx(this.cursorIdx).width + 2,
      this.size - this.boundingLineAboveBaseLine!,
      2,
      this.size
    );
    ctx!.restore();
  }

  clearCursor() {
    if (!this.canvas) return;
    const ctx = this.canvas!.getContext("2d", { willReadFrequently: true });
    ctx!.clearRect(
      this.textMetricsOfIdx(this.lastCursorIdx).width + 2,
      this.size - this.boundingLineAboveBaseLine!,
      2,
      this.size
    );
  }

  appendInputElement() {
    if (this.inputElement) return;
    const i = document.createElement("input");
    i.placeholder = "文字输入框";
    i.id = this.id;
    i.style.position = "fixed";
    i.style.fontSize = this.fontSize;
    i.style.opacity = "0";
    i.style.zIndex = "-999"; // 防止输入框阻塞触发画布点击事件

    // move the cursor
    i.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.code === "ArrowLeft") {
        if (this.cursorIdx > -1) this.cursorIdx--;
      } else if (e.code === "ArrowRight") {
        if (this.cursorIdx < this.content.length - 1) this.cursorIdx++;
      }
      this.refreshScene({ content: i.value });
    });

    // input some character
    i.addEventListener("input", () => {
      this.refreshScene({ content: i.value });
    });

    document.body.appendChild(i);
    this.inputElement = i;
  }

  removeInputElement() {
    if (this.inputElement) {
      document.body.removeChild(this.inputElement);
      this.inputElement = undefined;
    }

    this.clearCursor();
    onlyRedrawOneElement(this, this.oriImageData!);
  }
  get height() {
    return this.size;
  }

  get width() {
    return this.textWidth;
  }
}
