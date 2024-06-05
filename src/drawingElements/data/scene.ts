import { merge } from "lodash";
import {
  DomElement,
  DrawingElement,
  FrameData,
  SceneOptions,
} from "src/CoreRenderer/basicTypes";
export type ActionType = "addPoints" | "erase" | "transform" | "scale";
export type UpdatingElement = {
  type: ActionType;
  ele: DrawingElement;
  eraserOutlineIdx?: number;
  oriImageData?: ImageData; // addPoints 操作启动之前的整个画布绘图数据
};
export class Scene {
  elements: DrawingElement[] = [];
  frames: FrameData[] = [];
  options: SceneOptions = { scale: 1 };
  updatingElements: UpdatingElement[] = [];
  domElements: DomElement[];
  constructor(
    elements: DrawingElement[],
    domElements: DomElement[],
    frames: FrameData[],
    options?: SceneOptions
  ) {
    this.elements = elements;
    this.frames = frames;
    this.domElements = domElements;
    if (options !== undefined) {
      merge(this.options, options);
    }
  }
}
