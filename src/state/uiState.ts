import { atom } from "jotai";
import { DomElement } from "src/CoreRenderer/basicTypes";
export const selectedKeyAtom = atom(-1);
export const subMenuIdx = atom(0);

export const canvasAtom = atom<HTMLCanvasElement | null>(null);
export const dyCanvasAtom = atom<HTMLCanvasElement | null>(null);
export const canvasEventTriggerAtom = atom<HTMLDivElement | null>(null);

export const brushRadius = atom<number>(10);
export const eraserRadius = atom<number>(10);

export const colorAtom = atom<number>(0);
export const noteColorAtom = atom<number>(0);

export const customColor = atom<string>("");

export const simulatePressureSize = atom<number>(0);

// export const mousePosition = atom<Point>({ x: 0, y: 0 });

export const hoveringDomsAtom = atom<DomElement | null>(null);

export const disableDrawingAtom = atom<boolean>(false);

export const cursorSvgAtom = atom<string | null>(null);
