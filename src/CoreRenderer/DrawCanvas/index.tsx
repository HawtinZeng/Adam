// @ts-nocheck
import stylex from "@stylexjs/stylex";
import { useAtom, useSetAtom } from "jotai";
import React, { useEffect, useRef } from "react";
import { throttledRenderDC } from "src/CoreRenderer/DrawCanvas/core";
import { sceneAtom } from "src/state/sceneState";
import { canvasAtom } from "src/state/uiState";

const staticCvsSte = stylex.create({
  container: {
    width: "100%",
    height: "100%",
    position: "fixed",
    top: "0",
  },
});

export function DrawCanvas() {
  const innerCvsRef = useRef<HTMLCanvasElement>(null);
  const setCvsAtom = useSetAtom(canvasAtom);
  const [sceneData] = useAtom(sceneAtom);
  useEffect(() => {
    innerCvsRef.current!.height = innerCvsRef.current!.offsetHeight;
    innerCvsRef.current!.width = innerCvsRef.current!.offsetWidth;
  }, []);

  // initialize canvas
  useEffect(() => {
    setCvsAtom(innerCvsRef.current);
    throttledRenderDC(sceneData, innerCvsRef.current!);
  }, [sceneData, setCvsAtom]);

  return (
    <>
      <canvas
        id="drawingCvs"
        ref={innerCvsRef}
        {...stylex.props(staticCvsSte.container)}
      />
    </>
  );
}
