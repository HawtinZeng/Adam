import Flatten, { Box, Line, Point as PointF, Polygon } from "@flatten-js/core";
import * as d3c from "d3-color";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { cloneDeep } from "lodash";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { DomElements } from "src/CoreRenderer/DomElements";
import { DrawCanvas } from "src/CoreRenderer/DrawCanvas";
import {
  Transform2DOperator,
  TransformHandle,
} from "src/CoreRenderer/DrawCanvas/Transform2DOperator";
import { redrawAllEles } from "src/CoreRenderer/DrawCanvas/core";
import { DynamicCanvas } from "src/CoreRenderer/DynamicCanvas";
import {
  DrawingElement,
  Point,
  ptIsContained,
} from "src/CoreRenderer/basicTypes";
import {
  DrawingType,
  ImageElement,
} from "src/CoreRenderer/drawingElementsTypes";
import MainMenu, { colorConfigs } from "src/MainMenu";
import { UpdatingElement } from "src/drawingElements/data/scene";
import { useDrawingOperator } from "src/hooks/useDrawingOperator";
import pointer from "src/images/svgs/mouse/pointer.svg";
import { setup } from "src/setup";
import { sceneAtom } from "src/state/sceneState";
import {
  brushRadius,
  canvasEventTriggerAtom,
  colorAtom,
  cursorSvgAtom,
  customColor,
  eraserRadius,
  selectedKeyAtom,
} from "src/state/uiState";
import { setTransparent } from "./commonUtils";
export const debugShowEleId = false;
export const debugShowHandlesPosition = false;
function App() {
  const colorIdx = useAtomValue(colorAtom);
  const color = useAtomValue(customColor);

  const [cursorSvg, setCursorSvg] = useAtom(cursorSvgAtom);
  const [selectedKey] = useAtom(selectedKeyAtom);
  const [sceneData, setSceneData] = useAtom(sceneAtom);
  const currentHandle = useRef<[DrawingElement, TransformHandle] | null>(null);
  const dragInfo = useRef<{
    type: "move" | "resize";
    startPos: Point;
    originalScale?: Point;
    originalHandles?: Transform2DOperator;
    originalPt?: Point;
    originalRotation?: number;
    originalPols?: Polygon[];
  } | null>(null);

  const canvasEventTrigger = useRef<HTMLDivElement>(null);
  const setTriggerAtom = useSetAtom(canvasEventTriggerAtom);
  setTransparent();
  useDrawingOperator();
  const size = useAtomValue(brushRadius) / 4;
  const eraserSize = useAtomValue(eraserRadius) / 4;

  const dragStart = useCallback(
    (e: MouseEvent, ele?: DrawingElement) => {
      if (selectedKey !== 2) return;
      const u = sceneData.updatingElements[0];
      if (currentHandle.current === null && ele) {
        dragInfo.current = {
          type: "move",
          startPos: { x: e.clientX, y: e.clientY },
          originalPt: { ...ele.points[0] },
        };
        setCursorSvg("move");
        return;
      }

      if (!dragInfo.current && u?.handles) {
        const img = u.ele as ImageElement;

        dragInfo.current = {
          type: "resize",
          startPos: { x: e.clientX, y: e.clientY },
          originalScale: { ...img.scale },
          originalRotation: img.rotation,
          originalHandles: cloneDeep(u.handles)!,
        };
      }
    },
    [sceneData.updatingElements, selectedKey, setCursorSvg]
  );
  const detectElesInterceted = useCallback(
    (e: MouseEvent) => {
      if (selectedKey !== 2) return;
      if (currentHandle.current !== null) return;
      for (let i = sceneData.elements.length - 1; i >= 0; i--) {
        // console.time("isHit");
        const ele = sceneData.elements[i];
        const isHit = ptIsContained(
          ele.polygons.map((p) => p.rotate(ele.rotation, p.box.center)),
          ele.eraserPolygons,
          new Flatten.Point(e.clientX, e.clientY)
        );
        if (isHit) {
          dragStart(e, ele);
          if (sceneData.updatingElements.find((u) => u.ele === ele)) {
            return;
          }
          const updating: UpdatingElement = {
            type: "transform",
            ele,
          };
          sceneData.updatingElements[0] = updating;
          setSceneData({ ...sceneData });
          return;
        }
      }
      sceneData.updatingElements = [];
      redrawAllEles(undefined, undefined, sceneData.elements);
    },
    [dragStart, sceneData, selectedKey, setSceneData]
  );

  const change2DefaultCursor = useCallback(() => {
    if (selectedKey === 0 || selectedKey === 1) {
      const controlledSize = selectedKey === 0 ? size : eraserSize;
      const colorStr = colorIdx !== -1 ? colorConfigs[colorIdx].key : color;
      const c = d3c.color(selectedKey === 0 ? colorStr : "#d9453c");
      if (!c) return;
      c.opacity = 0.8;
      setCursorSvg(
        `url('data:image/svg+xml;utf8,<svg  width="${
          controlledSize * 2
        }" height="${controlledSize * 2}" viewBox="0 0 ${controlledSize * 2} ${
          controlledSize * 2
        }" xmlns="http://www.w3.org/2000/svg"><circle cx="${controlledSize}" cy="${controlledSize}" r="${controlledSize}"  style="fill: ${c
          .brighter(1)
          .formatRgb()};" /></svg>') ${controlledSize} ${controlledSize}, default`
      );
    } else if (selectedKey === 2) {
      setCursorSvg(`url(${pointer}), default`);
    } else {
      setCursorSvg("default");
    }
  }, [selectedKey, size, eraserSize, colorIdx, color, setCursorSvg]);

  const detectHandles = useCallback(
    (e: MouseEvent) => {
      if (selectedKey !== 2) return;
      if (dragInfo.current) return;
      for (let i = 0; i < sceneData.updatingElements.length; i++) {
        const u = sceneData.updatingElements[i];
        const operator = u.handles;
        if (operator) {
          const handles = Object.keys(operator.handles) as TransformHandle[];
          for (let handleIdx = 0; handleIdx < handles.length; handleIdx++) {
            const isHit = ptIsContained(
              [
                new Polygon(operator.handles[handles[handleIdx]]).rotate(
                  u.ele.rotation,
                  u.ele.polygons[0].box.center
                ),
              ],
              [],
              new Flatten.Point(e.clientX, e.clientY)
            );

            if (isHit) {
              setCursorSvg(operator.cursorStyle[handles[handleIdx]]);
              currentHandle.current = [u.ele, handles[handleIdx]];
              // console.log(handles[handleIdx]);hovered handle location
              return;
            }
          }
        }
        currentHandle.current = null;

        const isHit = ptIsContained(
          u.ele.polygons,
          u.ele.eraserPolygons,
          new Flatten.Point(e.clientX, e.clientY)
        );
        if (isHit) {
          setCursorSvg("move");
        } else {
          change2DefaultCursor();
        }
      }
    },
    [
      sceneData.updatingElements,
      selectedKey,
      setCursorSvg,
      change2DefaultCursor,
    ]
  );

  const dragMove = useCallback(
    (e: MouseEvent) => {
      if (!dragInfo.current) return;

      // move
      const { type, startPos, originalPt } = dragInfo.current;
      if (type === "move") {
        const u = sceneData.updatingElements[0];
        const img = u!.ele as ImageElement;
        const offset = {
          x: e.clientX - startPos.x,
          y: e.clientY - startPos.y,
        };
        img.points[0] = {
          x: originalPt!.x + offset.x,
          y: originalPt!.y + offset.y,
        };
        const bbx = new Box(
          img.points[0].x,
          img.points[0].y + img.originalHeight,
          img.points[0].x + img.originalWidth,
          img.points[0].y
        );
        // const m = new Matrix().translate(img.points[0].x, img.points[0].y);
        img.polygons[0] = new Polygon(bbx).reverse();

        setSceneData({ ...sceneData });
        return;
      }

      // transform
      if (!currentHandle.current) return;
      const [x, y] = [e.clientX, e.clientY];
      const [startX, startY, oriScale, oriHandles, originalRotation] = [
        dragInfo.current.startPos.x,
        dragInfo.current.startPos.y,
        dragInfo.current.originalScale!,
        dragInfo.current.originalHandles!,
        dragInfo.current.originalRotation!,
        dragInfo.current.originalPols!,
      ];
      let [diffX, diffY] = [x - startX, y - startY];
      const [el, dir] = currentHandle.current!;
      if (el && dir) {
        const updatedScale = { x: oriScale.x, y: oriScale.y };
        const updatedPt = { x: el.points[0].x, y: el.points[0].y };
        if (dir !== TransformHandle.ro) {
          if (el.type === DrawingType.img) {
            transformImg(
              el,
              dir,
              oriHandles,
              updatedScale,
              oriScale,
              diffY,
              updatedPt,
              diffX
            );
          } else {
            // FreeDrawing
          }
        } else {
          // rotation
          if (el.type === DrawingType.img) {
            const i = el as ImageElement;
            const rotationCenter = i.polygons[0].box.center;
            const originalLine = new Line(
              new PointF(startX, startY),
              rotationCenter
            );
            const currentLine = new Line(new PointF(x, y), rotationCenter);
            const deltaRotation = originalLine.norm.angleTo(currentLine.norm);
            i.rotation = deltaRotation + originalRotation;

            const bbx = new Box(
              i.points[0].x,
              i.points[0].y + i.originalHeight * i.scale.y,
              i.points[0].x + i.originalWidth * i.scale.x,
              i.points[0].y
            );
            el.polygons[0] = new Polygon(bbx).reverse();

            setSceneData({ ...sceneData });
          }
        }
      }
    },
    [sceneData, setSceneData, transformImg]
  );

  const dragEnd = useCallback(() => {
    if (dragInfo.current) {
      dragInfo.current = null;
      const u = sceneData.updatingElements[0];
      if (u) {
        const img = u.ele as ImageElement;
        const bbx = new Box(
          img.points[0].x,
          img.points[0].y + img.originalHeight * img.scale.y,
          img.points[0].x + img.originalWidth * img.scale.x,
          img.points[0].y
        );
        bbx.transform(new Flatten.Matrix());
        img.polygons[0] = new Polygon(bbx).reverse();
        setSceneData({ ...sceneData });
      }
    }
  }, [sceneData, setSceneData]);

  useEffect(() => {
    sceneData.updatingElements = [];
    setSceneData({ ...sceneData });
    if (selectedKey !== 2) {
      redrawAllEles(undefined, undefined, sceneData.elements);
    }
    change2DefaultCursor();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setCursorSvg, selectedKey, size, eraserSize, colorIdx, color]);
  useEffect(() => {
    setTriggerAtom(canvasEventTrigger.current);
  }, [setTriggerAtom]);
  useEffect(() => {
    const div = canvasEventTrigger.current!;
    div.addEventListener("mousedown", detectElesInterceted);
    div.addEventListener("mousedown", dragStart);

    div.addEventListener("mouseup", dragEnd);

    div.addEventListener("mousemove", detectHandles);
    div.addEventListener("mousemove", dragMove);
    setup();
    return () => {
      div.removeEventListener("mousedown", detectElesInterceted);
      div.removeEventListener("mousedown", dragStart);

      div.removeEventListener("mouseup", dragEnd);

      div.removeEventListener("mousemove", detectHandles);
      div.removeEventListener("mousemove", dragMove);
    };
  }, [
    detectElesInterceted,
    detectHandles,
    setTriggerAtom,
    canvasEventTrigger,
    dragMove,
    dragStart,
    dragEnd,
  ]);
  return (
    <>
      {useMemo(
        () => (
          <>
            <div
              ref={canvasEventTrigger}
              style={{ cursor: cursorSvg ?? "default" }}
            >
              <DrawCanvas />
              <DynamicCanvas />
              <DomElements />
            </div>
            <MainMenu />
          </>
        ),
        [cursorSvg]
      )}
    </>
  );

  function transformImg(
    el: DrawingElement,
    dir: string,
    oriHandles: Transform2DOperator,
    updatedScale: { x: number; y: number },
    oriScale: Point,
    diffY: number,
    updatedPt: { x: number; y: number },
    diffX: number
  ) {
    const img = el as ImageElement;
    switch (dir) {
      case TransformHandle.n:
        const h = oriHandles.handles[dir]!.center.y;
        updatedScale.y =
          (img.originalHeight * oriScale.y - Math.sign(oriScale.y) * diffY) /
          img.originalHeight;
        updatedPt.y = h + diffY;
        break;
      case TransformHandle.ne:
        const { x: neX, y: neY } = oriHandles.handles[dir]!.center;
        updatedScale.y =
          (img.originalHeight * oriScale.y - Math.sign(oriScale.y) * diffY) /
          img.originalHeight;
        if (Math.sign(oriScale.y) > 0) updatedPt.y = neY + diffY;
        updatedScale.x =
          (img.originalWidth * oriScale.x + Math.sign(oriScale.x) * diffX) /
          img.originalWidth;
        if (Math.sign(oriScale.x) < 0) updatedPt.x = neX + diffX;
        break;
      case TransformHandle.e:
        const r = oriHandles.handles[dir]!.center.x;
        updatedScale.x =
          (img.originalWidth * oriScale.x + Math.sign(oriScale.x) * diffX) /
          img.originalWidth;
        if (Math.sign(oriScale.x) < 0) updatedPt.x = r + diffX;
        break;
      case TransformHandle.se:
        const { x: seX, y: seY } = oriHandles.handles[dir]!.center;
        updatedScale.x =
          (img.originalWidth * oriScale.x + Math.sign(oriScale.x) * diffX) /
          img.originalWidth;
        if (Math.sign(oriScale.x) < 0) updatedPt.x = seX + diffX;
        updatedScale.y =
          (img.originalHeight * oriScale.y + Math.sign(oriScale.y) * diffY) /
          img.originalHeight;
        if (Math.sign(oriScale.y) < 0) updatedPt.y = seY + diffY;
        break;
      case TransformHandle.s:
        updatedScale.y =
          (img.originalHeight * oriScale.y + Math.sign(oriScale.y) * diffY) /
          img.originalHeight;
        break;
      case TransformHandle.sw:
        const { x: swX, y: swY } = oriHandles.handles[dir]!.center;
        updatedScale.y =
          (img.originalHeight * oriScale.y + Math.sign(oriScale.y) * diffY) /
          img.originalHeight;
        if (Math.sign(oriScale.y) < 0) updatedPt.y = swY + diffY;
        updatedScale.x =
          (img.originalWidth * oriScale.x - Math.sign(oriScale.x) * diffX) /
          img.originalWidth;
        if (Math.sign(oriScale.x) > 0) updatedPt.x = swX + diffX;
        break;
      case TransformHandle.w:
        const l = oriHandles.handles[dir]!.center.x;
        updatedScale.x =
          (img.originalWidth * oriScale.x - Math.sign(oriScale.x) * diffX) /
          img.originalWidth;
        if (Math.sign(oriScale.x) > 0) updatedPt.x = l + diffX;
        break;
      case TransformHandle.nw:
        const { x: nwX, y: nwY } = oriHandles.handles[dir]!.center;
        updatedScale.x =
          (img.originalWidth * oriScale.x - Math.sign(oriScale.x) * diffX) /
          img.originalWidth;
        if (Math.sign(oriScale.x) > 0) updatedPt.x = nwX + diffX;
        updatedScale.y =
          (img.originalHeight * oriScale.y - Math.sign(oriScale.y) * diffY) /
          img.originalHeight;
        if (Math.sign(oriScale.y) > 0) updatedPt.y = nwY + diffY;
        break;
    }
    el.scale = updatedScale;
    el.points[0] = updatedPt;
    setSceneData({ ...sceneData });
  }
}

export default App;
