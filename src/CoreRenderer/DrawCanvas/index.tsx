import React, { useEffect, useRef } from "react";
import stylex from "@stylexjs/stylex";
import { renderDrawCanvas } from "src/coreRenderer/drawCanvas/core";
import { Scene } from "src/drawingElements/data/scene";
import { ControllersManager } from "src/drawingElements/controllers/controllersManager";
const staticCvsSte = stylex.create({
  container: {
    width: "100%",
    height: "100%",
    backgroundColor: "green",
  },
});

const isExcuted = false;
export function DrawCanvas(props: { sceneData: Scene }) {
  const sceneData = props.sceneData;
  const cvsRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!isExcuted) {
      ControllersManager.singleInstance = new ControllersManager(
        cvsRef.current!
      );
    }

    cvsRef.current!.height = cvsRef.current!.offsetHeight;
    cvsRef.current!.width = cvsRef.current!.offsetWidth;
    renderDrawCanvas(sceneData, cvsRef.current!);
  });
  return <canvas ref={cvsRef} {...stylex.props(staticCvsSte.container)} />;
}
