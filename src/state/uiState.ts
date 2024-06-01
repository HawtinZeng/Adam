import { atom } from "jotai";
import { atomEffect } from "jotai-effect";
import { DomElement, Point } from "src/CoreRenderer/basicTypes";
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
export const dyCanvasAtom = atom<HTMLCanvasElement | null>(null);
export const canvasEventTriggerAtom = atom<HTMLDivElement | null>(null);

export const brushRadius = atom<number>(10);
export const eraserRadius = atom<number>(10);

export const colorAtom = atom<number>(0);
export const noteColorAtom = atom<number>(0);

export const customColor = atom<string>("");

export const simulatePressureSize = atom<number>(0);

export const mousePosition = atom<Point>({ x: 0, y: 0 });

export const hoveringDomsAtom = atom<DomElement | null>(null);

export const disableDrawingAtom = atom<boolean>(false);
