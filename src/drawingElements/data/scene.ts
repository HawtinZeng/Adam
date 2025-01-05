import { merge } from "lodash";
import {
  Transform2DOperator,
  Transform2DOperatorLine,
} from "src/CoreRenderer/DrawCanvas/Transform2DOperator";
import {
  DomElement,
  DrawingElement,
  SceneOptions,
} from "src/CoreRenderer/basicTypes";
export type ActionType =
  | "addPoints"
  | "erase"
  | "transform"
  | "scale"
  | "delete"
  | "addImg";
export type UpdatingElement = {
  type: ActionType;
  ele: DrawingElement;
  oriImageData?: ImageData; // addPoints 操作启动之前的整个画布绘图数据
  handleOperator?: Transform2DOperator | Transform2DOperatorLine;
};
export class Scene {
  elements: DrawingElement[] = [];
  options: SceneOptions = { scale: 1 };
  updatingElements: UpdatingElement[] = [];
  domElements: DomElement[];
  windowId: number;
  windowScrollSpeed: number = 0;
  firstShowWindowScreenShot: HTMLCanvasElement | undefined;

  constructor(
    elements: DrawingElement[],
    domElements: DomElement[],
    options?: SceneOptions,
    windowId: number = 0
  ) {
    this.elements = elements;
    this.domElements = domElements;
    if (options !== undefined) {
      merge(this.options, options);
    }
    this.windowId = windowId;
  }
}
