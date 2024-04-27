import { useAtomCallback } from "jotai/react/utils";
import React, { useCallback, useRef } from "react";
import { sceneAtom } from "src/state/sceneState";
export const useDrawingOperator = () => {
  let once = useRef(true);

  const sceneState = useAtomCallback(
    useCallback((get) => {
      const scene = get(sceneAtom);

      return scene;
    }, [])
  )();

  React.useEffect(() => {
    if (once.current) {
      document
        .getElementById("drawingCvs")!
        .addEventListener("mousedown", (e: MouseEvent) => {
          if (sceneState.updatingElements.length === 0) {
            sceneState.elements.forEach((ele) => {
              // const cvs = drawingCanvasCache.ele2DrawingCanvas.get(ele);
              // const ctx = cvs!.getContext("2d")!;
              // console.log(
              //   isPointInDrawingGraph(ele, ctx, { x: e.offsetX, y: e.offsetY })
              // );
            });
          }
        });
      once.current = false;
    }
  }, []);
};
