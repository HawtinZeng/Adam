import React, { useCallback, useEffect, useRef, useState } from "react";
import Draggable from "react-draggable";
import { setTransparent, unsetTransparent } from "../commonUtils";
import { BtnConfigs } from "../mainMenu/menu";
import stylex from "@stylexjs/stylex";
import { Btn } from "../components/Btn";
import pen from "../images/svgs/pen.svg";
import highlighterPen from "../images/svgs/highlighterPen.svg";
import brush from "../images/svgs/brush.svg";
import laser from "../images/svgs/laser.svg";
import { useAtom } from "jotai";
import {
  canvasAtom,
  selectedKeyAtomSueMenu,
  selectedKeyEffectAtomSubMenu,
} from "src/state/uiState";
import { menuConfigs, penConfigs } from "src/mainMenu";
import { sceneAtom } from "src/state/sceneState";
import {
  FreeDrawing,
  newFreeDrawingElement,
} from "src/coreRenderer/drawingElementsTypes";
import { cloneDeep, merge } from "lodash";
import { nanoid } from "nanoid";

export const penPanelStyles = stylex.create({
  horizontalPanel: {
    flexDirection: "row",
  },
  corner: {
    borderRadius: "5px",
  },
});
export function PenPanel(props: { btnConfigs: BtnConfigs }) {
  // 当前正在新增的对象
  const [drawingElement, setDrawingElement] = useState<FreeDrawing | null>(
    null
  );
  // 全局状态
  const [selectedKey, setSelectedKey] = useAtom(selectedKeyAtomSueMenu);
  const [cvsEle] = useAtom(canvasAtom);
  const [sceneState, setSceneAtom] = useAtom(sceneAtom);

  useEffect(() => {
    cvsEle?.addEventListener("mousedown", penPanelMousedown);
    cvsEle?.addEventListener("mousemove", penPanelMousemove);
    cvsEle?.addEventListener("mouseup", stopCurrentDrawing);
    cvsEle?.addEventListener("mouseleave", stopCurrentDrawing);
    return () => {
      cvsEle?.removeEventListener("mousedown", penPanelMousedown);
      cvsEle?.removeEventListener("mousemove", penPanelMousemove);
      cvsEle?.removeEventListener("mouseup", stopCurrentDrawing);
      cvsEle?.removeEventListener("mouseleave", stopCurrentDrawing);
    };
  });
  const penPanelMousedown = useCallback((evt: MouseEvent) => {
    const newFreeElement = merge(cloneDeep(newFreeDrawingElement), {
      id: nanoid(),
      position: { x: 0, y: 0 },
      points: [{ x: evt.clientX, y: evt.clientY }],
    } as FreeDrawing);
    setDrawingElement(newFreeElement);
    // trigger DrawCanvas re-render
    sceneState.elements.push(newFreeElement);
    setSceneAtom({ ...sceneState });
  }, []);

  const penPanelMousemove = (evt: MouseEvent) => {
    if (drawingElement) {
      drawingElement.points.push({ x: evt.clientX, y: evt.clientY });
      setSceneAtom({ ...sceneState });
    }
  };

  const stopCurrentDrawing = (evt: MouseEvent) => {
    if (drawingElement) {
      setDrawingElement(null);
    }
  };

  return Btn(
    setSelectedKey,
    selectedKey,
    props.btnConfigs,
    undefined,
    undefined,
    undefined,
    "horizontal",
    true
  );
}
