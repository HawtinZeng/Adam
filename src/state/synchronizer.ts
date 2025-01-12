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
  addArea(b: Box, id: string) {
    if (!this.areasMap.has(id)) {
      this.areasMap.set(id, b);
      this.elesMap.set(id, []);
    }
  }
  /*
    给没有分区的元素分区，然后记录这个分区
    给在大区域的元素转移到小区域
  */
  partition(
    { elements: eles }: { elements: DrawingElement[] },
    area: Box,
    areaId: string
  ) {
    try {
      // Re calc areaInfo of  all  ele
      eles.forEach((ele) => {
        const boundingPoly = getBoundryPoly(ele)!;
        if (!boundingPoly) return;

        const allAreas = [...this.areasMap.values()];
        allAreas.sort((a, b) =>
          new Polygon(a).area > new Polygon(b).area ? 1 : -1
        );
        const containsArea = allAreas.find((a) => a.contains(boundingPoly));

        // Delete original ele from elesMap. add it later.
        if (ele.includingPart) {
          const i = this.elesMap
            .get(ele.includingPart!)!
            .findIndex((allOnes) => allOnes === ele);
          this.elesMap.get(ele.includingPart!)?.splice(i, 1);
        }

        let id = "";
        this.areasMap.forEach((box, idC) => {
          if (box === containsArea) id = idC;
        });

        ele.includingPart = id;

        const exists = this.elesMap.get(id)!;
        exists.push(ele);
      });
    } catch (e) {}
  }

  scrollTop(areaId: string, scrollTop: number): boolean {
    console.log(`scrolling ${areaId}`);

    this.scrollTopMap.set(areaId, scrollTop);
    const exist = this.scrollTopMap.get(areaId)!;

    const delta = exist - scrollTop; // scrollTop 与 position.y 的计算方式是相反的

    console.log(elesNeedScroll);

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
    const deltaXmin = changedWindowBox.xmin - this.windowBox.xmin;
    const deltaXmax = changedWindowBox.xmax - this.windowBox.xmax;
    const deltaYmin = changedWindowBox.ymin - this.windowBox.ymin;
    const deltaYmax = changedWindowBox.ymax - this.windowBox.ymax;
    const changedVec = new Vector(deltaXmin, deltaYmin);
    this.windowBox = changedWindowBox;

    this.areasMap.forEach((b) => {
      b.xmin += deltaXmin;
      b.ymin += deltaYmin;
      b.xmax += deltaXmax;
      b.ymax += deltaYmax;

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
