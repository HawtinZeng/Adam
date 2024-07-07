import { useAtom } from "jotai";
import { useRef } from "react";
import { onlyRedrawOneElement } from "src/CoreRenderer/DrawCanvas/core";
import { canvasAtom } from "src/state/uiState";
import { Text } from "src/text/text";
export const useTextFunction = (): {
  startText: () => void;
  terminateText: () => void;
} => {
  const currentText = useRef<Text>(new Text("", "黑体", "#000000"));

  const [cvsEle] = useAtom(canvasAtom);
  const mouseMoveHandler = (e: MouseEvent) => {
    const newPos = { x: e.clientX, y: e.clientY };
    currentText.current.refreshScene({ position: newPos });
  };

  const startTextFunction = () => {
    currentText.current.oriImageData = cvsEle!
      .getContext("2d", { willReadFrequently: true })!
      .getImageData(0, 0, cvsEle!.width, cvsEle!.height);

    currentText.current.createTextCanvas(cvsEle!);
    onlyRedrawOneElement(
      currentText.current,
      currentText.current.oriImageData!
    );

    window.addEventListener("mousemove", mouseMoveHandler);
  };

  const terminateTextFunnction = () => {
    window.removeEventListener("mousemove", mouseMoveHandler);
  };

  return {
    startText: startTextFunction,
    terminateText: terminateTextFunnction,
  };
};
