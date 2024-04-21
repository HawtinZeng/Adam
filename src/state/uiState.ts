import { atom } from "jotai";
import { atomEffect } from "jotai-effect";
import { setTransparentOption, unsetTransparent } from "src/commonUtils";
export const selectedKeyAtom = atom(-1);
export const selectedKeyAtomSubMenu = atom(0);

export const selectedSubEffectAtom = atomEffect((get, set) => {
  // runs on mount or whenever someAtom changes
  const value = get(selectedKeyAtom);
  if (value !== -1) {
    setTransparentOption.enabled = false;
    unsetTransparent();
  } else {
    setTransparentOption.enabled = true;
  }
});

export const canvasAtom = atom<HTMLCanvasElement | null>(null);

export const brushRadius = atom<number>(10);
export const eraserRadius = atom<number>(10);

export const colorAtom = atom<number>(0);

export const customColor = atom<string>("");

export const simulatePressureSize = atom<number>(0);
