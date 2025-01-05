import { Box, Polygon, Vector } from "@zenghawtin/graph2d";
import * as d3c from "d3-color";
import { debounce } from "lodash";
import { drawRectBorder, drawText } from "src/CoreRenderer/DrawCanvas/core";
import { DrawingElement } from "src/CoreRenderer/basicTypes";
import { getBoundryPoly } from "src/CoreRenderer/boundary";
import {
  DrawingType,
  FreeDrawing,
} from "src/CoreRenderer/drawingElementsTemplate";
declare global {
  interface Window {
    synchronizer: Synchronizer;
    eles: DrawingElement[];
    Synchronizer?: Synchronizer;
    globalSynchronizer?: { value?: Synchronizer };
  }
}

export class Synchronizer {
  areasMap: Map<string, Box> = new Map();
  elesMap: Map<Box, DrawingElement[]> = new Map();

  scrollTopMap: Map<Box, number> = new Map();

  windowId: number;
  windowBox: Box;
  title: string;

  constructor(winId: number, initialWindowBox: Box, title: string) {
    this.windowId = winId;
    this.windowBox = initialWindowBox;
    this.title = title;
  }
  // add or get
  addArea(b: Box) {
    const bk = `${b.xmin}-${b.xmax}-${b.ymin}-${b.ymax}`;
    if (!this.areasMap.has(bk)) {
      this.areasMap.set(`${b.xmin}-${b.xmax}-${b.ymin}-${b.ymax}`, b);
      this.elesMap.set(b, []);
    }

    return this.areasMap.get(`${b.xmin}-${b.xmax}-${b.ymin}-${b.ymax}`)!;
  }

  get eleToBox() {
    const eleToBox = new Map<DrawingElement, Box>();
    this.elesMap.forEach((els, box) => {
      els.forEach((el) => {
        eleToBox.set(el, box);
      });
    });
    return eleToBox;
  }
  /*
    给没有分区的元素分区，然后记录这个分区
    给在大区域的元素转移到小区域
  */
  partition({ elements: eles }: { elements: DrawingElement[] }, area?: Box) {
    if (area) {
      this.addArea(area);
    }

    try {
      const withoutIncludingParts = eles.filter((e) => {
        const replaceIncludingPart =
          e.includingPart &&
          area &&
          e.includingPart.contains(area) &&
          !e.includingPart.equal_to(area);

        return !e.includingPart || replaceIncludingPart;
      });

      withoutIncludingParts.forEach((ele) => {
        let boundingPoly: Polygon | undefined;
        if (ele.type === DrawingType.freeDraw) {
          boundingPoly = new Polygon(
            (ele as FreeDrawing).oriBoundary[0]?.box.translate(
              new Vector(ele.position.x, ele.position.y)
            )
          );
        } else {
          boundingPoly = getBoundryPoly(ele);
        }

        const allAreas = [...this.areasMap.values()];
        allAreas.sort((a, b) =>
          new Polygon(a).area > new Polygon(b).area ? 1 : -1
        );
        if (!boundingPoly) return;
        const containsArea = allAreas.find((a) => a.contains(boundingPoly));
        if (
          !containsArea ||
          (ele.includingPart &&
            new Polygon(containsArea).area >
              new Polygon(ele.includingPart).area)
        )
          return;

        // Avoid mistaking deleting the unchanged ele from box
        if (ele.includingPart) {
          const i = this.elesMap
            .get(ele.includingPart!)!
            .findIndex((allOnes) => allOnes === ele);
          this.elesMap.get(ele.includingPart!)?.splice(i, 1);
        }

        ele.includingPart = containsArea;

        const exists = this.elesMap.get(containsArea)!;
        exists.push(ele);
      });
    } catch (e) {}
  }

  scrollTop(scrollArea: Box, scrollTop: number): boolean {
    const ks = [...this.areasMap.keys()];
    let b: Box | undefined;

    for (let i = 0; i < ks.length; i++) {
      b = this.areasMap.get(ks[i]);
      if (b && this.approximatelySame(b, scrollArea)) {
        break;
      }
    }
    let delta = scrollTop;
    if (b) {
      const exist = this.scrollTopMap.get(b) ?? scrollTop;
      this.scrollTopMap.set(b, scrollTop);
      delta = exist - scrollTop; // scrollTop 与 position.y 的计算方式是相反的
      const scrolledEles = this.elesMap.get(b);

      scrolledEles?.forEach((el) => {
        el.position.y += delta;
        el.rotateOrigin.y += delta;
        debounce(() => (el.boundary[0] = getBoundryPoly(el)!), 300)();
      });
      return !!scrolledEles?.length;
    }
    return false;
  }

  /**
   *
   * @param newArea 新的最大的Box，即为窗口的Box
   */
  updateArea(changedWindowBox: Box) {
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

      this.elesMap.get(b)?.forEach((e) => {
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

    // replace these keys.
    const updatedBoxes = [...this.areasMap.values()];
    this.areasMap.clear();
    updatedBoxes.forEach((b) => {
      this.areasMap.set(`${b.xmin}-${b.xmax}-${b.ymin}-${b.ymax}`, b);
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
