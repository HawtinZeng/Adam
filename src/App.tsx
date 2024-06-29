import { Button } from "@mui/material";
import {
  Box,
  Edge,
  Line,
  Point as PointZ,
  Polygon,
  Vector,
} from "@zenghawtin/graph2d";
import al from "algebra.js";
import * as d3c from "d3-color";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { cloneDeep, merge } from "lodash";
import { nanoid } from "nanoid";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { DomElements } from "src/CoreRenderer/DomElements";
import { DrawCanvas } from "src/CoreRenderer/DrawCanvas";
import {
  Transform2DOperator,
  TransformHandle,
} from "src/CoreRenderer/DrawCanvas/Transform2DOperator";
import { redrawAllEles, rotate } from "src/CoreRenderer/DrawCanvas/core";
import { DynamicCanvas } from "src/CoreRenderer/DynamicCanvas";
import {
  DrawingElement,
  Point,
  ptIsContained,
} from "src/CoreRenderer/basicTypes";
import {
  DrawingType,
  FreeDrawing,
  ImageElement,
  newFreeDrawingElement,
} from "src/CoreRenderer/drawingElementsTypes";
import MainMenu, { colorConfigs, menuConfigs } from "src/MainMenu";
import { getBoundryPoly } from "src/MainMenu/imageInput";
import { UpdatingElement } from "src/drawingElements/data/scene";
import { useMousePosition } from "src/hooks/mouseHooks";
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
export const debugShowHandlesPosition = true;
const showDebugPanel = true;
// @ts-ignore
window.al = al;
function eliminateOriginChange(
  el: DrawingElement,
  oldOrigin: PointZ,
  newOrigin: PointZ
): Point {
  const pos = el.position;
  /**
    (x - cx) * Math.cos(angle) - (y - cy) * Math.sin(angle) + cx,
   */
  const finalPos = rotate(pos.x, pos.y, oldOrigin.x, oldOrigin.y, el.rotation);
  const eq = al.parse(
    `(x - (${newOrigin.x})) * (${Math.cos(el.rotation)}) - (y - (${
      newOrigin.y
    })) * (${Math.sin(el.rotation)}) + (${newOrigin.x}) = (${finalPos[0]})`
  ) as al.Equation;
  // @ts-ignore

  let xAnswer: string = (eq.lhs._hasVariable("x") &&
    eq.solveFor("x")?.toString()) as string;

  /**
    (x - cx) * Math.sin(angle) + (y - cy) * Math.cos(angle) + cy,
   */
  const eq2 = al.parse(
    `((${xAnswer}) - (${newOrigin.x})) * (${Math.sin(el.rotation)}) - (y - (${
      newOrigin.y
    })) * (${Math.cos(el.rotation)}) + (${newOrigin.y}) = (${finalPos[1]})`
  ) as al.Equation;

  const yAnswer = eq2.solveFor("y");
  const xAns = (al.parse(xAnswer) as al.Expression).eval({
    y: yAnswer,
  });

  return {
    x: eval(xAns!.toString()),
    y: eval(yAnswer!.toString()),
  };
}

function App() {
  const colorIdx = useAtomValue(colorAtom);
  const color = useAtomValue(customColor);

  const [cursorSvg, setCursorSvg] = useAtom(cursorSvgAtom);
  const [selectedKey] = useAtom(selectedKeyAtom);
  const [sceneData, setSceneData] = useAtom(sceneAtom);
  const currentHandle = useRef<[DrawingElement, TransformHandle] | null>(null);
  const dragInfo = useRef<{
    type: "move" | "resize" | "rotate";
    startPos: Point;
    originalScale?: Point;
    originalHandles?: Transform2DOperator;
    originalPt?: Point;
    originalRotation?: number;
    originalRotateOrigin?: Point;
    originalBoundary?: Polygon;
  } | null>(null);

  const canvasEventTrigger = useRef<HTMLDivElement>(null);
  const setTriggerAtom = useSetAtom(canvasEventTriggerAtom);
  setTransparent();
  useDrawingOperator();
  const size = useAtomValue(brushRadius) / 4;
  const eraserSize = useAtomValue(eraserRadius) / 4;

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

  const dragStart = useCallback(
    (e: MouseEvent, ele?: DrawingElement) => {
      if (selectedKey !== 2) return;
      const u = sceneData.updatingElements[0];

      // drag image itself
      if (currentHandle.current === null && ele) {
        dragInfo.current = {
          type: "move",
          startPos: { x: e.clientX, y: e.clientY },
          originalPt: { x: ele.position.x, y: ele.position.y },
          originalRotateOrigin: ele.rotateOrigin,
        };
        setCursorSvg("move");
        return;
      }

      // drag handler
      if (!dragInfo.current && u?.handleOperator && currentHandle.current) {
        const img = u.ele as ImageElement;
        const [_, dir] = currentHandle.current!;
        dragInfo.current = {
          type: dir === TransformHandle.ro ? "rotate" : "resize",
          startPos: { x: e.clientX, y: e.clientY },
          originalScale: { ...img.scale },
          originalRotation: img.rotation,
          originalHandles: cloneDeep(u.handleOperator)!,
          originalBoundary: cloneDeep(img.polygons[0]),
        };
        return;
      }

      change2DefaultCursor();
    },
    [
      change2DefaultCursor,
      sceneData.updatingElements,
      selectedKey,
      setCursorSvg,
    ]
  );
  const detectElesInterceted = useCallback(
    (e: MouseEvent) => {
      if (selectedKey !== 2) return;
      if (currentHandle.current !== null) return;
      for (let i = sceneData.elements.length - 1; i >= 0; i--) {
        // console.time("isHit");
        const ele = sceneData.elements[i];
        const isHit = ptIsContained(
          ele.polygons,
          ele.eraserPolygons,
          new PointZ(e.clientX, e.clientY)
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
          // @ts-ignore
          window.clickedEle = ele;
          return;
        } else {
          // @ts-ignore
          window.clickedEle = null;
        }
      }
      sceneData.updatingElements = [];
      redrawAllEles(undefined, undefined, sceneData.elements);
    },
    [dragStart, sceneData, selectedKey, setSceneData]
  );

  const detectHandles = useCallback(
    (e: MouseEvent) => {
      if (selectedKey !== 2) return;
      if (dragInfo.current) return;
      for (let i = 0; i < sceneData.updatingElements.length; i++) {
        const u = sceneData.updatingElements[i];
        const operator = u.handleOperator;
        if (operator) {
          const handleOperator = Object.keys(
            operator.handleOperator
          ) as TransformHandle[];
          for (
            let handleIdx = 0;
            handleIdx < handleOperator.length;
            handleIdx++
          ) {
            const isHit = ptIsContained(
              [operator.handleOperator[handleOperator[handleIdx]]!],
              [],
              new PointZ(e.clientX, e.clientY)
            );

            if (isHit) {
              setCursorSvg(operator.cursorStyle[handleOperator[handleIdx]]);
              currentHandle.current = [u.ele, handleOperator[handleIdx]];
              // console.log(handleOperator[handleIdx]);hovered handle location
              return;
            }
          }
        }
        currentHandle.current = null;

        const isHit = ptIsContained(
          u.ele.polygons.map((p) => p.rotate(u.ele.rotation, p.box.center)),
          u.ele.eraserPolygons,
          new PointZ(e.clientX, e.clientY)
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
      const { type, startPos, originalPt, originalRotateOrigin } =
        dragInfo.current;
      if (type === "move") {
        const u = sceneData.updatingElements[0];
        const img = u!.ele as ImageElement;
        const offset = {
          x: e.clientX - startPos.x,
          y: e.clientY - startPos.y,
        };
        img.position = {
          x: originalPt!.x + offset.x,
          y: originalPt!.y + offset.y,
        };

        img.rotateOrigin = {
          x: originalRotateOrigin!.x + offset.x,
          y: originalRotateOrigin!.y + offset.y,
        };

        img.polygons[0] = getBoundryPoly(img);

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
      ];
      let [diffX, diffY] = [x - startX, y - startY];
      const [el, dir] = currentHandle.current!;
      if (el && dir) {
        const updatedScale = { x: oriScale.x, y: oriScale.y };
        const updatedPt = { x: el.position.x, y: el.position.y };
        if (dir !== TransformHandle.ro) {
          if (el.type === DrawingType.img) {
            scalingImg(
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
            const rotationCenter = new PointZ(
              i.rotateOrigin.x,
              i.rotateOrigin.y
            );
            const originalLine = new Line(
              new PointZ(startX, startY),
              rotationCenter
            );
            const currentLine = new Line(new PointZ(x, y), rotationCenter);
            const deltaRotation = originalLine.norm.angleTo(currentLine.norm);
            i.rotation = deltaRotation + originalRotation;

            i.polygons[0] = getBoundryPoly(i);
          }
        }
        setSceneData({ ...sceneData });
      }
    },
    [sceneData, setSceneData, scalingImg]
  );
  const drawAPoint = (p: Point) => {
    const newFreeElement = merge(cloneDeep(newFreeDrawingElement), {
      id: nanoid(),
      position: { x: p.x, y: p.y },
      points: [{ x: p.x, y: p.y }],
    } as FreeDrawing);

    // default property
    const subMenuStrokeOption =
      menuConfigs[0]?.btnConfigs?.[selectedKey]?.strokeOptions;
    newFreeElement.strokeOptions = cloneDeep(subMenuStrokeOption!);

    // updated property, size是ui控件的直径
    newFreeElement.strokeOptions.size = size / 4;
    newFreeElement.strokeOptions.strokeColor =
      colorIdx !== -1 ? colorConfigs[colorIdx].key : color;

    sceneData.elements.push(newFreeElement);
  };

  const deleteEle = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Backspace" && sceneData.updatingElements.length > 0) {
        sceneData.updatingElements.forEach((u) => {
          const el = u.ele;
          const i = sceneData.elements.findIndex((e) => e === el);
          sceneData.elements.splice(i, 1);
        });
        sceneData.updatingElements.length = 0;
        redrawAllEles(undefined, undefined, sceneData.elements);
      }
    },
    [sceneData]
  );

  const dragEnd = useCallback(() => {
    if (dragInfo.current) {
      const u = sceneData.updatingElements[0];
      if (
        u &&
        u.ele.type === DrawingType.img &&
        dragInfo.current.type === "resize"
      ) {
        const img = u.ele as ImageElement;
        // drawAPoint(img.position);
        const oldOrigin = dragInfo.current.originalHandles!.rect.center;
        const pos = img.position;
        const bbx = new Box(
          pos.x,
          pos.y,
          pos.x + img.originalWidth * img.scale.x,
          pos.y + img.originalHeight * img.scale.y
        );
        const newOrigin = bbx.center;

        const realNewOri = newOrigin.rotate(img.rotation, oldOrigin);
        const rightBottomPt = img.polygons[0].vertices[2];
        const deltaVec = new Vector(rightBottomPt, realNewOri);
        const realNewPos = realNewOri.translate(deltaVec);
        const newPos = realNewPos.rotate(-img.rotation, realNewOri);

        img.position = newPos;
        img.rotateOrigin = realNewOri;
        img.polygons[0] = getBoundryPoly(img);
      }
      setSceneData({ ...sceneData });
      dragInfo.current = null;
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

  const mousePos = useMousePosition();

  useEffect(() => {
    const div = canvasEventTrigger.current!;
    div.addEventListener("mousedown", detectElesInterceted);

    div.addEventListener("mousedown", dragStart);
    div.addEventListener("mouseup", dragEnd);

    window.addEventListener("keydown", deleteEle);

    div.addEventListener("mousemove", detectHandles);
    div.addEventListener("mousemove", dragMove);

    setup();
    return () => {
      div.removeEventListener("mousedown", detectElesInterceted);
      div.removeEventListener("mousedown", dragStart);

      div.removeEventListener("mouseup", dragEnd);
      window.removeEventListener("keydown", deleteEle);

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
    deleteEle,
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
            {showDebugPanel && (
              <>
                <div>{`updatingElements: ${sceneData.updatingElements.length}`}</div>
                <div>{`updatingEle position: ${sceneData.updatingElements[0]?.ele.position.x}, ${sceneData.updatingElements[0]?.ele.position.y}`}</div>
                <div>{`updatingEle scale: ${sceneData.updatingElements[0]?.ele.scale.x}, ${sceneData.updatingElements[0]?.ele.scale.y}`}</div>
                <div>{`updatingEle rotation: ${sceneData.updatingElements[0]?.ele.rotation}`}</div>
                <div>{`updatingEle rotationOrigin: ${sceneData.updatingElements[0]?.ele.rotateOrigin.x}, ${sceneData.updatingElements[0]?.ele.rotateOrigin.y}`}</div>
                <div>{`updatingEle polygon[0] orientation: ${
                  sceneData.updatingElements[0]?.ele.polygons[0] &&
                  [
                    ...sceneData.updatingElements[0]?.ele.polygons[0].faces,
                  ][0].orientation()
                }`}</div>
                <div>{`elements: ${sceneData.elements.length}`}</div>
                <div>{`mouse position: ${mousePos.x}, ${mousePos.y}`}</div>
                <div>{`handleOperator: ${currentHandle.current?.[1]}`}</div>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => {
                    // @ts-ignore

                    window.snapshots = window.snapshots ? window.snapshots : [];
                    // @ts-ignore
                    window.snapshots.push(cloneDeep(sceneData.elements));
                  }}
                >
                  保存到window.snapshots
                </Button>
              </>
            )}
          </>
        ),
        [
          cursorSvg,
          mousePos.x,
          mousePos.y,
          sceneData.elements,
          sceneData.updatingElements,
        ]
      )}
    </>
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  function scalingImg(
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
    const offset = new Vector(diffX, diffY);
    let deltaVec: Vector;
    switch (dir) {
      case TransformHandle.n: {
        const thirdEdge = [
          ...dragInfo.current!.originalBoundary!.edges,
        ][3] as Edge;
        const dir = new Vector(thirdEdge.start, thirdEdge.end).normalize();
        const delta = offset.dot(dir);
        deltaVec = dir.scale(delta, delta);

        // change the boundary of scaling image.
        const pts = dragInfo.current!.originalBoundary!.vertices;
        pts[0] = pts[0].translate(deltaVec!);
        pts[1] = pts[1].translate(deltaVec!);
        img.polygons[0] = new Polygon(pts);

        updatedScale.y =
          (img.originalHeight * oriScale.y + Math.sign(oriScale.y) * delta) /
          img.originalHeight;
        const originalPos =
          oriHandles.handleOperator[TransformHandle.nw]?.box.center.clone();

        const rotationOrigin = new PointZ(
          img.rotateOrigin.x,
          img.rotateOrigin.y
        );
        const finalPos = originalPos!
          .translate(dir.scale(delta, delta))
          .rotate(-img.rotation, rotationOrigin);
        updatedPt.x = finalPos.x;
        updatedPt.y = finalPos.y;
        break;
      }

      case TransformHandle.ne: {
        // change the boundary of scaling image.
        const pts = dragInfo.current!.originalBoundary!.vertices;
        pts[1] = pts[1].translate(offset);

        const zerothEdge = [
          ...dragInfo.current!.originalBoundary!.edges,
        ][0] as Edge;
        const thirdEdge = [
          ...dragInfo.current!.originalBoundary!.edges,
        ][3] as Edge;

        const zeroDir = new Vector(
          zerothEdge.start,
          zerothEdge.end
        ).normalize();
        const thirdDir = new Vector(thirdEdge.start, thirdEdge.end).normalize();

        const scalar3 = offset.dot(thirdDir);
        pts[0] = pts[0].translate(thirdDir.scale(scalar3, scalar3));

        const scalar0 = offset.dot(zeroDir);
        pts[2] = pts[2].translate(zeroDir.scale(scalar0, scalar0));

        img.polygons[0] = new Polygon(pts);
        // change the image element
        updatedScale.y =
          (img.originalHeight * oriScale.y + Math.sign(oriScale.y) * scalar3) /
          img.originalHeight;
        updatedScale.x =
          (img.originalWidth * oriScale.x + Math.sign(oriScale.x) * scalar0) /
          img.originalWidth;

        const originalPos = dragInfo.current!.originalBoundary!.vertices[0];
        const rotateOrigin = new PointZ(img.rotateOrigin.x, img.rotateOrigin.y);
        const finalPos = originalPos!
          .translate(thirdDir.scale(scalar3, scalar3))
          .rotate(-img.rotation, rotateOrigin);
        updatedPt.x = finalPos.x;
        updatedPt.y = finalPos.y;
        break;
      }

      case TransformHandle.e: {
        const zorothEdge = [
          ...dragInfo.current!.originalBoundary!.edges,
        ][0] as Edge;
        const dir = new Vector(zorothEdge.start, zorothEdge.end).normalize();
        const delta = offset.dot(dir);
        deltaVec = dir.scale(delta, delta);

        // change the boundary of scaling image.
        const pts = dragInfo.current!.originalBoundary!.vertices;
        pts[1] = pts[1].translate(deltaVec!);
        pts[2] = pts[2].translate(deltaVec!);
        img.polygons[0] = new Polygon(pts);

        updatedScale.x =
          (img.originalWidth * oriScale.x + Math.sign(oriScale.x) * delta) /
          img.originalWidth;
        break;
      }

      case TransformHandle.se: {
        // change the boundary of scaling image.
        const pts = dragInfo.current!.originalBoundary!.vertices;
        pts[2] = pts[2].translate(offset);

        const secondEdge = [
          ...dragInfo.current!.originalBoundary!.edges,
        ][0] as Edge;
        const thirdEdge = [
          ...dragInfo.current!.originalBoundary!.edges,
        ][3] as Edge;

        const zeroDir = new Vector(
          secondEdge.start,
          secondEdge.end
        ).normalize();
        const thirdDir = new Vector(thirdEdge.end, thirdEdge.start).normalize();

        const scalar0 = offset.dot(zeroDir);
        pts[1] = pts[1].translate(zeroDir.scale(scalar0, scalar0));

        const scalar3 = offset.dot(thirdDir);
        pts[3] = pts[3].translate(thirdDir.scale(scalar3, scalar3));

        img.polygons[0] = new Polygon(pts);
        // change the image element
        updatedScale.y =
          (img.originalHeight * oriScale.y + Math.sign(oriScale.y) * scalar3) /
          img.originalHeight;
        updatedScale.x =
          (img.originalWidth * oriScale.x + Math.sign(oriScale.x) * scalar0) /
          img.originalWidth;
        break;
      }

      case TransformHandle.s: {
        const secondEdge = [
          ...dragInfo.current!.originalBoundary!.edges,
        ][1] as Edge;
        const dir = new Vector(secondEdge.start, secondEdge.end).normalize();
        const delta = offset.dot(dir);
        deltaVec = dir.scale(delta, delta);

        // change the boundary of scaling image.
        const pts = dragInfo.current!.originalBoundary!.vertices;
        pts[2] = pts[2].translate(deltaVec!);
        pts[3] = pts[3].translate(deltaVec!);
        img.polygons[0] = new Polygon(pts);

        updatedScale.y =
          (img.originalHeight * oriScale.y + Math.sign(oriScale.y) * delta) /
          img.originalHeight;
        break;
      }

      case TransformHandle.sw: {
        // change the boundary of scaling image.
        const pts = dragInfo.current!.originalBoundary!.vertices;
        pts[3] = pts[3].translate(offset);

        const firstEdge = [
          ...dragInfo.current!.originalBoundary!.edges,
        ][1] as Edge;
        const secondEdge = [
          ...dragInfo.current!.originalBoundary!.edges,
        ][2] as Edge;

        const firstDir = new Vector(firstEdge.start, firstEdge.end).normalize();
        const secondDir = new Vector(
          secondEdge.start,
          secondEdge.end
        ).normalize();

        const scalar1 = offset.dot(firstDir);
        pts[2] = pts[2].translate(firstDir.scale(scalar1, scalar1));

        const scalar2 = offset.dot(secondDir);
        pts[0] = pts[0].translate(secondDir.scale(scalar2, scalar2));

        img.polygons[0] = new Polygon(pts);

        updatedScale.y =
          (img.originalHeight * oriScale.y + Math.sign(oriScale.y) * scalar1) /
          img.originalHeight;
        updatedScale.x =
          (img.originalWidth * oriScale.x + Math.sign(oriScale.x) * scalar2) /
          img.originalWidth;

        const originalPos = dragInfo.current!.originalBoundary!.vertices[0];
        const rotateOrigin = new PointZ(img.rotateOrigin.x, img.rotateOrigin.y);
        const finalPos = originalPos!
          .translate(secondDir.scale(scalar2, scalar2))
          .rotate(-img.rotation, rotateOrigin);
        updatedPt.x = finalPos.x;
        updatedPt.y = finalPos.y;

        break;
      }

      case TransformHandle.w: {
        const secondEdge = [
          ...dragInfo.current!.originalBoundary!.edges,
        ][2] as Edge;
        const dir = new Vector(secondEdge.start, secondEdge.end).normalize();
        const delta = offset.dot(dir);
        deltaVec = dir.scale(delta, delta);

        // change the boundary of scaling image.
        const pts = dragInfo.current!.originalBoundary!.vertices;
        pts[0] = pts[0].translate(deltaVec!);
        pts[3] = pts[3].translate(deltaVec!);
        img.polygons[0] = new Polygon(pts);

        updatedScale.x =
          (img.originalWidth * oriScale.x + Math.sign(oriScale.x) * delta) /
          img.originalWidth;
        const originalPos = dragInfo.current!.originalBoundary!.vertices[0];
        const rotateOrigin = new PointZ(img.rotateOrigin.x, img.rotateOrigin.y);
        const finalPos = originalPos!
          .translate(dir.scale(delta, delta))
          .rotate(-img.rotation, rotateOrigin);
        updatedPt.x = finalPos.x;
        break;
      }

      case TransformHandle.nw: {
        // change the boundary of scaling image.
        const pts = dragInfo.current!.originalBoundary!.vertices;
        pts[0] = pts[0].translate(offset);

        const zeroEdge = [
          ...dragInfo.current!.originalBoundary!.edges,
        ][0] as Edge;
        const thirdEdge = [
          ...dragInfo.current!.originalBoundary!.edges,
        ][3] as Edge;

        const zeroDir = new Vector(zeroEdge.end, zeroEdge.start).normalize();
        const thirdDir = new Vector(thirdEdge.start, thirdEdge.end).normalize();

        const scalar0 = offset.dot(zeroDir);
        pts[3] = pts[3].translate(zeroDir.scale(scalar0, scalar0));

        const scalar3 = offset.dot(thirdDir);
        pts[1] = pts[1].translate(thirdDir.scale(scalar3, scalar3));

        img.polygons[0] = new Polygon(pts);

        updatedScale.y =
          (img.originalHeight * oriScale.y + Math.sign(oriScale.y) * scalar3) /
          img.originalHeight;
        updatedScale.x =
          (img.originalWidth * oriScale.x + Math.sign(oriScale.x) * scalar0) /
          img.originalWidth;

        const originalPos = dragInfo.current!.originalBoundary!.vertices[0];
        const rotateOrigin = new PointZ(img.rotateOrigin.x, img.rotateOrigin.y);
        const finalPos = originalPos!
          .translate(offset)
          .rotate(-img.rotation, rotateOrigin);
        updatedPt.x = finalPos.x;
        updatedPt.y = finalPos.y;

        break;
      }
    }

    img.position = { x: updatedPt!.x, y: updatedPt!.y };
    img.scale = updatedScale;
  }
}

export default App;
