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
  selectedKeyAtom,
  selectedKeyAtomSubMenu,
} from "src/state/uiState";
import { menuConfigs, penConfigs } from "src/mainMenu";
import { sceneAtom } from "src/state/sceneState";
import {
  FreeDrawing,
  newFreeDrawingElement,
} from "src/coreRenderer/drawingElementsTypes";
import { cloneDeep, merge } from "lodash";
import { nanoid } from "nanoid";
import { DrawingElement } from "src/coreRenderer/basicTypes";
import { dist2, len2 } from "src/coreRenderer/drawCanvas/vec";

export const penPanelStyles = stylex.create({
  horizontalPanel: {
    flexDirection: "row",
  },
  corner: {
    borderRadius: "5px",
  },
});

export function PenPanel(props: { btnConfigs: BtnConfigs }) {
  // 全局状态
  const [selectedKey, setSelectedKey] = useAtom(selectedKeyAtomSubMenu);
  const [cvsEle] = useAtom(canvasAtom);
  const [sceneState, setSceneAtom] = useAtom(sceneAtom);
  const intervalTimers = useRef<Array<NodeJS.Timeout>>([]);

  const [menuKey] = useAtom(selectedKeyAtom);
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
  const penPanelMousedown = useCallback(
    (evt: MouseEvent) => {
      const newFreeElement = merge(cloneDeep(newFreeDrawingElement), {
        id: nanoid(),
        position: { x: 0, y: 0 },
        points: [{ x: evt.clientX, y: evt.clientY }],
      } as FreeDrawing);

      const subMenuStrokeOption =
        menuConfigs[menuKey]?.btnConfigs?.[selectedKey]?.strokeOptions;
      newFreeElement.strokeOptions = cloneDeep(subMenuStrokeOption);
      // trigger DrawCanvas re-render
      sceneState.elements.push(newFreeElement);
      sceneState.updatingElements.push(newFreeElement);

      if ((newFreeElement as FreeDrawing).strokeOptions?.needFadeOut) {
        intervalTimers.current.push(
          fadeoutInterval(sceneState.elements.length - 1)
        );
      }
      setSceneAtom({ ...sceneState });
    },
    [selectedKey]
  );

  useEffect(() => {
    intervalTimers.current.forEach((intervalId) => {
      clearInterval(intervalId);
    });
    // console.log("clearInterval");
    intervalTimers.current.length = 0;
    sceneState.elements = sceneState.elements.filter(
      (val) => !(val as FreeDrawing).strokeOptions?.needFadeOut
    );
    setSceneAtom({ ...sceneState });
  }, [menuKey, selectedKey]);

  const fadeoutInterval = (currentEleIdx) => {
    const elePoints = sceneState.elements[currentEleIdx]?.points;
    const intervalTimer = setInterval(() => {
      if (elePoints === undefined || elePoints.length === 0) {
        clearInterval(intervalTimer);
        return;
      }

      let distance = 0,
        cutPointIdx = 0;
      while (distance < 1500 && cutPointIdx + 1 < elePoints.length) {
        distance += dist2(
          [elePoints[cutPointIdx].x, elePoints[cutPointIdx].y],
          [elePoints[cutPointIdx + 1].x, elePoints[cutPointIdx + 1].y]
        );
        cutPointIdx++;
      }
      if (cutPointIdx + 1 >= elePoints.length) elePoints.length = 0;
      else elePoints.splice(0, cutPointIdx);
      setSceneAtom({ ...sceneState });
      sceneState.elements[currentEleIdx].opacity *= 0.9;
    }, 200);

    return intervalTimer;
  };

  const penPanelMousemove = (evt: MouseEvent) => {
    if (sceneState.updatingElements[0]) {
      sceneState.updatingElements[0].points.push({
        x: evt.clientX,
        y: evt.clientY,
      });
      setSceneAtom({ ...sceneState });
    }
  };

  const stopCurrentDrawing = (evt: MouseEvent) => {
    if (sceneState.updatingElements.length > 0) {
      sceneState.updatingElements.length = 0;
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
