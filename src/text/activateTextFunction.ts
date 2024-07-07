import { useAtom, useAtomValue } from "jotai";
import { useEffect, useRef } from "react";
import { onlyRedrawOneElement } from "src/CoreRenderer/DrawCanvas/core";
import { colorConfigs } from "src/MainMenu";
import { sceneAtom } from "src/state/sceneState";
import {
  canvasAtom,
  canvasEventTriggerAtom,
  colorAtom,
  cursorSvgAtom,
  customColor,
} from "src/state/uiState";
import { Text } from "src/text/text";
export const useTextFunction = (): {
  startText: () => void;
  terminateText: () => void;
} => {
  const currentText = useRef<Text | null>(null);

  const colorIdx = useAtomValue(colorAtom);
  const color = useAtomValue(customColor);

  const canvasWrapper = useAtomValue(canvasEventTriggerAtom);

  const [s, ss] = useAtom(sceneAtom);
  const [cvsEle] = useAtom(canvasAtom);
  const [, setCursor] = useAtom(cursorSvgAtom);
  const mouseMoveHandler = (e: MouseEvent) => {
    if (!currentText.current) return;

    canvasWrapper!.style.cursor = "none";
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
      terminateTextFunnction();

      startTextFunction();
    }
  };

  const startTextFunction = () => {
    currentText.current = new Text(
      "",
      "黑体",
      colorIdx !== -1 ? colorConfigs[colorIdx].key : color
    );
    currentText.current.oriImageData = cvsEle!
      .getContext("2d", { willReadFrequently: true })!
      .getImageData(0, 0, cvsEle!.width, cvsEle!.height);

    setCursor("none");
    currentText.current.createTextCanvas(cvsEle!);
    onlyRedrawOneElement(
      currentText.current,
      currentText.current.oriImageData!
    );
    canvasWrapper!.addEventListener("mousedown", (e) =>
      mouseLeftDownHandler(e)
    );
    canvasWrapper!.addEventListener("mousemove", mouseMoveHandler);
    canvasWrapper!.style.cursor = "none";
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
