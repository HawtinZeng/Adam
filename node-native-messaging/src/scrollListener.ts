
function isScrollable (node: Element) {
  // @ts-ignore
  var overflowY = window.getComputedStyle(node)['overflow-y'];
  // @ts-ignore
  var overflowX = window.getComputedStyle(node)['overflow-x'];
  return {
    vertical: (overflowY === 'scroll' || overflowY === 'auto') && node.scrollHeight > node.clientHeight,
    horizontal: (overflowX === 'scroll' || overflowX === 'auto') && node.scrollWidth > node.clientWidth,
  };
}

export class ScrollListener {
  count = 0;
  constructor(public maxDepth: number) {
    this.maxDepth = maxDepth;
  };
  addListenerTo(doc: Document, handler: (e: Event) => void = 
  function emitScroll(e: Event) {
    console.log(e.target);
  }) {
    if (!(doc instanceof Document))  return;
    
    doc.addEventListener('scroll', handler);
    this.count++;
    this.attachScrollEventToScrollableEle(doc.getElementsByTagName('body')[0], handler, 0);
    }

    attachScrollEventToScrollableEle(node: Element,  handler: (e: Event) => void, depth: number) {
      if (depth > this.maxDepth) return;

      if (isScrollable(node)) {
        node.addEventListener('scroll', handler)
        this.count++;
      }
      
      [...node.children].forEach(c => {
        this.attachScrollEventToScrollableEle(c, handler, depth+1);
      })
    }
  }