import React, { useEffect, useRef } from "react";

import stylex from "@stylexjs/stylex";
import { useSetAtom } from "jotai";
import { bgCanvasAtom } from "src/state/uiState";
const dCvsSt = stylex.create({
  container: {
    width: "100%",
    position: "fixed",
    top: "0",
    height: "100%",
  },
});
export function BackgroundCanvas() {
  const setbgCanvasAtom = useSetAtom(bgCanvasAtom);
  const cvsRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setbgCanvasAtom(cvsRef.current);
    cvsRef.current!.height = cvsRef.current!.offsetHeight;
    cvsRef.current!.width = cvsRef.current!.offsetWidth;
  }, [setbgCanvasAtom]);
  return <canvas ref={cvsRef} {...stylex.props(dCvsSt.container)}></canvas>;
}
