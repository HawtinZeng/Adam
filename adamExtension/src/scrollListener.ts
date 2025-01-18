// @ts-nocheck

import { uniqueId } from "lodash";
import { ElementRect } from "../../commonModule/types";

function isScrollable(node: Element) {
  // @ts-ignore
  var overflowY = window.getComputedStyle(node)["overflow-y"];
  // @ts-ignore
  var overflowX = window.getComputedStyle(node)["overflow-x"];
  return {
    vertical:
      (overflowY === "scroll" || overflowY === "auto") &&
      node.scrollHeight > node.clientHeight,
    horizontal:
      (overflowX === "scroll" || overflowX === "auto") &&
      node.scrollWidth > node.clientWidth,
  };
}

declare global {
  interface Window {
    scrollLis: ScrollListener;
  }
}

/**
 * 监听一个Document的滚动事件
 */
export class ScrollListener {
  count = 0;
  constructor(public maxDepth: number) {
    this.maxDepth = maxDepth;
    window.scrollLis = this;
  }

  scrollables: Set<Element | Document> = new Set();
  addScrollListenerTo(
    doc: Document,
    handler: (e: Event) => void = function emitScroll(e: Event) {
      console.log(e.target);
    }
  ) {
    if (!(doc instanceof Document)) return;

    if (!this.scrollables.has(doc)) {
      doc.addEventListener("scroll", handler);
      this.scrollables.add(doc);
      this.count++;
    }
    [...doc.getElementsByTagName("body")[0].children].forEach((n) => {
      this.attachScrollEventToScrollableEle(n, handler, 0);
    });
  }

  attachScrollEventToScrollableEle(
    node: HTMLElement,
    handler: (e: Event) => void,
    depth: number
  ) {
    if (depth > this.maxDepth) return;

    const { vertical } = isScrollable(node);
    if (vertical) {
      if (!this.scrollables.has(node)) {
        this.scrollables.add(node);
        node.addEventListener("scroll", handler);
        node.dataset.adamExtensionId = uniqueId("adamExtensionId");
        this.count++;
      }
    }

    [...node.children].forEach((c) => {
      this.attachScrollEventToScrollableEle(c, handler, depth + 1);
    });
  }

  addSizeChangeLister(
    handler: (size: ResizeObserverEntry["borderBoxSize"]) => void
  ) {
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        handler(entry.borderBoxSize);
      }
    });
    [...this.scrollables].slice(1).forEach((el) => {
      resizeObserver.observe(el as any);
    });
  }

  getAllAreas(tabId: string, zoomValue: number) {
    return [...this.scrollables]
      .filter((ele) => {
        if (!(ele instanceof Document)) {
          const isShow = ele.checkVisibility({
            opacityProperty: true, // Check CSS opacity property too
            visibilityProperty: true, // Check CSS visibility property too
          });
          if (!isShow) return false;
        }
        return true;
      })
      .map((el) => {
        return this.getElementArea(el, tabId, zoomValue);
      });
  }

  getElementArea(ele: Element | Document, id: string, zoomValue: number) {
    const areaData: ElementRect = {
      width: 0,
      height: 0,
      offsetX: 0,
      offsetY: 0,
      topPadding: 0,
      scrollTop: 0,
      scrollHeight: 0,
      id: id,
    };
    const trigger = ele;

    if (trigger instanceof Document) {
      areaData.width = window.outerWidth;
      areaData.height = window.innerHeight * zoomValue;

      areaData.offsetX = window.screenLeft;

      areaData.offsetY =
        window.screenTop + window.outerHeight - window.innerHeight * zoomValue;

      areaData.scrollTop =
        (trigger as Document).documentElement.scrollTop * zoomValue;
    } else if (trigger instanceof HTMLElement) {
      const rect = trigger.getBoundingClientRect(); // have conflicts with https://leetcode.com/problems/maximum-score-from-grid-operations/solutions/5512718/clean-java-recursive-dp/ and https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect
      areaData.width = rect.width * zoomValue;
      areaData.height = rect.height * zoomValue;
      areaData.offsetX = rect.left * zoomValue + window.screenLeft;
      areaData.offsetY =
        rect.top * zoomValue +
        window.screenTop +
        window.outerHeight -
        window.innerHeight * zoomValue;
      areaData.scrollTop = (trigger as any)?.scrollTop * zoomValue;
      areaData.id = (trigger as HTMLElement).dataset.adamExtensionId!;
    }
    return areaData;
  }
}
