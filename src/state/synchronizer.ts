import { Box, Polygon, Vector } from "@zenghawtin/graph2d";
import { debounce } from "lodash";
import { DrawingElement } from "src/CoreRenderer/basicTypes";
import {
  DrawingType,
  FreeDrawing,
} from "src/CoreRenderer/drawingElementsTypes";
import { getBoundryPoly } from "src/MainMenu/imageInput";
declare global {
  interface Window {
    synchronizer: Synchronizer;
    eles: DrawingElement[];
  }
}

class Synchronizer {
  areasMap: Map<string, Box> = new Map();
  elesMap: Map<Box, DrawingElement[]> = new Map();
  scrollTopMap: Map<Box, number> = new Map();
  constructor() {
    window.synchronizer = this;
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
  */
  partition(eles: DrawingElement[], area: Box) {
    this.addArea(area);
    const withoutIncludingParts = eles.filter((e) => !e.includingPart);
    withoutIncludingParts.forEach((ele) => {
      let boundingPoly: Polygon | undefined;
      if (ele.type === DrawingType.freeDraw) {
        boundingPoly = new Polygon(
          (ele as FreeDrawing).oriBoundary[0].box.translate(
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
      if (!containsArea) return;

      ele.includingPart = containsArea;
      const exists = this.elesMap.get(containsArea)!;
      exists.push(ele);
    });
    window.eles = eles;
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
      delta = exist - scrollTop; // scrollTop 与position.y 的计算方式是相反的
      const scrolledEles = this.elesMap.get(b);

      scrolledEles?.forEach((el) => {
        el.position.y += delta;
        debounce(() => (el.boundary[0] = getBoundryPoly(el)!), 500)();
      });
      return !!scrolledEles?.length;
    }
    return false;
  }

  updateArea(newArea: Box) {
    const ks = [...this.areasMap.keys()];
    let i;
    for (i = 0; i < ks.length; i++) {
      const b = this.areasMap.get(ks[i]);
      if (b && this.approximatelySame(b, newArea)) {
        break;
      }
    }
    const originalBox = this.areasMap.get(ks[i]);
    if (!originalBox) return;

    originalBox.xmin = newArea.xmin;
    originalBox.xmax = newArea.xmax;
    originalBox.ymin = newArea.ymin;
    originalBox.ymax = newArea.ymax;

    this.areasMap.delete(ks[i]);
    this.areasMap.set(
      `${originalBox.xmin}-${originalBox.xmin}-${originalBox.ymin}-${originalBox.ymax}`,
      originalBox
    );
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
}
export const synchronizer = new Synchronizer();
