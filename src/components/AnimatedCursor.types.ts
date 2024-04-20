import { PrimitiveAtom } from "jotai";
import { CSSProperties, ReactNode } from "react";

export interface AnimatedCursorOptions {
  children?: ReactNode;
  color?: string;
  innerScale?: number;
  innerSize?: number;
  innerStyle?: CSSProperties;
  outerAlpha?: number;
  outerScale?: number;
  outerSize?: number;
  outerStyle?: CSSProperties;
  initialXCoord?: number;
  initialYCoord?: number;
}

export type Clickable = string | ({ target: string } & AnimatedCursorOptions);

export interface AnimatedCursorProps extends AnimatedCursorOptions {
  clickables?: Clickable[];
  showSystemCursor?: boolean;
  trailingSpeed?: number;
  controledAtom: PrimitiveAtom<number>;
  type: "circle" | "cross" | "pointer";
}

export interface AnimatedCursorCoordinates {
  x: number;
  y: number;
}
