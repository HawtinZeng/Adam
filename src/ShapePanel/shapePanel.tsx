import { Point } from "@zenghawtin/graph2d";
import { useAtom, useAtomValue } from "jotai";
import { useCallback, useEffect } from "react";
import {
  onlyRedrawOneElement,
  restoreOriginalmage,
} from "src/CoreRenderer/DrawCanvas/core";
import {
  CircleShapeElement,
  DrawingType,
  RectangleShapeElement,
  Shape,
  newArrowShapeElement,
  newCircleShapeElement,
  newPolylineShapeElement,
  newRectangleShapeElement,
} from "src/CoreRenderer/drawingElementsTemplate";
import { colorConfigs } from "src/MainMenu";
import { BtnConfigs } from "src/MainMenu/Menu";
import { getBoundryPoly } from "src/MainMenu/imageInput";
import { cloneDeepGenId } from "src/common/utils";
import { Btn } from "src/components/Btn";
import { UpdatingElement } from "src/drawingElements/data/scene";
import { useKeyboard } from "src/hooks/keyboardHooks";
import { sceneAtom } from "src/state/sceneState";
import {
  brushRadius,
  canvasAtom,
  canvasEventTriggerAtom,
  colorAtom,
  customColor,
  subMenuIdx,
} from "src/state/uiState";

export function ShapePanel(props: { btnConfigs: BtnConfigs }) {
  const { btnConfigs } = props;

  const [selectedKey, setSelectedKey] = useAtom(subMenuIdx);
  const [s, ss] = useAtom(sceneAtom);
  const [cvsEle] = useAtom(canvasAtom);
  const colorIdx = useAtomValue(colorAtom);
  const color = useAtomValue(customColor);

  const strokeWidth = useAtomValue(brushRadius) / 5;

  const cvsTrigger = useAtomValue(canvasEventTriggerAtom);
  const [_, lastKey, clearLastKey] = useKeyboard();

  // 将newEle存入updatingElements中
  const createUpdatingElement = useCallback(
    (newEle: Shape) => {
      const newEleUpdating: UpdatingElement = {
        ele: newEle,
        type: "addPoints",
        oriImageData: cvsEle!
          .getContext("2d", { willReadFrequently: true })!
          .getImageData(0, 0, cvsEle!.width, cvsEle!.height),
      };
      s.updatingElements.push(newEleUpdating);

      newEle.strokeColor = colorIdx !== -1 ? colorConfigs[colorIdx].key : color;
      newEle.strokeWidth = strokeWidth;

      ss({ ...s });
    },
    [color, colorIdx, cvsEle, s, ss, strokeWidth]
  );
  // core
  const mouseClick = useCallback(
    (e: MouseEvent) => {
      const currentShape = btnConfigs[selectedKey]?.key;
      if (!currentShape) return;

      const newPt = { x: e.clientX, y: e.clientY };
      if (currentShape === DrawingType.arrow) {
        if (s.updatingElements.length === 0) {
          const newArrow = cloneDeepGenId(newArrowShapeElement);
          createUpdatingElement(newArrow);
        } else if (
          s.updatingElements.length === 1 &&
          s.updatingElements[0].ele.points.length === 2 // 结束arrow的绘制
        ) {
          const a = s.updatingElements[0].ele;
          s.elements.push(a);
          s.updatingElements.length = 0;

          ss({ ...s });
        }
      } else if (currentShape === DrawingType.polyline) {
        if (s.updatingElements.length === 0) {
          const newPolyline = cloneDeepGenId(newPolylineShapeElement);
          createUpdatingElement(newPolyline);
        } else {
          const a = s.updatingElements[0].ele;
          a.points.push(newPt);
          ss({ ...s });
        }
      } else if (currentShape === DrawingType.circle) {
        if (s.updatingElements.length === 0) {
          const circle = cloneDeepGenId(newCircleShapeElement);
          circle.points.push(newPt);
          createUpdatingElement(circle);
        } else {
          const a = s.updatingElements[0].ele;
          a.rotateOrigin = a.points[0];
          a.points.length = 0;

          a.boundary[0] = getBoundryPoly(a)!;
          s.elements.push(a);
          s.updatingElements.length = 0;
          ss({ ...s });
        }
      } else if (currentShape === DrawingType.rectangle) {
        if (s.updatingElements.length === 0) {
          const rectangle = cloneDeepGenId(newRectangleShapeElement);

          rectangle.position = newPt;

          createUpdatingElement(rectangle);
        } else {
          const rectangle = s.updatingElements[0].ele as RectangleShapeElement;
          rectangle.boundary[0] = getBoundryPoly(rectangle)!;
          rectangle.rotateOrigin = rectangle.boundary[0].box.center;
          s.elements.push(rectangle);
          s.updatingElements.length = 0;

          ss({ ...s });
        }
      }
    },
    [btnConfigs, createUpdatingElement, cvsEle, s, selectedKey, ss]
  );

  const mouseMove = useCallback(
    (e: MouseEvent) => {
      if (s.updatingElements.length > 0) {
        const newPoint = { x: e.clientX, y: e.clientY };
        const creatingShape = s.updatingElements[0].ele;

        if (creatingShape.points.length === 1) {
          creatingShape.points.push(newPoint);
        } else {
          creatingShape.points.splice(-1, 1, newPoint);
        }

        if (creatingShape.type === DrawingType.arrow) {
          creatingShape.points[1] = newPoint;
        } else if (creatingShape.type === DrawingType.polyline) {
          creatingShape.points.splice(-1, 1, newPoint);
        } else if (creatingShape.type === DrawingType.circle) {
          const circle = creatingShape as CircleShapeElement;
          const center = circle.points[0];
          circle.radius = new Point(newPoint.x, newPoint.y).distanceTo(
            new Point(center.x, center.y)
          )[0];
          circle.position = {
            x: center.x - circle.radius,
            y: center.y - circle.radius,
          };
          circle.width = circle.radius * 2;
          circle.height = circle.radius * 2;
        } else if (creatingShape.type === DrawingType.rectangle) {
          const rect = creatingShape as RectangleShapeElement;
          const leftTop = rect.position;
          rect.width = newPoint.x - leftTop.x;
          rect.height = newPoint.y - leftTop.y;
        }

        ss({ ...s });
      }
    },
    [s, ss]
  );

  useEffect(() => {
    if (lastKey === "Escape" && s.updatingElements.length > 0) {
      restoreOriginalmage(s.updatingElements[0]);
      s.updatingElements.length = 0;
    } else if (lastKey === " " && s.updatingElements.length > 0) {
      const a = s.updatingElements[0].ele;
      const u = s.updatingElements[0];

      a.points.splice(-1, 1);
      if (a.points.length >= 2) {
        s.elements.push(a);
      }
      onlyRedrawOneElement(a, u.oriImageData!);

      s.updatingElements.length = 0;
      setSelectedKey(-1);
    }
    clearLastKey();
  }, [clearLastKey, lastKey, s, setSelectedKey]);

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
