import React, { useEffect, useRef } from "react";

import stylex from "@stylexjs/stylex";
import { useSetAtom } from "jotai";
import { dyCanvasAtom } from "src/state/uiState";
const dCvsSt = stylex.create({
  container: {
    width: "100%",
    height: "100%",
    position: "fixed",
    top: "0",
  },
});
export function DynamicCanvas() {
  // console.log("re-render DynamicCanvas");

  const setDyCanvasAtom = useSetAtom(dyCanvasAtom);
  const cvsRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    setDyCanvasAtom(cvsRef.current);
    cvsRef.current!.height = cvsRef.current!.offsetHeight;
    cvsRef.current!.width = cvsRef.current!.offsetWidth;
  }, []);
  return <canvas ref={cvsRef} {...stylex.props(dCvsSt.container)}></canvas>;
}
