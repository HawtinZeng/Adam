import { useAtom, useAtomValue } from "jotai";
import React, { useEffect, useRef } from "react";
import { DrawingElement } from "src/CoreRenderer/basicTypes";
import { ScreenShotter } from "src/screenShot/screenShotter";
import { sceneAtom } from "src/state/sceneState";
import { canvasAtom } from "src/state/uiState";
export function ScreenShotPanel() {
  const [s, ss] = useAtom(sceneAtom);
  const screenShotter = useRef<ScreenShotter>(new ScreenShotter(s));
  const drawCanvas = useAtomValue(canvasAtom)!;

  const execut2 = useRef<number>(1);
  useEffect(() => {
    if (execut2.current === 2) {
      console.log(screenShotter.current);
      screenShotter.current.startScreenShot(drawCanvas);
      const shot = screenShotter.current.shot!;

      // drawingCanvasCache.ele2DrawingCanvas.set(shot, shot.screen);
      s.elements.push(shot as any as DrawingElement);
      ss({ ...s });
    }

    return () => {
      if (execut2.current === 2) screenShotter.current.terminate();
      execut2.current++;
    };
  }, []);

  function mousemove(e: MouseEvent) {
    screenShotter.current!.transform(e);
  }

  function mousedown(e: MouseEvent) {
    screenShotter.current!.addPoint(e);
  }

  useEffect(() => {
    drawCanvas.addEventListener("mousemove", mousemove);
    drawCanvas.addEventListener("mousedown", mousedown);
    return () => {
      drawCanvas.removeEventListener("mousemove", mousemove);
      drawCanvas.removeEventListener("mousedown", mousedown);
    };
  }, []);

  return <div>ScreenShotPanel</div>;
}
