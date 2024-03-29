import React, { useEffect, useRef } from "react";
import { renderDrawCanvas } from "./core"
import {  } from "@components/btn.tsx"
import stylex from "@stylexjs/stylex"
const staticCvsSte = stylex.create({
  container: {
    width: "100%",
    height: "100%",
    backgroundColor: "green",
  }
})
export function DrawCanvas(sceneData: SceneData) {
  const cvsRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cvs = cvsRef.current!;
    const ctx = cvs.getContext('2d')!;
    renderDrawCanvas(sceneData, ctx)
  });
  return <canvas ref={cvsRef} {...stylex.props(staticCvsSte.container)} />
}