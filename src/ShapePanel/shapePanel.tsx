import { useAtom, useAtomValue } from "jotai";
import { useCallback, useEffect } from "react";
import { restoreOriginalmage } from "src/CoreRenderer/DrawCanvas/core";
import {
  DrawingType,
  newArrowShapeElement,
} from "src/CoreRenderer/drawingElementsTypes";
import { BtnConfigs } from "src/MainMenu/Menu";
import { cloneDeepGenId } from "src/common/utils";
import { Btn } from "src/components/Btn";
import { UpdatingElement } from "src/drawingElements/data/scene";
import { useKeyboard } from "src/hooks/keyboardHooks";
import { sceneAtom } from "src/state/sceneState";
import {
  canvasAtom,
  canvasEventTriggerAtom,
  subMenuIdx,
} from "src/state/uiState";

export function ShapePanel(props: { btnConfigs: BtnConfigs }) {
  const { btnConfigs } = props;

  const [selectedKey, setSelectedKey] = useAtom(subMenuIdx);
  const [s, ss] = useAtom(sceneAtom);
  const [cvsEle] = useAtom(canvasAtom);

  const cvsTrigger = useAtomValue(canvasEventTriggerAtom);
  const [_, lastKey] = useKeyboard();

  const mouseClick = useCallback(
    (e: MouseEvent) => {
      const currentShape = btnConfigs[selectedKey].key;
      if (currentShape === DrawingType.arrow) {
        if (s.updatingElements.length === 0) {
          const newArrow = cloneDeepGenId(newArrowShapeElement);
          newArrow.points.push({ x: e.clientX, y: e.clientY });

          const newEleUpdating: UpdatingElement = {
            ele: newArrow,
            type: "addPoints",
            oriImageData: cvsEle!
              .getContext("2d", { willReadFrequently: true })!
              .getImageData(0, 0, cvsEle!.width, cvsEle!.height),
          };
          s.updatingElements.push(newEleUpdating);
          ss({ ...s });
        } else if (
          s.updatingElements.length === 1 &&
          s.updatingElements[0].ele.points.length === 2
        ) {
          const a = s.updatingElements[0].ele;
          s.elements.push(a);

          s.updatingElements.length = 0;

          ss({ ...s });
        }
      }
    },
    [btnConfigs, cvsEle, s, selectedKey, ss]
  );

  const mouseMove = useCallback(
    (e: MouseEvent) => {
      if (s.updatingElements.length > 0) {
        const creatingShape = s.updatingElements[0].ele;
        creatingShape.points[1] = { x: e.clientX, y: e.clientY };
        ss({ ...s });
      }
    },
    [s, ss]
  );
  useEffect(() => {
    if (lastKey === "Escape" && s.updatingElements.length > 0) {
      restoreOriginalmage(s.updatingElements[0]);
      s.updatingElements.length = 0;
    }
  }, [lastKey, s.updatingElements]);

  useEffect(() => {
    if (!cvsTrigger) return;
    cvsTrigger!.addEventListener("mousedown", mouseClick);
    cvsTrigger!.addEventListener("mousemove", mouseMove);
    return () => {
      cvsTrigger!.removeEventListener("mousedown", mouseClick);
      cvsTrigger!.removeEventListener("mousemove", mouseMove);
    };
  }, [cvsTrigger, mouseClick, mouseMove]);

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
