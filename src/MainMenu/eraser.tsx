/* eslint-disable react-hooks/exhaustive-deps */
import { Circle, Point as PointZ, Polygon, Vector } from "@zenghawtin/graph2d";
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
  disableDrawingAtom,
  eraserRadius,
  selectedKeyAtom,
  settings,
} from "src/state/uiState";
const updatingLimit = 3;

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
  const eraserSize = useAtomValue<number>(eraserRadius) / 2;
  const eraserPts = useRef<Point[]>([]);
  const canvas = useAtomValue(canvasAtom);
  const [sceneState, setSceneAtom] = useAtom(sceneAtom);
  const mousePressed = useRef<boolean>(false);
  const cvsTrigger = useAtomValue(canvasEventTriggerAtom);
  const disableDrawing = useAtomValue(disableDrawingAtom);

  const [_, setMenuKey] = useAtom(selectedKeyAtom);
  const settingsValue = useAtomValue(settings);

  const detectEle = (e: MouseEvent) => {
    const hitedEles: DrawingElement[] = [];
    sceneState.elements.forEach((ele) => {
      const isHit = isContained(
        ele.boundary,
        new Circle(new PointZ(e.clientX, e.clientY), eraserSize),
        true
      );

      if (isHit) {
        hitedEles.push(ele);
      }
    });

    return hitedEles;
  };

  const eraseStart = (e: MouseEvent) => {
    if (disableDrawing) return;
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
        };
        sceneState.updatingElements.push(updating);
        if (sceneState.updatingElements.length > updatingLimit)
          sceneState.updatingElements.splice(
            0,
            sceneState.updatingElements.length - updatingLimit
          );
      }
    });
  };

  const appendEraserPoints = (e: MouseEvent) => {
    eraserPts.current.push({ x: e.clientX, y: e.clientY });
    const eraserOutlinePoints = getStroke(eraserPts.current, {
      ...defaultEraserStrokeOptions,
      size: eraserSize,
      streamline: 0,
    }).map((pt) => {
      return { x: pt[0], y: pt[1] };
    });

    sceneState.updatingElements.forEach((up) => {
      up.ele.excludeArea.push(
        new Polygon(eraserOutlinePoints.map((pt) => new PointZ(pt.x, pt.y)))
          .rotate(-up.ele.rotation, up.ele.rotateOrigin)
          .translate(new Vector(-up.ele.position.x, -up.ele.position.y))
      );
    });
  };

  const eraseMoving = (e: MouseEvent) => {
    if (!mousePressed.current) return;
    collectUpdatingElements(e);
    if (sceneState.updatingElements.length === 0) return;
    appendEraserPoints(e);

    setSceneAtom({ ...sceneState });
  };

  const eraseEnd = () => {
    mousePressed.current = false;
    eraserPts.current.length = 0;
    removeBlankEle(
      sceneState.updatingElements.map((u) => u.ele),
      sceneState,
      () =>
        setSceneAtom({
          ...sceneState,
          updatingElements: [],
        })
    );
    if (settingsValue[0]) setMenuKey(2);
  };

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
  }, [
    sceneState,
    eraserSize,
    disableDrawing,
    canvas,
    cvsTrigger,
    eraseStart,
    eraseMoving,
    eraseEnd,
  ]);
  return <SizeSlider controledAtom={eraserRadius} />;
}
