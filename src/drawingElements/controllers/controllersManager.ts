import { BaseContl } from "src/drawingElements/controllers/baseContl";

export class ControllersManager {
  activeController: BaseContl | null = null;
  bindingHtmlElement: HTMLElement;
  static singleInstance: ControllersManager | null = null;
  constructor(bindingHtmlElement: HTMLElement) {
    this.bindingHtmlElement = bindingHtmlElement;
  }
  switchController(newContl: BaseContl) {
    if (this.activeController !== null) {
      this.activeController.clearSetup();
      this.clearStaleEventHandler(this.activeController);
    }

    this.activeController = newContl;
    this.activeController.setup();
    this.attachActiveEventHandler(this.activeController);
  }
  clearStaleEventHandler(staleController: BaseContl) {
    this.bindingHtmlElement.removeEventListener(
      "mousedown",
      staleController.onMousedown
    );
    this.bindingHtmlElement.removeEventListener(
      "mousemove",
      staleController.onMousemove
    );
    this.bindingHtmlElement.removeEventListener(
      "mouseup",
      staleController.onMouseup
    );
  }
  attachActiveEventHandler(cont: BaseContl) {
    this.bindingHtmlElement.addEventListener("mousedown", cont.onMousedown);
    this.bindingHtmlElement.addEventListener("mousemove", cont.onMousemove);
    this.bindingHtmlElement.addEventListener("mouseup", cont.onMouseup);
  }
}
