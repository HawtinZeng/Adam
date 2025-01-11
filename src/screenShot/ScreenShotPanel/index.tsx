import { useAtom, useAtomValue } from "jotai";
import React, { useEffect, useRef } from "react";
import { DrawingElement } from "src/CoreRenderer/basicTypes";
import { UpdatingElement } from "src/drawingElements/data/scene";
import { ScreenShotter } from "src/screenShot/screenShotter";
import { sceneAtom } from "src/state/sceneState";
import { canvasAtom, selectedKeyAtom } from "src/state/uiState";
export function ScreenShotPanel() {
  const [s, ss] = useAtom(sceneAtom);
  const [selected, setSeletedKey] = useAtom(selectedKeyAtom);

  const screenShotter = useRef<ScreenShotter>(new ScreenShotter(s));
  const drawCanvas = useAtomValue(canvasAtom)!;

  /**
  useEffect(() => {
    const ele = sceneData.updatingElements[0]?.ele;
    if (ele && ele.type === DrawingType.shot) {
      const shot = ele as any as Shot;
      if (!shot.pined) {
        const idx = sceneData.elements.findIndex(
          (i) => i === sceneData.updatingElements[0]?.ele
        );

        if (idx !== -1) {
          sceneData.elements.splice(idx, 1);
        }
      }
    }
  }, [sceneData]);
   */
  const execut2 = useRef<number>(1);
  useEffect(() => {
    if (execut2.current === 2) {
      const wrapper = async () => {
        await screenShotter.current.startScreenShot(drawCanvas);
        const shot = screenShotter.current.shot!;

        s.elements.push(shot as any as DrawingElement);

        const updating: UpdatingElement = {
          type: "transform",
          ele: shot,
        };
        s.updatingElements[0] = updating;
        ss({ ...s });
      };
      wrapper();
    }

    return () => {
      if (execut2.current === 2) {
      }
      execut2.current++;
    };
  }, []);

  function mousemove(e: MouseEvent) {
    screenShotter.current!.transform(e);
  }

  function mousedown(e: MouseEvent) {
    screenShotter.current!.addPoint(e, s, ss, setSeletedKey);
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
