import Flatten, { Circle, Relations } from "@flatten-js/core";
import { useAtom, useAtomValue } from "jotai";
import getStroke from "perfect-freehand";
import React, { useEffect, useRef } from "react";
import { drawingCanvasCache } from "src/CoreRenderer/DrawCanvas/DrawingCanvas";
import { DrawingElement, Point } from "src/CoreRenderer/basicTypes";
import { getAntArea } from "src/PenPanel";
import { SizeSlider } from "src/SizeSlider";
import { UpdatingElement } from "src/drawingElements/data/scene";
import { sceneAtom } from "src/state/sceneState";
import { canvasAtom, eraserRadius } from "src/state/uiState";
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

  useEffect(() => {
    canvas?.addEventListener("mousedown", eraseStart);
    canvas?.addEventListener("mousemove", eraseMoving);
    canvas?.addEventListener("mouseup", eraseEnd);
    return () => {
      canvas?.removeEventListener("mousedown", eraseStart);
      canvas?.removeEventListener("mousemove", eraseMoving);
      canvas?.removeEventListener("mouseup", eraseEnd);
    };
  }, [sceneState]);

  const detectEle = (e: MouseEvent) => {
    const detectedEles: DrawingElement[] = [];
    sceneState.elements.forEach((ele) => {
      if (ele.polygons.length > 0) {
        const isHit = Relations.intersect(
          ele.polygons[0],
          new Circle(new Flatten.Point(e.clientX, e.clientY), eraserSize)
        );
        if (isHit) detectedEles.push(ele);
      }
    });
    return detectedEles;
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
          eraserOutlineIdx: ele.eraserOutlines.length,
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
      up.ele.eraserOutlines[up.eraserOutlineIdx!] = eraserOutlinePoints;
    });
  };

  const eraseMoving = (e: MouseEvent) => {
    console.time("detect collision...");
    collectUpdatingElements(e);
    console.timeEnd("detect collision...");

    if (!mousePressed.current) return;
    if (sceneState.updatingElements.length === 0) return;
    appendEraserPoints(e);

    setSceneAtom({ ...sceneState });
  };

  const eraseEnd = (e: MouseEvent) => {
    // cleanupEles(new Flatten.Point(e.clientX, e.clientY));

    mousePressed.current = false;
    eraserPts.current.length = 0;
    sceneState.updatingElements.length = 0;
    setSceneAtom({ ...sceneState });
  };

  const cleanupEles = (pt: Flatten.Point) => {
    for (let [ele, cvs] of drawingCanvasCache.ele2DrawingCanvas) {
      const ctx = cvs.getContext("2d")!;
      const polys = getAntArea(pt.x, pt.y, {
        width: cvs.width,
        height: cvs.height,
        context: ctx,
        imageData: ctx.getImageData(0, 0, cvs.width, cvs.height),
      });
      if (polys.length > 0) {
        console.log((polys[0].area() as number) - cvs.width * cvs.height);
      }
    }
  };

  return <SizeSlider controledAtom={eraserRadius} />;
}
