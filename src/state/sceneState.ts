import { atom } from "jotai";
import { Scene } from "src/drawingElements/data/scene";
export const multipleScenes = new Map<number, Scene>();
const defaultVal = new Scene([], [], []);
export const sceneAtom = atom<Scene>(defaultVal);
