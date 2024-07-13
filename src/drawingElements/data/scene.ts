import { merge } from "lodash";
import { Transform2DOperator } from "src/CoreRenderer/DrawCanvas/Transform2DOperator";
import {
  DomElement,
  DrawingElement,
  FrameData,
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
  handleOperator?: Transform2DOperator;
};
export class Scene {
  elements: DrawingElement[] = [];
  frames: FrameData[] = [];
  options: SceneOptions = { scale: 1 };
  updatingElements: UpdatingElement[] = [];
  domElements: DomElement[];
  windowId: number = 0;
  windowScrollSpeed: number = 0;
  firstShowWindowScreenShot: ImageBitmap | undefined;

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
