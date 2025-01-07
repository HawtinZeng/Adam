import { useAtomValue } from "jotai";
import React, { useEffect, useRef } from "react";
import { ScreenShotter } from "src/screenShot/screenShotter";
import { canvasAtom } from "src/state/uiState";

export function ScreenShotPanel() {
  const screenShotter = useRef<ScreenShotter>(new ScreenShotter());
  const drawCanvas = useAtomValue(canvasAtom)!;

  const execut2 = useRef<number>(1);
  useEffect(() => {
    if (execut2.current === 2)
      screenShotter.current.startScreenShot(drawCanvas);
    return () => {
      if (execut2.current === 2) screenShotter.current.terminateScreenShot();
      execut2.current++;
    };
  }, []);

  return <div>ScreenShotPanel</div>;
}
