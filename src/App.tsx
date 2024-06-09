import { Point, Polygon } from "@flatten-js/core";
import * as d3c from "d3-color";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { DomElements } from "src/CoreRenderer/DomElements";
import { DrawCanvas } from "src/CoreRenderer/DrawCanvas";
import { redrawAllEles } from "src/CoreRenderer/DrawCanvas/core";
import { DynamicCanvas } from "src/CoreRenderer/DynamicCanvas";
import { DrawingElement, ptIsContained } from "src/CoreRenderer/basicTypes";
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

  const [selectedKey] = useAtom(selectedKeyAtom);
  const [sceneData, setSceneData] = useAtom(sceneAtom);
  const currentHandle = useRef<
    [DrawingElement, TransformHandleDirection] | null
  >(null);

  const canvasEventTrigger = useRef<HTMLDivElement>(null);
  const setTriggerAtom = useSetAtom(canvasEventTriggerAtom);
  setTransparent();
  useDrawingOperator();
  const size = useAtomValue(brushRadius) / 4;
  const eraserSize = useAtomValue(eraserRadius) / 4;

  const detectElesInterceted = useCallback(
    (e: MouseEvent) => {
      if (selectedKey !== 2) return;
      sceneData.elements.forEach((ele) => {
        // console.time("isHit");
        const isHit = ptIsContained(
          ele.polygons,
          ele.eraserPolygons,
          new Point(e.clientX, e.clientY)
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

  const detectHandles = useCallback(
    (e: MouseEvent) => {
      if (selectedKey !== 2) return;

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
              new Point(e.clientX, e.clientY)
            );
            if (isHit) {
              currentHandle.current = [u.ele, handles[handleIdx]];
            }
          }
        }
        currentHandle.current = null;
      }
    },
    [sceneData, selectedKey]
  );

  const [cursorSvg, setCursorSvg] = useAtom(cursorSvgAtom);

  useEffect(() => {
    if (selectedKey === 0 || selectedKey === 1) {
      const controlledSize = selectedKey === 0 ? size : eraserSize;
      const colorStr = colorIdx !== -1 ? colorConfigs[colorIdx].key : color;
      const c = d3c.color(colorStr);
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
    }
  }, [setCursorSvg, size, eraserSize, selectedKey, color, colorIdx]);
  useEffect(() => {
    setTriggerAtom(canvasEventTrigger.current);

    document.addEventListener("mousedown", detectElesInterceted);
    document.addEventListener("mousedown", detectHandles);
    setup();
    return () => {
      document.removeEventListener("mousedown", detectElesInterceted);
      document.removeEventListener("mousedown", detectHandles);
    };
  }, [detectElesInterceted, detectHandles, setTriggerAtom]);
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
