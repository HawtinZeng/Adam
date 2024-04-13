import { useCallback, useEffect } from "react";
import { BtnConfigs } from "../mainMenu/menu";
import stylex from "@stylexjs/stylex";
import { Btn } from "../components/Btn";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  brushRadius,
  canvasAtom,
  colorAtom,
  customColor,
  selectedKeyAtom,
  selectedKeyAtomSubMenu,
} from "src/state/uiState";
import { colorConfigs, menuConfigs } from "src/mainMenu";
import { sceneAtom } from "src/state/sceneState";
import {
  FreeDrawing,
  newFreeDrawingElement,
} from "src/coreRenderer/drawingElementsTypes";
import { cloneDeep, merge } from "lodash";
import { nanoid } from "nanoid";
import { dist2 } from "src/coreRenderer/drawCanvas/vec";
import { useAtomCallback } from "jotai/utils";

export const penPanelStyles = stylex.create({
  horizontalPanel: {
    flexDirection: "row",
  },
  corner: {
    borderRadius: "5px",
  },
});

export function PenPanel(props: { btnConfigs: BtnConfigs }) {
  const { btnConfigs } = props;
  // 全局状态
  const [selectedKey, setSelectedKey] = useAtom(selectedKeyAtomSubMenu);
  const [cvsEle] = useAtom(canvasAtom);
  const [sceneState, setSceneAtom] = useAtom(sceneAtom);

  // useAtomCallback to retrive new atom value, but don't trigger re-excution of component function.
  const size = useAtomValue(brushRadius);
  console.log("size change...");
  const color = useAtomValue(customColor);
  const colorIdx = useAtomValue(colorAtom);

  const [menuKey] = useAtom(selectedKeyAtom);

  const penPanelMousedown = useCallback(
    (evt: MouseEvent) => {
      const newFreeElement = merge(cloneDeep(newFreeDrawingElement), {
        id: nanoid(),
        position: { x: 0, y: 0 },
        points: [{ x: evt.clientX, y: evt.clientY }],
      } as FreeDrawing);
      // default property
      const subMenuStrokeOption =
        menuConfigs[menuKey]?.btnConfigs?.[selectedKey]?.strokeOptions;
      newFreeElement.strokeOptions = cloneDeep(subMenuStrokeOption!);
      // updated property, size是ui控件的直径
      newFreeElement.strokeOptions.size = size / 4;
      newFreeElement.strokeOptions.strokeColor =
        colorIdx !== -1 ? colorConfigs[colorIdx].key : color;
      // trigger DrawCanvas re-render
      sceneState.elements.push(newFreeElement);
      sceneState.updatingElements.push(newFreeElement);
      if ((newFreeElement as FreeDrawing).strokeOptions?.needFadeOut) {
        fadeoutInterval(sceneState.elements.length - 1);
      }
    },
    [selectedKey, colorIdx, color, size]
  );

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
  }, [penPanelMousedown]); // [] 可用于仅执行一次逻辑, penPanelMousedown连续触发使用最新的值

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
    btnConfigs,
    undefined,
    undefined,
    undefined,
    "horizontal",
    true
  );
}
