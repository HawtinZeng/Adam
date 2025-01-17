// @ts-nocheck
import { Box, Polygon, Vector } from "@zenghawtin/graph2d";
import * as d3c from "d3-color";
import { drawRectBorder, drawText } from "src/CoreRenderer/DrawCanvas/core";
import { DrawingElement } from "src/CoreRenderer/basicTypes";
import { getBoundryPoly } from "src/CoreRenderer/boundary";
declare global {
  interface Window {
    synchronizer: Synchronizer;
    eles: DrawingElement[];
    Synchronizer?: Synchronizer;
    globalSynchronizer?: { value?: Synchronizer };
  }
}

export class Synchronizer {
  areasMap: Map<string, Box> = new Map(); // id => Box
  elesMap: Map<string, DrawingElement[]> = new Map(); // id => DrawingElement

  scrollTopMap: Map<string, number> = new Map();

  windowId: number;
  windowBox: Box;
  title: string;

  constructor(winId: number, initialWindowBox: Box, title: string) {
    this.windowId = winId;
    this.windowBox = initialWindowBox;
    this.title = title;
  }
  // add or get
  setArea(b: Box, id: string) {
    this.areasMap.set(id, b);
  }

  /*
    给没有分区的元素分区，然后记录这个分区
  */
  partition(eles: DrawingElement[], areaId: string) {
    try {
      // Re calc areaInfo of  all  ele
      const scrollTop = this.scrollTopMap.get(areaId) ?? 0;
      const b = this.areasMap.get(areaId)!;

      const bWithScrollHidden = new Box(
        b.xmin,
        b.ymin - scrollTop,
        b.xmax,
        b.ymax
      );

      eles.forEach((ele) => {
        const boundingPoly = ele.boundary[0];
        if (!boundingPoly) return;
        if (ele.includingPart) return; // DON"T change the assigned area of any elements.

        const contained = bWithScrollHidden.contains(boundingPoly);
        if (contained) {
          ele.includingPart = areaId;
          let exists = this.elesMap.get(areaId)!;
          if (!exists) this.elesMap.set(areaId, []);

          this.elesMap.get(areaId)!.push(ele);
        }
      });
    } catch (e) {}
  }

  scrollTop(areaId: string, scrollTop: number): boolean {
    const exist = this.scrollTopMap.get(areaId)!;
    if (!exist) {
      this.scrollTopMap.set(areaId, scrollTop);
      return false;
    }

    const delta = exist - scrollTop; // revert direction from scrollTop to canvas coordinates

    this.scrollTopMap.set(areaId, scrollTop);

    const elesNeedScroll = this.elesMap.get(areaId);

    elesNeedScroll?.forEach((el) => {
      el.position.y += delta;
      el.rotateOrigin.y += delta;
      el.boundary[0] = getBoundryPoly(el)!;
    });
    return !!elesNeedScroll?.length;
  }

  /**
   *
   * @param newArea 新的最大的Box，即为窗口的Box
   */
  updateArea(changedWindowBox: Box, id: string) {
    this.updateBindElePos(changedWindowBox, id);
    this.areasMap.set(id, changedWindowBox);

    this.windowBox = changedWindowBox;
  }

  updateBindElePosAllAreas(box: Box) {
    const deltaXmin = box.xmin - this.windowBox.xmin;
    const deltaYmin = box.ymin - this.windowBox.ymin;
    const changedVec = new Vector(deltaXmin, deltaYmin);

    [...this.areasMap.keys()].forEach((areaId) => {
      this.elesMap.get(areaId)?.forEach((e) => {
        e.position.x += deltaXmin;
        e.position.y += deltaYmin;
        console.log(e.position.y);

        e.boundary.forEach(
          (bd, idx) => (e.boundary[idx] = bd.translate(changedVec))
        );
        e.excludeArea.forEach((pol, idx) => {
          e.excludeArea[idx] = pol.translate(changedVec);
        });

        e.rotateOrigin.x += changedVec.x;
        e.rotateOrigin.y += changedVec.y;
      });
    });

    this.windowBox = box;
  }
  updateBindElePos(changedWindowBox: Box, id: string) {
    const deltaXmin = changedWindowBox.xmin - this.windowBox.xmin;
    const deltaYmin = changedWindowBox.ymin - this.windowBox.ymin;

    const changedVec = new Vector(deltaXmin, deltaYmin);

    this.elesMap.get(id)?.forEach((e) => {
      e.position.x += deltaXmin;
      e.position.y += deltaYmin;

      e.boundary.forEach(
        (bd, idx) => (e.boundary[idx] = bd.translate(changedVec))
      );
      e.excludeArea.forEach((pol, idx) => {
        e.excludeArea[idx] = pol.translate(changedVec);
      });

      e.rotateOrigin.x += changedVec.x;
      e.rotateOrigin.y += changedVec.y;
    });
  }

  // for debug
  drawAllAreas() {
    let count = 0;

    this.areasMap.forEach((b) => {
      count++;

      const el = this.elesMap.get(b)?.[0];
      drawRectBorder(null, new Polygon(b), d3c.rgb("#14C0E0"), 10 * count);
      if (el) {
        const textPos = { x: b.xmin, y: b.ymin };
        drawText(null, textPos, el.id);
      }
    });
  }

  approximatelySame(a: Box, b: Box) {
    if (
      Math.abs(a.xmin - b.xmin) < 10 &&
      Math.abs(a.xmax - b.xmax) < 10 &&
      Math.abs(a.ymin - b.ymin) < 10 &&
      Math.abs(a.ymax - b.ymax) < 10
    ) {
      return true;
    } else {
      return false;
    }
  }

  clearAllEles() {
    this.elesMap.forEach((els, box) => {
      els.length = 0;
    });
  }

  getAreaNum() {
    return [...this.areasMap.keys()].length;
  }
}
export const globalSynchronizer: { value?: Synchronizer } = {};
