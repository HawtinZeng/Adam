import { atom } from "jotai";
import { Scene } from "src/drawingElements/data/scene";
import { Synchronizer } from "src/state/synchronizer";
export const multipleScenes = new Map<number, Scene>();
export const multipleSynchronizer = new Map<number, Synchronizer>();
const defaultVal = new Scene([], [], []);
export const sceneAtom = atom<Scene>(defaultVal);
