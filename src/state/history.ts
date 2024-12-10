import { DrawingElement } from "src/CoreRenderer/basicTypes";
/* 
  在数据改变时记录历史
  例如：
    history.add([cloneDeep(newEle)]);
    sceneData.elements.push(newEle)
  
    const oldEle = cloneDeep(newEle);
    ele.position.x += 100;
    history.update([oldEle], [cloneDeep(ele)]);q
*/
export type Action = {
  type: "add" | "update" | "delete";
  oldElements: Array<DrawingElement>;
  newElements: Array<DrawingElement>;
};
export class History {
  window2Action: Map<number, Action[]> = new Map();
  window2Head: Map<number, number> = new Map();
  currentWindowId: number = -1;

  changeScene(winId: number) {
    this.currentWindowId = winId;
    if (this.window2Action[this.currentWindowId] === undefined) {
      this.window2Action[this.currentWindowId] = [];
    }

    if (this.window2Head[this.currentWindowId] === undefined) {
      this.window2Head[this.currentWindowId] =
        this.window2Action[this.currentWindowId].length - 1;
    }
  }

  add(eles: DrawingElement[]) {
    let exist: Action[] = this.window2Action[this.currentWindowId];

    exist.push({
      type: "add",
      oldElements: [],
      newElements: eles,
    });
  }

  delete(eles: DrawingElement[]) {
    let exist: Action[] = this.window2Action[this.currentWindowId];
    exist.push({
      type: "delete",
      oldElements: eles,
      newElements: [],
    });
  }

  update(oldEles: DrawingElement[], newEles: DrawingElement[]) {
    let exist: Action[] = this.window2Action[this.currentWindowId];
    exist.push({
      type: "update",
      oldElements: oldEles,
      newElements: newEles,
    });
  }

  back() {
    const head = this.window2Head[this.currentWindowId];
    if (head > 0) {
      this.window2Head[this.currentWindowId] = head - 1;
    }

    const backAction = this.window2Action[this.currentWindowId][
      this.window2Head[this.currentWindowId]
    ] as Action;

    const applyAction: Action = {
      type: "update",
      oldElements: [],
      newElements: [],
    };

    const t = backAction.type;
    switch (t) {
      case "add": {
        applyAction.type = "delete";
        applyAction.oldElements = backAction.newElements;
        applyAction.newElements = [];
        break;
      }

      case "delete": {
        applyAction.type = "add";
        applyAction.oldElements = [];
        applyAction.newElements = backAction.oldElements;
        break;
      }

      case "update": {
        applyAction.oldElements = backAction.newElements;
        applyAction.newElements = backAction.oldElements;
        break;
      }
    }

    return applyAction;
  }

  forward() {
    const maxHead = this.window2Action[this.currentWindowId].length;
    const head = this.window2Head[this.currentWindowId];
    if (head < maxHead) {
      this.window2Head[this.currentWindowId] = head + 1;
    }

    const applyAction = this.window2Action[this.currentWindowId][
      this.window2Head[this.currentWindowId]
    ] as Action;

    return applyAction;
  }
}
