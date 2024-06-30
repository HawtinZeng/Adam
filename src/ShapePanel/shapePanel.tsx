import { useAtom, useAtomValue } from "jotai";
import { useCallback, useEffect, useRef } from "react";
import {
  DrawingType,
  newArrowShapeElement,
} from "src/CoreRenderer/drawingElementsTypes";
import { BtnConfigs } from "src/MainMenu/Menu";
import { cloneDeepGenId } from "src/common/utils";
import { Btn } from "src/components/Btn";
import { UpdatingElement } from "src/drawingElements/data/scene";
import { sceneAtom } from "src/state/sceneState";
import {
  canvasAtom,
  canvasEventTriggerAtom,
  subMenuIdx,
} from "src/state/uiState";

export function ShapePanel(props: { btnConfigs: BtnConfigs }) {
  const { btnConfigs } = props;

  const [selectedKey, setSelectedKey] = useAtom(subMenuIdx);
  const mouseDownCount = useRef<number>(0);
  const [s, ss] = useAtom(sceneAtom);
  const [cvsEle] = useAtom(canvasAtom);

  const cvsTrigger = useAtomValue(canvasEventTriggerAtom);

  const mouseClick = useCallback(
    (e: MouseEvent) => {
      const currentShape = btnConfigs[selectedKey].key;
      mouseDownCount.current++;
      if (currentShape === DrawingType.arrow) {
        if (mouseDownCount.current === 1) {
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
        } else if (mouseDownCount.current === 2) {
          const a = s.updatingElements[0].ele;
          s.elements.push(a);
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
    if (!cvsEle) return;
    cvsEle!.addEventListener("mousedown", mouseClick);
    cvsEle!.addEventListener("mousedown", mouseMove);
    cvsEle!.addEventListener("mousemove", () =>
      console.log("mouse move event triggered...")
    );
    return () => {
      cvsEle!.removeEventListener("mousedown", mouseClick);
      cvsEle!.removeEventListener("mousemove", mouseMove);
    };
  }, [cvsEle, mouseClick, mouseMove]);

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
