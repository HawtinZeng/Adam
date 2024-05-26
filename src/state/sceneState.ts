import { atom } from "jotai";
import { cloneDeep } from "lodash";
import { Scene } from "src/drawingElements/data/scene";
import { defaultSceneData } from "src/test/someDrawingData";
const clonedDefaultSceneData = cloneDeep(defaultSceneData);
export const sceneAtom = atom(
  new Scene(clonedDefaultSceneData.elements, [], clonedDefaultSceneData.frames)
);
