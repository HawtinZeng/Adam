import { merge } from "lodash";
import {
  DrawingElement,
  FrameData,
  SceneOptions,
} from "src/CoreRenderer/basicTypes";
export class Scene {
  elements: DrawingElement[] = [];
  frames: FrameData[] = [];
  options: SceneOptions = { scale: 1 };
  updatingElements: DrawingElement[] = [];
  constructor(
    elements: DrawingElement[],
    frames: FrameData[],
    options?: SceneOptions
  ) {
    this.elements = elements;
    this.frames = frames;
    if (options !== undefined) {
      merge(this.options, options);
    }
  }
}
