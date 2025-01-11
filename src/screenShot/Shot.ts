import { Point, Polygon } from "@zenghawtin/graph2d";
import { Degree } from "src/CoreRenderer/basicTypes";
import { DrawingType } from "src/CoreRenderer/drawingElementsTemplate";

export class Shot {
  type: DrawingType.shot = DrawingType.shot;
  position: Point = new Point(0, 0);
  rotation: Degree = 0;
  scale: Point = new Point(1, 1);
  rotateOrigin: Point = new Point(1, 1);

  needCacheCanvas: boolean = false;

  boundary: Polygon[] = [];
  excludeArea: Polygon[] = [];
  public width: number = -1;
  public height: number = -1;
  constructor(public screen: ImageBitmap) {}

  get realHeight() {
    return this.scale.y * this.height;
  }

  get realWidth() {
    return this.scale.x * this.width;
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (!ctx) return;

    ctx.save();

    this.drawOverlay(ctx);

    ctx.drawImage(
      this.screen,
      this.position.x,
      this.position.y,
      this.realWidth,
      this.realHeight,
      this.position.x,
      this.position.y,
      this.realWidth,
      this.realHeight
    );

    ctx.restore();
  }
  drawOverlay(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = "rgb(0,0,0);";
    ctx.fillRect(0, 0, this.screen.width, this.screen.height);
    ctx.restore();
  }
}
