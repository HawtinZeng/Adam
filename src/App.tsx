import Flatten, { Box, Polygon } from "@flatten-js/core";
import * as d3c from "d3-color";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { DomElements } from "src/CoreRenderer/DomElements";
import { DrawCanvas } from "src/CoreRenderer/DrawCanvas";
import { TransformHandle } from "src/CoreRenderer/DrawCanvas/Transform2DOperator";
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
import { TransformHandleDirection } from "src/CoreRenderer/utilsTypes";
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
function App() {
  const colorIdx = useAtomValue(colorAtom);
  const color = useAtomValue(customColor);

  const [cursorSvg, setCursorSvg] = useAtom(cursorSvgAtom);
  const [selectedKey] = useAtom(selectedKeyAtom);
  const [sceneData, setSceneData] = useAtom(sceneAtom);
  const currentHandle = useRef<
    [DrawingElement, TransformHandleDirection] | null
  >(null);
  const dragInfo = useRef<{
    isDragging: boolean;
    startPos: Point;
    bbx: Box;
  } | null>(null);

  const canvasEventTrigger = useRef<HTMLDivElement>(null);
  const setTriggerAtom = useSetAtom(canvasEventTriggerAtom);
  setTransparent();
  useDrawingOperator();
  const size = useAtomValue(brushRadius) / 4;
  const eraserSize = useAtomValue(eraserRadius) / 4;

  const detectElesInterceted = useCallback(
    (e: MouseEvent) => {
      if (selectedKey !== 2) return;
      if (currentHandle.current !== null) return;
      sceneData.elements.forEach((ele) => {
        // console.time("isHit");
        const isHit = ptIsContained(
          ele.polygons,
          ele.eraserPolygons,
          new Flatten.Point(e.clientX, e.clientY)
        );
        if (isHit) {
          const updating: UpdatingElement = {
            type: "transform",
            ele,
          };
          sceneData.updatingElements[0] = updating;
          setSceneData({ ...sceneData });
        } else {
          redrawAllEles(undefined, undefined, sceneData.elements);
        }
        // console.timeEnd("isHit");
      });
    },
    [sceneData, selectedKey, setSceneData]
  );

  const changeCursor = useCallback(() => {
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
          const handles = Object.keys(
            operator.handles
          ) as TransformHandleDirection[];
          for (let handleIdx = 0; handleIdx < handles.length; handleIdx++) {
            const isHit = ptIsContained(
              [new Polygon(operator.handles[handles[handleIdx]])],
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
        changeCursor();
      }
    },
    [sceneData.updatingElements, selectedKey, setCursorSvg, changeCursor]
  );

  const dragMove = useCallback(
    (e: MouseEvent) => {
      if (!dragInfo.current || !currentHandle.current) return;

      const [x, y] = [e.clientX, e.clientY];
      const [startX, startY, oriBbx] = [
        dragInfo.current.startPos.x,
        dragInfo.current.startPos.y,
        dragInfo.current.bbx,
      ];
      const bbx = oriBbx.clone();

      let [diffX, diffY] = [x - startX, y - startY];
      const [el, dir] = currentHandle.current;
      if (el && dir) {
        const u = sceneData.updatingElements[0];
        if (el.type === DrawingType.img && u && u.type === "transform") {
          switch (dir) {
            case TransformHandle.n:
              bbx.ymin += diffY;
              break;
            case TransformHandle.ne:
              bbx.ymin += diffY;
              bbx.xmax += diffX;
              break;
            case TransformHandle.e:
              bbx.xmax += diffX;
              break;
            case TransformHandle.se:
              bbx.xmax += diffX;
              bbx.ymax += diffY;
              break;
            case TransformHandle.s:
              bbx.ymax += diffY;
              break;
            case TransformHandle.sw:
              bbx.ymax += diffY;
              bbx.xmin += diffX;
              break;
            case TransformHandle.w:
              bbx.xmin += diffX;
              break;
            case TransformHandle.nw:
              bbx.xmin += diffX;
              bbx.ymin += diffY;
              break;
          }
        } else {
          // FreeDrawing
        }

        setSceneData({ ...sceneData });
      }
    },
    [sceneData, setSceneData]
  );

  const dragStart = useCallback(
    (e: MouseEvent) => {
      if (selectedKey !== 2) return;
      if (currentHandle.current === null) return;
      const u = sceneData.updatingElements[0];
      if (!dragInfo.current && u?.handles) {
        const img = u.ele as ImageElement;
        const xs = [
          img.points[0].x,
          img.points[0].x + img.originalWidth * img.scale.x,
        ].sort((a, b) => a - b);
        const ys = [
          img.points[0].y,
          img.points[0].y + img.originalHeight * img.scale.y,
        ].sort((a, b) => a - b);
        const bbx = new Box(xs[0], ys[0], xs[1], ys[1]);

        dragInfo.current = {
          isDragging: true,
          startPos: new Flatten.Point(e.clientX, e.clientY),
          bbx,
        };
      }
    },
    [sceneData.updatingElements, selectedKey]
  );
  const dragEnd = useCallback(() => {
    if (dragInfo.current) {
      dragInfo.current = null;
    }
  }, []);

  useEffect(() => {
    if (selectedKey !== 2) {
      sceneData.updatingElements = [];
      redrawAllEles(undefined, undefined, sceneData.elements);
    }
    changeCursor();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setCursorSvg, selectedKey]);
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
}

export default App;
