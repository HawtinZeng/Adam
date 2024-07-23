import { Box, Polygon, Vector } from "@zenghawtin/graph2d";
import * as d3c from "d3-color";
import { debounce } from "lodash";
import { drawRectBorder } from "src/CoreRenderer/DrawCanvas/core";
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
    Synchronizer?: Synchronizer;
  }
}

export class Synchronizer {
  areasMap: Map<string, Box> = new Map();
  elesMap: Map<Box, DrawingElement[]> = new Map();

  scrollTopMap: Map<Box, number> = new Map();
  topPadding?: number;
  constructor() {
    window.Synchronizer = this;
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
  partition(eles: DrawingElement[], area?: Box) {
    if (area) {
      this.addArea(area);
    }

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

    let contentArea: Box = new Box(1, 1, 2, 2);
    this.areasMap.forEach((b) => {
      if (new Polygon(contentArea).area() < new Polygon(b).area())
        contentArea = b;
    });
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
        debounce(() => (el.boundary[0] = getBoundryPoly(el)!), 500)();
      });
      return !!scrolledEles?.length;
    }
    return false;
  }

  updateArea(newArea: Box) {
    if (this.topPadding === undefined) return;
    let contentArea: Box = new Box(-1, -1, 2, 2);

    globalSynchronizer.value?.areasMap.forEach((b) => {
      if (new Polygon(contentArea).area() < new Polygon(b).area())
        contentArea = b;
    });
    const deltaXmin = newArea.xmin - contentArea.xmin;
    const deltaXmax = newArea.xmax - contentArea.xmax;
    const deltaYmin = newArea.ymin - (contentArea.ymin - this.topPadding);
    const deltaYmax = newArea.ymax - (contentArea.ymax - this.topPadding);

    this.areasMap.forEach((b) => {
      b.xmin += deltaXmin;
      b.ymin += deltaYmin;
      b.xmax += deltaXmax;
      b.ymax += deltaYmax;
      this.elesMap.get(b)?.forEach((e) => {
        e.position.x += deltaXmin;
        e.position.y += deltaYmin;
      });
    });

    // replace these keys.
    const updatedBoxes = [...this.areasMap.values()];
    this.areasMap = new Map();
    updatedBoxes.forEach((b) => {
      this.areasMap.set(`${b.xmin}-${b.xmax}-${b.ymin}-${b.ymax}`, b);
    });
    // test whether have some incompatable area box
    [...this.areasMap.values()].forEach((k) => {
      if (![...this.elesMap.keys()].find((k1) => k === k1))
        console.log("false");
    });
  }

  drawAllAreas() {
    this.areasMap.forEach((b) => {
      drawRectBorder(null, new Polygon(b), d3c.rgb("#14C0E0"), 1);
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

  updateWindowInfo({ topPadding }: { topPadding: number }) {
    if (topPadding !== undefined) this.topPadding = topPadding;
  }
}
export const globalSynchronizer: { value?: Synchronizer } = {};
