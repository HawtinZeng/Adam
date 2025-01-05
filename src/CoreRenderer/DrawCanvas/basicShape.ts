import { Polygon } from "@zenghawtin/graph2d";
import * as d3c from "d3-color";
import { ShapeSettings } from "src/CoreRenderer/basicTypes";
import { drawRectBorder, drawRectFill } from "src/CoreRenderer/DrawCanvas/core";

export class RectDraw {
  poly: Polygon;
  fillColor: d3c.Color = d3c.rgb("#ffffff");
  borderColor: d3c.Color = d3c.rgb("#14C0E0");
  thickness: number = 1;

  constructor(p: Polygon, settings?: ShapeSettings) {
    this.poly = p;

    if (settings?.fillColor) this.fillColor = settings.fillColor;
    if (settings?.borderColor) this.borderColor = settings.borderColor;
    if (settings?.thickness) this.thickness = settings.thickness;
  }

  draw(ctx: CanvasRenderingContext2D) {
    drawRectFill(ctx, this.poly, this.fillColor);
    drawRectBorder(ctx, this.poly, this.borderColor, this.thickness);
  }
}
