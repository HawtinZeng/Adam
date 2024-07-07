import { useAtom } from "jotai";
import { useRef } from "react";
import { onlyRedrawOneElement } from "src/CoreRenderer/DrawCanvas/core";
import { sceneAtom } from "src/state/sceneState";
import { canvasAtom, cursorSvgAtom } from "src/state/uiState";
import { Text } from "src/text/text";
export const useTextFunction = (): {
  startText: () => void;
  terminateText: () => void;
} => {
  const currentText = useRef<Text | null>(null);

  const [s, ss] = useAtom(sceneAtom);
  const [cvsEle] = useAtom(canvasAtom);
  const [, setCursor] = useAtom(cursorSvgAtom);
  const mouseMoveHandler = (e: MouseEvent) => {
    if (!currentText.current) return;
    const newPos = { x: e.clientX, y: e.clientY };
    currentText.current.refreshScene({ position: newPos });
  };

  /**
   * @param e     
   * mouseEvent map:
   * case 0:
      log.textContent = "Left button clicked.";
      break;
    case 1:
      log.textContent = "Middle button clicked.";
      break;
    case 2:
      log.textContent = "Right button clicked.";
      break;
    default:
      log.textContent = `Unknown button code: ${e.button}`;
   */
  const mouseLeftDownHandler = (e: MouseEvent) => {
    if (e.button !== 0) return;
    if (currentText.current && currentText.current.content !== "") {
      s.elements.push(currentText.current);
      ss({ ...s });
      startTextFunction();
    }
  };

  const startTextFunction = () => {
    currentText.current = new Text("", "黑体", "#000000");
    currentText.current.oriImageData = cvsEle!
      .getContext("2d", { willReadFrequently: true })!
      .getImageData(0, 0, cvsEle!.width, cvsEle!.height);

    setCursor("crosshair");
    currentText.current.createTextCanvas(cvsEle!);
    onlyRedrawOneElement(
      currentText.current,
      currentText.current.oriImageData!
    );

    window.addEventListener("mousemove", mouseMoveHandler);
    window.addEventListener("mousedown", mouseLeftDownHandler);
  };

  const terminateTextFunnction = () => {
    currentText.current = null;
    window.removeEventListener("mousemove", mouseMoveHandler);
  };

  return {
    startText: startTextFunction,
    terminateText: terminateTextFunnction,
  };
};
