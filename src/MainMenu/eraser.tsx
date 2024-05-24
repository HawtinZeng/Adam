import Flatten, { Polygon } from "@flatten-js/core";
import { useAtom, useAtomValue } from "jotai";
import getStroke from "perfect-freehand";
import React, { useEffect, useRef } from "react";
import {
  removeBlankEle,
  throttledRenderDC,
} from "src/CoreRenderer/DrawCanvas/core";
import {
  DrawingElement,
  Point,
  isContained,
} from "src/CoreRenderer/basicTypes";
import { SizeSlider } from "src/SizeSlider";
import { UpdatingElement } from "src/drawingElements/data/scene";
import { sceneAtom } from "src/state/sceneState";
import {
  canvasAtom,
  canvasEventTriggerAtom,
  eraserRadius,
} from "src/state/uiState";

const defaultEraserStrokeOptions = {
  size: 20,
  thinning: 0,
  start: {
    cap: true,
  },
  end: {
    cap: true,
  },
  smoothing: 0.9,
  streamline: 0.9,
};
export function Eraser() {
  const eraserSize = useAtomValue<number>(eraserRadius);
  const eraserPts = useRef<Point[]>([]);
  const canvas = useAtomValue(canvasAtom);
  const [sceneState, setSceneAtom] = useAtom(sceneAtom);
  const mousePressed = useRef<boolean>(false);
  const cvsTrigger = useAtomValue(canvasEventTriggerAtom);

  useEffect(() => {
    throttledRenderDC(sceneState, canvas!);

    cvsTrigger?.addEventListener("mousedown", eraseStart);
    cvsTrigger?.addEventListener("mousemove", eraseMoving);
    cvsTrigger?.addEventListener("mouseup", eraseEnd);
    return () => {
      cvsTrigger?.removeEventListener("mousedown", eraseStart);
      cvsTrigger?.removeEventListener("mousemove", eraseMoving);
      cvsTrigger?.removeEventListener("mouseup", eraseEnd);
    };
  }, [sceneState, eraserSize]);

  const detectEle = (e: MouseEvent) => {
    const hitedEles: DrawingElement[] = [];
    sceneState.elements.forEach((ele) => {
      const isHit = isContained(
        ele.polygons,
        new Flatten.Circle(
          new Flatten.Point(e.clientX, e.clientY),
          eraserSize * 1.1
        ), // 1.1是橡皮点击之后扩大的比例
        true
      );
      if (isHit) {
        hitedEles.push(ele);
      }
    });
    return hitedEles;
  };

  const eraseStart = (e: MouseEvent) => {
    mousePressed.current = true;
    collectUpdatingElements(e);
    appendEraserPoints(e);

    setSceneAtom({ ...sceneState });
  };

  const collectUpdatingElements = (e: MouseEvent) => {
    const eles = detectEle(e);

    eles.forEach((ele) => {
      const isExist = sceneState.updatingElements
        .map((up) => up.ele)
        .includes(ele);
      if (!isExist) {
        const updating: UpdatingElement = {
          type: "erase",
          ele,
          eraserOutlineIdx: ele.eraserPolygons.length,
        };
        sceneState.updatingElements.push(updating);
      }
    });
  };

  const appendEraserPoints = (e: MouseEvent) => {
    eraserPts.current.push({ x: e.clientX, y: e.clientY });
    const eraserOutlinePoints = getStroke(eraserPts.current, {
      ...defaultEraserStrokeOptions,
      size: eraserSize * 1.1,
    }).map((pt) => {
      return { x: pt[0], y: pt[1] };
    });

    sceneState.updatingElements.forEach((up) => {
      up.ele.eraserPolygons[up.eraserOutlineIdx!] = new Polygon(
        eraserOutlinePoints.map((pt) => new Flatten.Point(pt.x, pt.y))
      );
    });
  };

  const eraseMoving = (e: MouseEvent) => {
    collectUpdatingElements(e);
    if (!mousePressed.current) return;
    if (sceneState.updatingElements.length === 0) return;
    appendEraserPoints(e);

    setSceneAtom({ ...sceneState });
  };

  const eraseEnd = (e: MouseEvent) => {
    mousePressed.current = false;
    eraserPts.current.length = 0;

    sceneState.updatingElements.forEach((up) => {
      // up.ele.polygons
      // ele.ele.boundingBox = new Flatten.Box();
      removeBlankEle(sceneState.updatingElements.map((u) => u.ele));
    });

    sceneState.updatingElements.length = 0;
    setSceneAtom({ ...sceneState });
  };

  return <SizeSlider controledAtom={eraserRadius} />;
}
