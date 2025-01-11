import { Polygon } from "@zenghawtin/graph2d";
import { Degree } from "src/CoreRenderer/basicTypes";
import { DrawingType } from "src/CoreRenderer/drawingElementsTemplate";
import { Point } from "src/Utils/Data/geometry";

export class Shot {
  type: DrawingType.shot = DrawingType.shot;
  position: Point = new Point(0, 0);
  pinedPos: Point = new Point(0, 0);
  rotation: Degree = 0;
  scale: Point = new Point(1, 1);
  rotateOrigin: Point = new Point(1, 1);
  pined: boolean = false;

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

  pin() {
    this.pined = true;
    this.pinedPos.x = this.position.x;
    this.pinedPos.y = this.position.y;
    this.width = this.realWidth;
    this.height = this.realHeight;

    this.scale.x = 1;
    this.scale.y = 1;
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (!ctx) return;

    ctx.save();

    if (this.pined) {
      ctx.translate(this.rotateOrigin.x, this.rotateOrigin.y);
      ctx.rotate(this.rotation);
      ctx.translate(-this.rotateOrigin.x, -this.rotateOrigin.y);

      ctx.translate(this.position.x, this.position.y);
      ctx.scale(this.scale.x, this.scale.y);

      ctx.drawImage(
        this.screen,
        this.pinedPos.x,
        this.pinedPos.y,
        this.width,
        this.height,
        0,
        0,
        this.width,
        this.height
      );
    } else {
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
    }

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
