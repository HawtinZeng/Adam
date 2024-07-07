import { atom } from "jotai";
import { Scene } from "src/drawingElements/data/scene";
export const sceneAtom = atom<Scene>(new Scene([], [], []));
