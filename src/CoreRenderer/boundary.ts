import {
  Box,
  Circle,
  point,
  Point,
  Polygon,
  Vector,
} from "@zenghawtin/graph2d";
import { debugArrow } from "src/App";
import { drawCircle, getTriangle } from "src/CoreRenderer/DrawCanvas/core";
import { DrawingElement } from "src/CoreRenderer/basicTypes";
import {
  ArrowShapeElement,
  CircleShapeElement,
  DrawingType,
  FreeDrawing,
  ImageElement,
  PolylineShapeElement,
  RectangleShapeElement,
} from "src/CoreRenderer/drawingElementsTemplate";
import { thickLineToPolygon } from "src/common/utils";
import { circle2Polygon } from "src/commonUtils";

export function getCircleBoundary(cir: CircleShapeElement) {
  const circleGeo = circle2Polygon(new Circle(new Point(0, 0), cir.radius))
    .scale(cir.scale.x, cir.scale.y)
    .translate(new Vector(cir.rotateOrigin.x, cir.rotateOrigin.y));

  return circleGeo.rotate(cir.rotation, cir.rotateOrigin);
}

export function getBoundryPoly(ele: DrawingElement) {
  let bbx: Box = new Box();
  if (ele.type === DrawingType.img || ele.type === DrawingType.rectangle) {
    const ensureTypeEle = ele as ImageElement | RectangleShapeElement;
    const pos = ensureTypeEle.position;

    bbx = new Box(
      pos.x,
      pos.y,
      pos.x + ensureTypeEle.width * ensureTypeEle.scale.x,
      pos.y + ensureTypeEle.height * ensureTypeEle.scale.y
    );
    return new Polygon(bbx).rotate(ele.rotation, bbx.center);
  } else if (ele.type === DrawingType.circle) {
    const circle = ele as CircleShapeElement;
    const pos = circle.position;

    bbx = new Box(
      pos.x,
      pos.y,
      pos.x + circle.radius * 2 * circle.scale.x,
      pos.y + circle.radius * 2 * circle.scale.y
    );
    return new Polygon(bbx).rotate(ele.rotation, bbx.center);
  } else if (ele.type === DrawingType.arrow) {
    const arrow = ele as ArrowShapeElement;
    const endPt = {
      x: arrow.points[1].x + arrow.position.x,
      y: arrow.points[1].y + arrow.position.y,
    };

    const [endPos, startPos] = [
      {
        x: arrow.points[1].x + arrow.position.x,
        y: arrow.points[1].y + arrow.position.y,
      },
      {
        x: arrow.points[0].x + arrow.position.x,
        y: arrow.points[0].y + arrow.position.y,
      },
    ];

    const lineVec = new Vector(endPos.x - startPos.x, endPos.y - startPos.y);
    const verticalToBottom = new Vector(0, 1);
    const rotation = lineVec.invert().angleTo(verticalToBottom);
    const [v1x, v1y, v2x, v2y, v3x, v3y] = getTriangle(
      endPt.x,
      endPt.y,
      arrow.strokeWidth * 4,
      -rotation
    );

    const halfThickness = arrow.strokeWidth / 2;
    const downVec = lineVec.normalize().rotate90CCW();
    const upVec = lineVec.normalize().rotate90CW();
    const realDVec = downVec.scale(halfThickness, halfThickness);
    const realUVec = upVec.scale(halfThickness, halfThickness);

    const pol = new Polygon([
      new Point(v3x, v3y),
      new Point(v1x, v1y),
      new Point(endPos.x + realUVec.x, endPos.y + realUVec.y),
      new Point(startPos.x + realUVec.x, startPos.y + realUVec.y),
      new Point(startPos.x + realDVec.x, startPos.y + realDVec.y),
      new Point(endPos.x + realDVec.x, endPos.y + realDVec.y),
      new Point(v2x, v2y),
    ]);
    if (debugArrow)
      [...pol.vertices].forEach((v) => {
        drawCircle(null, new Circle(v, 10));
      });
    return pol;
  } else if (ele.type === DrawingType.polyline) {
    const polyline = ele as PolylineShapeElement;
    const offset = new Vector(ele.position.x, ele.position.y);
    const poly = thickLineToPolygon(
      polyline.points.map((p) => {
        return point(p.x, p.y).translate(offset);
      }),
      polyline.strokeWidth
    );

    return poly;
  } else if (ele.type === DrawingType.freeDraw) {
    const free = ele as FreeDrawing;
    const pos = free.position;
    const worldBoundary = free.oriBoundary[0]
      .translate(new Vector(-free.scaleOrigin.x, -free.scaleOrigin.y))
      .scale(free.scale.x, free.scale.y)
      .translate(new Vector(free.scaleOrigin.x, free.scaleOrigin.y))
      .translate(new Vector(pos.x, pos.y))
      .rotate(
        ele.rotation,
        new Point(free.rotateOrigin.x, free.rotateOrigin.y)
      );

    return worldBoundary;
  }
}

export function getCenter(free: FreeDrawing) {
  const pos = free.position;

  const centerWorld = free.oriBoundary[0].box.center
    .translate(new Vector(-free.scaleOrigin.x, -free.scaleOrigin.y))
    .scale(free.scale.x, free.scale.y)
    .translate(new Vector(free.scaleOrigin.x, free.scaleOrigin.y))
    .translate(new Vector(pos.x, pos.y))
    .rotate(free.rotation, new Point(free.rotateOrigin.x, free.rotateOrigin.y));

  return centerWorld;
}

export function getExcludeBoundaryPoly(ele: DrawingElement) {
  if (ele.type === DrawingType.freeDraw) {
    const free = ele as FreeDrawing;
    const ori = free.oriexcludeArea;

    return ori.map((pol) => {
      const tranPol = pol.translate(
        new Vector(free.position.x, free.position.y)
      );

      return tranPol.rotate(ele.rotation, free.rotateOrigin);
    });
  }
}
