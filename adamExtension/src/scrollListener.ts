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
  addListenerTo(
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
    node: Element,
    handler: (e: Event) => void,
    depth: number
  ) {
    if (depth > this.maxDepth) return;

    const { vertical, horizontal } = isScrollable(node);
    if (vertical || horizontal) {
      if (!this.scrollables.has(node)) {
        this.scrollables.add(node);
        node.addEventListener("scroll", handler);
        this.count++;
      }
    }

    [...node.children].forEach((c) => {
      this.attachScrollEventToScrollableEle(c, handler, depth + 1);
    });
  }
}
