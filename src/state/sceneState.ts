import { atom } from "jotai";
import { Scene } from "src/drawingElements/data/scene";
import { defaultSceneData } from "src/test/someDrawingData";
export const sceneAtom = atom(
  new Scene(defaultSceneData.elements, defaultSceneData.frames)
);
