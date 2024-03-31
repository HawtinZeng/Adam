import { atom, useAtom } from "jotai";
import { atomEffect } from "jotai-effect";
import { menuConfigs } from "src/mainMenu";
import { sceneAtom } from "src/state/sceneState";
export const selectedKeyAtom = atom(-1);
export const selectedKeyAtomSueMenu = atom(0);

export const selectedKeyEffectAtom = atomEffect((get, set) => {
  // runs on mount or whenever someAtom changes
  // const value = get(selectedKeyAtom);
});

export const selectedKeyEffectAtomSubMenu = atomEffect((get, set) => {
  // runs on mount or whenever someAtom changes
  const value = get(selectedKeyAtomSueMenu);
});
export const canvasAtom = atom<HTMLCanvasElement | null>(null);
