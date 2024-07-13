import { atom } from "jotai";
import { Scene } from "src/drawingElements/data/scene";
export const multipleScenes = new Map<number, Scene>();

export const sceneAtom = atom<Scene>(new Scene([], [], []));
