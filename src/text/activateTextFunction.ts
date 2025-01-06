import { useAtom, useAtomValue } from "jotai";
import { useEffect, useRef } from "react";
import { getBoundryPoly } from "src/CoreRenderer/boundary";
import { onlyRedrawOneElement } from "src/CoreRenderer/DrawCanvas/core";
import { colorConfigs } from "src/MainMenu";
import { sceneAtom } from "src/state/sceneState";
import {
  canvasAtom,
  canvasEventTriggerAtom,
  colorAtom,
  customColor,
  fontSizeAtom,
} from "src/state/uiState";
import { Text } from "src/text/text";
export const useTextFunction = (): {
  startText: (c: number) => void;
  terminateText: () => void;
} => {
  const currentText = useRef<Text | null>(null);
  const [colorIdx] = useAtom(colorAtom);
  const [size] = useAtom(fontSizeAtom);

  const color = useAtomValue(customColor);
  const canvasWrapper = useAtomValue(canvasEventTriggerAtom);

  const [s, ss] = useAtom(sceneAtom);
  const [cvsEle] = useAtom(canvasAtom);

  useEffect(() => {
    if (currentText.current) {
      currentText.current.clearCursor();
      currentText.current!.refreshScene({ size });
    }
  }, [size]);

  const mouseMoveHandler = (e: MouseEvent) => {
    if (!currentText.current) return;
    const newPos = { x: e.clientX, y: e.clientY };
    currentText.current.refreshScene({ position: newPos });
  };

  const mouseLeftDownHandler = (e: MouseEvent) => {
    if (e.button !== 0) return;

    if (currentText.current && currentText.current.content !== "") {
      s.elements.push(currentText.current);
      currentText.current!.boundary = [getBoundryPoly(currentText.current)!];
      currentText.current.rotateOrigin =
        currentText.current.boundary[0].box.center;

      ss({ ...s });
      const patchColor = currentText.current.color;
      const patchSize = currentText.current.fontSize;
      terminateTextFunnction();
      startTextFunction();
      // after restart Text function, cannot get the newest atom value...

      currentText.current.color = patchColor;

      currentText.current.refreshScene({
        size: Number(patchSize.slice(0, -2)),
      });
    }
  };

  const startTextFunction = () => {
    window.ipcRenderer.send("focusAdamWindow");
    try {
      currentText.current = new Text(
        "",
        "黑体",
        colorIdx !== -1 ? colorConfigs[colorIdx].key : color,
        size
      );
    } catch (e) {
      // console.log(e);
    }

    if (!!cvsEle) {
      currentText.current!.oriImageData = cvsEle
        .getContext("2d", { willReadFrequently: true })!
        .getImageData(0, 0, cvsEle!.width, cvsEle!.height);
      currentText.current!.createTextCanvas(cvsEle!);
      onlyRedrawOneElement(
        currentText.current!,
        currentText.current!.oriImageData!
      );
      canvasWrapper!.addEventListener("mousedown", (e) =>
        mouseLeftDownHandler(e)
      );
      canvasWrapper!.addEventListener("mousemove", mouseMoveHandler);
    }
  };

  useEffect(() => {
    if (!currentText.current) return;
    currentText.current.color =
      colorIdx !== -1 ? colorConfigs[colorIdx].key : color;
  }, [colorIdx, color]);

  const terminateTextFunnction = () => {
    if (!currentText.current) return;
    currentText.current.removeInputElement();
    currentText.current.cursorAnimation.terminate();

    currentText.current = null;
    window.removeEventListener("mousemove", mouseMoveHandler);
  };

  return {
    startText: startTextFunction,
    terminateText: terminateTextFunnction,
  };
};
