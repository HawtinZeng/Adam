import stylex from "@stylexjs/stylex";

import { Button } from "@mui/material";
import Cancel from "src/images/svgs/bottomPanel/cancel.svg";
import Copy from "src/images/svgs/bottomPanel/copy.svg";
import Pin from "src/images/svgs/bottomPanel/pin.svg";
import Save from "src/images/svgs/bottomPanel/save.svg";

import Flatten, {
  Box,
  Circle,
  Edge,
  Line,
  Point as PointZ,
  Polygon,
  Vector,
} from "@zenghawtin/graph2d";
import { ElementRect } from "commonModule/types";
import * as d3c from "d3-color";
import { IpcRenderer, IpcRendererEvent } from "electron";
import { BaseResult } from "get-windows";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { cloneDeep, remove } from "lodash";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ReactSVG } from "react-svg";
import { DomElements } from "src/CoreRenderer/DomElements";
import { DrawCanvas } from "src/CoreRenderer/DrawCanvas";
import {
  Transform2DOperator,
  Transform2DOperatorLine,
  TransformHandle,
} from "src/CoreRenderer/DrawCanvas/Transform2DOperator";
import {
  clearCanvas,
  clearMainCanvas,
  drawCircle,
  drawPolygonPointIndex,
  redrawAllEles,
} from "src/CoreRenderer/DrawCanvas/core";
import { DrawingElement, ptIsContained } from "src/CoreRenderer/basicTypes";
import {
  getBoundryPoly,
  getCenter,
  getCircleBoundary,
  getExcludeBoundaryPoly,
} from "src/CoreRenderer/boundary";
import {
  CircleShapeElement,
  DrawingType,
  FreeDrawing,
  ImageElement,
  RectangleShapeElement,
} from "src/CoreRenderer/drawingElementsTemplate";
import MainMenu, { colorConfigs } from "src/MainMenu";
import { Point } from "src/Utils/Data/geometry";
import { setTransparent, unsetTransparent } from "src/commonUtils";
import { btn } from "src/components/Btn";
import { DraggableTransparent } from "src/components/DraggableTransparent";
import { Scene, UpdatingElement } from "src/drawingElements/data/scene";
import { useKeyboard } from "src/hooks/keyboardHooks";
import { useMousePosition } from "src/hooks/mouseHooks";
import pointer from "src/images/svgs/mouse/pointer.svg";
import { Shot } from "src/screenShot/Shot";
import { logger } from "src/setup";
import { Action, History } from "src/state/history";
import {
  multipleScenes,
  multipleSynchronizer,
  sceneAtom,
} from "src/state/sceneState";
import { globalSynchronizer, Synchronizer } from "src/state/synchronizer";
import {
  canvasEventTriggerAtom,
  colorAtom,
  cursorSvgAtom,
  customColor,
  eraserRadius,
  screenLogAtom,
  selectedKeyAtom,
  settings,
  sizeAtom,
} from "src/state/uiState";
import { useTextFunction } from "src/text/activateTextFunction";

type ResponseStatus = "succeeded" | "failed" | "unknown";
export class FunctionResponse {
  status: ResponseStatus = "unknown";
  info: string = "happy coding!";
  constructor(status: ResponseStatus, info?: string) {
    this.status = status;
    if (info !== undefined) {
      this.info = info;
    }
  }
}
declare global {
  interface Window {
    ipcRenderer: IpcRenderer;
  }
}

window.Buffer = require("buffer/").Buffer;

export const debugShowEleId = false;
export const debugShowHandlesPosition = false;
export const debugArrow = false;
export const showElePtLength = false;
export const showEleId = false;

const debugBAndR = false;
const showDebugPanel = false;
const debugExtensionScroll = false;
const debugDrawAllAreas = true;

let currentFocusedWindow: (BaseResult & { containedWin?: number }) | undefined;

let stream: MediaStream | undefined;
const cap = new Map<string, ImageCapture>();
let confirmedScrollPage = true;

export async function getCapture(sourceId: string) {
  if (cap.has(sourceId)) return cap.get(sourceId);
  if (sourceId) {
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          // @ts-ignore
          mandatory: {
            chromeMediaSource: "desktop",
            chromeMediaSourceId: sourceId,
          },
        },
      });
      const track = stream.getVideoTracks()[0];

      const c = new ImageCapture(track);
      cap.set(sourceId, c);
      return c;
    } catch (error) {
      logger.error(error as Error);
    }
  }
}

function isBevelHandle(hand: TransformHandle | undefined) {
  if (!hand) return false;
  return [
    TransformHandle.ne,
    TransformHandle.nw,
    TransformHandle.se,
    TransformHandle.sw,
  ].includes(hand);
}

function App() {
  const colorIdx = useAtomValue(colorAtom);
  const color = useAtomValue(customColor);

  const [cursorSvg, setCursorSvg] = useAtom(cursorSvgAtom);
  const [selectedKey, setSeletedKey] = useAtom(selectedKeyAtom);

  const [sceneData, setSceneData] = useAtom(sceneAtom);

  const history = useRef<History>(new History());

  const [screenLog, sscreenLog] = useAtom(screenLogAtom);

  const currentHandle = useRef<[DrawingElement, TransformHandle | any] | null>(
    null
  );

  const settingValue = useAtomValue(settings);

  const [showShotPanel, setShowShotPanel] = useState(false);

  const isShowShiftTip = useRef<boolean>(false);
  const [currentKeyboard] = useKeyboard();
  const dragInfo = useRef<{
    type: "move" | "resize" | "rotate";
    startPos: Point;
    originalScale?: Point;
    originalHandles?: Transform2DOperator | Transform2DOperatorLine;
    originalPos?: Point;
    originalRotation?: number;
    originalRotateOrigin?: Point;
    originalBoundary?: Polygon; // world coordinates
    originalOutlinePoints?: Point[]; // FreeDraw outlinePoints
    originalBoundaryRelative?: Polygon; // FreeDraw oriBoundary[0]
  } | null>(null);
  const canvasEventTrigger = useRef<HTMLDivElement>(null);
  const setTriggerAtom = useSetAtom(canvasEventTriggerAtom);
  const size = useAtomValue(sizeAtom) / 4;
  const eraserSize = useAtomValue(eraserRadius) / 4;

  const { startText, terminateText } = useTextFunction();

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

      // drag handler
      if (!dragInfo.current && u?.handleOperator && currentHandle.current) {
        const ele = u.ele;
        const [_, dir] = currentHandle.current!;
        dragInfo.current = {
          type: dir === TransformHandle.ro ? "rotate" : "resize",
          startPos: { x: e.clientX, y: e.clientY },
          originalScale: { ...ele.scale },
          originalRotation: ele.rotation,
          originalHandles: cloneDeep(u.handleOperator)!,
          originalBoundary: cloneDeep(ele.boundary[0]),
          originalBoundaryRelative: cloneDeep(
            (ele as FreeDrawing).oriBoundary?.[0]
          ),
          originalOutlinePoints: cloneDeep((ele as FreeDrawing).outlinePoints),
          originalPos: cloneDeep(ele.position),
        };
        return;
      }

      // drag  itself
      if (currentHandle.current === null && ele) {
        dragInfo.current = {
          type: "move",
          startPos: { x: e.clientX, y: e.clientY },
          originalPos: { x: ele.position.x, y: ele.position.y },
          originalRotateOrigin: ele.rotateOrigin,
        };
        setCursorSvg("move");
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
        const ele = sceneData.elements[i];
        let boundary;
        if (ele.type === DrawingType.circle) {
          boundary = [getCircleBoundary(ele as CircleShapeElement)];
        } else {
          boundary = ele.boundary;
        }

        const isHit = ptIsContained(
          boundary,
          ele.excludeArea,
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
          drawPolygonPointIndex(undefined, ele.boundary[0], "yellow", 3);
          return;
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
        if (operator?.type === "box") {
          let handleOperator: TransformHandle[];
          if (!operator.ableTransform) {
            handleOperator = [TransformHandle.ro];
          } else {
            handleOperator = Object.keys(
              operator.handleOperator
            ) as TransformHandle[];
          }

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

              isShowShiftTip.current = isBevelHandle(handleOperator[handleIdx]);
              setTimeout(() => {
                updateMouseTipPosition(e);
              }, 100);
              currentHandle.current = [u.ele, handleOperator[handleIdx]];
              return;
            }
          }
        } else if (operator?.type === "line") {
          for (let idx = 0; idx < operator.smallDots.length; idx++) {
            const rect = operator.smallDots[idx];
            const isHit = ptIsContained(
              [rect.poly],
              [],
              new PointZ(e.clientX, e.clientY)
            );
            if (isHit) {
              currentHandle.current = [u.ele, idx];
              return;
            }
          }
        }
        currentHandle.current = null;
        isShowShiftTip.current = false;

        // change the cursor style when moving the cursor out of the element.
        const isHit = ptIsContained(
          u.ele.boundary.map((p) => p.rotate(u.ele.rotation, p.box.center)),
          u.ele.excludeArea,
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
  let lastMousePos: React.MutableRefObject<PointZ | null> = useRef(null);
  const dragMove = useCallback(
    (e: MouseEvent) => {
      if (dragInfo.current) {
        // move
        const { type, startPos, originalPos, originalRotateOrigin } =
          dragInfo.current;
        if (type === "move") {
          const u = sceneData.updatingElements[0];
          const ele = u!.ele;
          const offset = {
            x: e.clientX - startPos.x,
            y: e.clientY - startPos.y,
          };
          ele.position = {
            x: originalPos!.x + offset.x,
            y: originalPos!.y + offset.y,
          };

          ele.rotateOrigin = new Flatten.Point(
            originalRotateOrigin!.x + offset.x,
            originalRotateOrigin!.y + offset.y
          );

          ele.boundary = [getBoundryPoly(ele)!];
          ele.excludeArea = getExcludeBoundaryPoly(ele) ?? [];
        } else {
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
          const [el, dirOrPtIdx] = currentHandle.current!;
          if (el && typeof dirOrPtIdx === "string") {
            const updatedScale = { x: oriScale.x, y: oriScale.y };
            const updatedPt = { x: el.position.x, y: el.position.y };
            const lockScale =
              isShowShiftTip.current && currentKeyboard === "Shift";

            if (dirOrPtIdx !== TransformHandle.ro) {
              if (
                el.type === DrawingType.img ||
                el.type === DrawingType.rectangle ||
                el.type === DrawingType.circle ||
                el.type === DrawingType.freeDraw ||
                el.type === DrawingType.text ||
                el.type === DrawingType.shot
              ) {
                scaleOnMove(
                  el,
                  dirOrPtIdx as any,
                  oriHandles,
                  updatedScale,
                  oriScale,
                  diffY,
                  updatedPt,
                  diffX,
                  lockScale
                );
              } else {
              }
            } else {
              // rotation
              if (
                el.type === DrawingType.img ||
                el.type === DrawingType.rectangle ||
                el.type === DrawingType.circle ||
                el.type === DrawingType.freeDraw ||
                el.type === DrawingType.text ||
                el.type === DrawingType.shot
              ) {
                const rotationCenter = new PointZ(
                  el.rotateOrigin.x,
                  el.rotateOrigin.y
                );
                const originalLine = new Line(
                  new PointZ(startX, startY),
                  rotationCenter
                );
                const currentLine = new Line(new PointZ(x, y), rotationCenter);

                const deltaRotation = originalLine.norm.angleTo(
                  currentLine.norm
                ); // in radian between 0 to 2 * PI

                const caclRotation = deltaRotation + originalRotation;
                el.rotation =
                  caclRotation > 2 * Math.PI
                    ? caclRotation - 2 * Math.PI
                    : caclRotation;

                el.boundary[0] = getBoundryPoly(el)!;
              }
            }
          } else if (el && typeof dirOrPtIdx === "number") {
            if (lastMousePos.current) {
              el.points[dirOrPtIdx].x += e.clientX - lastMousePos.current.x;
              el.points[dirOrPtIdx].y += e.clientY - lastMousePos.current.y;
            }
          }
        }

        setSceneData({ ...sceneData });
      }
      lastMousePos.current = new PointZ(e.clientX, e.clientY);
    },
    [sceneData, setSceneData, currentKeyboard]
  );

  const globalKeydown = useCallback(
    (e: KeyboardEvent) => {
      if (
        (e.key === "Backspace" || e.key === "Delete") &&
        sceneData.updatingElements.length > 0
      ) {
        sceneData.updatingElements.forEach((u) => {
          const el = u.ele;
          const i = sceneData.elements.findIndex((e) => e === el);
          sceneData.elements.splice(i, 1);
        });
        sceneData.updatingElements.length = 0;
        redrawAllEles(undefined, undefined, sceneData.elements);
      } else if (e.key === "Escape") {
        if (selectedKey === 6) {
          terminateText();
          redrawAllEles(undefined, undefined, sceneData.elements);
          setSeletedKey(2);
        }
        setSeletedKey(-1);
      }
    },
    [sceneData.elements, sceneData.updatingElements, setSeletedKey]
  );

  const dragEnd = useCallback(() => {
    if (dragInfo.current) {
      const u = sceneData.updatingElements[0];
      if (
        u &&
        (u.ele.type === DrawingType.img ||
          u.ele.type === DrawingType.rectangle ||
          u.ele.type === DrawingType.circle ||
          u.ele.type === DrawingType.text ||
          u.ele.type === DrawingType.shot) &&
        dragInfo.current.type === "resize"
      ) {
        const el = u.ele as
          | ImageElement
          | RectangleShapeElement
          | CircleShapeElement;
        const oldOrigin = (dragInfo.current
          .originalHandles as Transform2DOperator)!.rect.center;
        const pos = el.position;
        const bbx = new Box(
          pos.x,
          pos.y,
          pos.x + el.width * el.scale.x,
          pos.y + el.height * el.scale.y
        );
        const newOrigin = bbx.center;

        const realNewOri = newOrigin.rotate(el.rotation, oldOrigin);
        const rightBottomPt = el.boundary[0].vertices[2];
        const deltaVec = new Vector(rightBottomPt, realNewOri);
        const realNewPos = realNewOri.translate(deltaVec);
        const newPos = realNewPos.rotate(-el.rotation, realNewOri);

        el.position = newPos;
        el.rotateOrigin = realNewOri;

        el.boundary[0] = getBoundryPoly(el)!;
      } else if (u && u.ele.type === DrawingType.freeDraw) {
        const free = u.ele as FreeDrawing;
        const newOrigin = getCenter(free);

        const leftTop = new PointZ(free.position.x, free.position.y).rotate(
          free.rotation,
          free.rotateOrigin
        );
        free.rotateOrigin = newOrigin;
        const newPos = leftTop.rotate(-free.rotation, free.rotateOrigin);
        free.position = newPos;

        free.boundary = getBoundryPoly(free) ? [getBoundryPoly(free)!] : [];
        free.excludeArea = getExcludeBoundaryPoly(free) ?? [];
      } else if (
        u &&
        (u.ele.type === DrawingType.arrow ||
          u.ele.type === DrawingType.polyline)
      ) {
        u.ele.boundary = getBoundryPoly(u.ele) ? [getBoundryPoly(u.ele)!] : [];
      }
      dragInfo.current = null;
    }
  }, [sceneData, setSceneData]);

  // initialize adam
  useEffect(() => {
    // 第一次运行，会聚焦到 terminal 中，导致后续存放的 windowId 放到了 terminal 对应的 window 中
    setTransparent();
  }, []);

  function changeArea(e, areaInfos: string) {
    // updateArea(areaInfos);
  }

  function handleInitializeArea(e, areaInfos: string) {
    updateArea(areaInfos);
  }

  function updateArea(areaInfos: string) {
    if (globalSynchronizer.value) {
      globalSynchronizer.value.areasMap.clear();
      globalSynchronizer.value.elesMap.clear();
      globalSynchronizer.value.scrollTopMap.clear();
    }

    const allAreaInfo = JSON.parse(areaInfos) as ElementRect[];

    allAreaInfo.forEach((areaInfo) => {
      const areaId = areaInfo.id;

      if (!globalSynchronizer.value) return;

      globalSynchronizer.value!.setArea(
        new Box(
          areaInfo.offsetX,
          areaInfo.offsetY,
          areaInfo.offsetX + areaInfo.width,
          areaInfo.offsetY + areaInfo.height
        ),
        areaId
      );
    });

    clearCanvas();
    globalSynchronizer.value!.drawAllAreas();
  }

  function extensionScrollElementHandler(e, areaInfos: string) {
    const areaInfo = JSON.parse(areaInfos) as ElementRect;

    const areaId = areaInfo.id;
    if (!globalSynchronizer.value) return;

    const needUpdating = globalSynchronizer.value.scrollTop(
      areaId,
      areaInfo.scrollTop
    );

    if (needUpdating) {
      redrawAllEles(
        undefined,
        undefined,
        sceneData.elements,
        undefined,
        undefined
      );
    }

    if (debugExtensionScroll) {
      redrawAllEles(undefined, undefined, sceneData.elements);
    }

    globalSynchronizer.value!.drawAllAreas();
    drawCircle(
      null,
      new Circle(new PointZ(areaInfo.offsetX, areaInfo.offsetY), 5),
      "pink"
    );
  }
  useEffect(() => {
    window.ipcRenderer?.on("scrollElement", extensionScrollElementHandler);
    window.ipcRenderer?.on("zoom", changeArea);
    window.ipcRenderer?.on("initializeArea", handleInitializeArea);
    return () => {
      window.ipcRenderer?.off("scrollElement", extensionScrollElementHandler);
      window.ipcRenderer?.off("zoom", changeArea);
      window.ipcRenderer?.off("initializeArea", handleInitializeArea);
    };
  }, [sceneData]);

  useEffect(() => {
    if (globalSynchronizer.value) {
      const areas = [...globalSynchronizer.value!.areasMap];
      areas
        .sort((a, b) => {
          return new Polygon(a[1]).area() - new Polygon(b[1]).area();
        })
        .forEach((item) => {
          globalSynchronizer.value!.partition(sceneData.elements, item[0]);
        });
    }
  }, [sceneData]);

  const changeScene = useCallback(
    (_?: IpcRendererEvent, tabId?: number | undefined) => {
      multipleScenes.set(sceneData.windowId, { ...sceneData });
      if (globalSynchronizer.value) {
        multipleSynchronizer.set(sceneData.windowId, globalSynchronizer.value);
      }

      if (!currentFocusedWindow) return;

      if (tabId !== undefined) {
        if (!currentFocusedWindow.containedWin)
          currentFocusedWindow.containedWin = currentFocusedWindow.id;
        currentFocusedWindow.id = tabId;
      }

      const existSynchronizer = multipleSynchronizer.get(
        currentFocusedWindow.id
      );

      if (!existSynchronizer) {
        globalSynchronizer.value = new Synchronizer(
          currentFocusedWindow.id,
          new Box(
            currentFocusedWindow.bounds.x,
            currentFocusedWindow.bounds.y,
            currentFocusedWindow.bounds.x + currentFocusedWindow.bounds.width,
            currentFocusedWindow.bounds.y + currentFocusedWindow.bounds.height
          ),
          currentFocusedWindow.title
        );
      } else {
        globalSynchronizer.value = existSynchronizer;
      }

      const exist = multipleScenes.get(currentFocusedWindow.id);
      if (!exist) {
        const createdScene = new Scene([], [], [] as any);
        createdScene.windowId = currentFocusedWindow.id;

        setSceneData(createdScene);
        clearMainCanvas();
      } else {
        setSceneData({ ...exist });
        redrawAllEles(undefined, undefined, exist.elements);
      }
      history.current.changeScene(currentFocusedWindow.id);
    },
    [sceneData, setSceneData]
  );
  useEffect(() => {
    window.ipcRenderer?.on("activeBrowserTab", changeScene);
    return () => {
      window.ipcRenderer?.off("activeBrowserTab", changeScene);
    };
  }, [changeScene]);

  const changeWorkspace = async (e, windowInfo?: BaseResult | undefined) => {
    if (!windowInfo) return;
    // click the same window needn't change scene.
    currentFocusedWindow = windowInfo;

    if (windowInfo.title.includes("Chrome")) {
      window.ipcRenderer.send("queryActiveTabId");
    } else {
      changeScene();
    }
  };

  //  triggered when drag window
  function mousedragHandler(_: any, windowInfo: BaseResult) {
    if (!windowInfo || windowInfo.title === "Adam" || windowInfo.title === "")
      return;
    if (
      globalSynchronizer.value &&
      !currentFocusedWindow?.title.includes("Chrome")
    ) {
      // globalSynchronizer.value.updateArea(
      //   new Box(
      //     windowInfo.bounds.x,
      //     windowInfo.bounds.y,
      //     windowInfo.bounds.x + windowInfo.bounds.width,
      //     windowInfo.bounds.y + windowInfo.bounds.height
      //   ),
      //   currentFocusedWindow!.id.toString()
      // );

      // globalSynchronizer.value!.setArea();
      // globalSynchronizer.value?.partition(sceneData);

      redrawAllEles(undefined, undefined, sceneData.elements);
      if (debugBAndR)
        sceneData.elements.forEach((e) => {
          drawCircle(
            null,
            new Circle(new PointZ(e.rotateOrigin.x, e.rotateOrigin.y), 10)
          );
          e.boundary.forEach((p) => {
            [...p.vertices].forEach((pt) =>
              drawCircle(null, new Circle(pt, 10))
            );
          });
        });
      if (debugDrawAllAreas) globalSynchronizer.value?.drawAllAreas();
    } else if (
      globalSynchronizer.value &&
      currentFocusedWindow?.title.includes("Chrome")
    ) {
      // we use chrome extension boundsChnage event to update graph on chrome browser/DOM
    }
  }

  useEffect(() => {
    const alt2Handler = () => {
      if (selectedKey === 1) {
        setSeletedKey(-1);
        setTransparent();
      } else {
        setSeletedKey(1);
      }
    };

    const alt3Handler = () => {
      if (selectedKey === 2) {
        setSeletedKey(-1);
        setTransparent();
      } else {
        setSeletedKey(2);
      }
    };

    const alt4Handler = () => {
      if (selectedKey === 3) {
        setSeletedKey(-1);
        setTransparent();
      } else {
        setSeletedKey(3);
      }
    };

    const AltToggleHandler = () => {
      if (selectedKey !== -1) {
        setSeletedKey(-1);
      } else {
        setSeletedKey(2);
      }
    };

    const alt1Handler = () => {
      if (selectedKey === 0) {
        setSeletedKey(-1);
        setTransparent();
      } else {
        setSeletedKey(0);
      }
    };

    const alt5Handler = () => {
      if (selectedKey === 4) {
        setSeletedKey(-1);
        setTransparent();
      } else {
        setSeletedKey(4);
      }
    };

    const alt6Handler = () => {
      if (selectedKey === 5) {
        setSeletedKey(-1);
        setTransparent();
      } else {
        setSeletedKey(5);
      }
    };

    const alt7Handler = () => {
      if (selectedKey === 6) {
        setSeletedKey(-1);
        setTransparent();
      } else {
        setSeletedKey(6);
      }
    };

    const alt8Handler = () => {
      if (selectedKey === 7) {
        setSeletedKey(-1);
        setTransparent();
      } else {
        setSeletedKey(7);
      }
    };

    /**
     * 清理画布
     */
    const altCHandler = () => {
      terminateText();

      sceneData.elements.length = 0;
      setSceneData({ ...sceneData });
      clearMainCanvas();
      globalSynchronizer.value?.clearAllEles();
    };

    const altQHandler = () => {
      setSeletedKey(-1);
      setTransparent();
    };

    function moveHead(direction: "back" | "forward") {
      const action: Action =
        direction === "back"
          ? history.current.back()
          : history.current.forward();

      const res = excuteAction(action);
      if (res.status !== "succeeded") {
        logger.error(res.info);
      } else {
        setSceneData({ ...sceneData });
      }
    }

    function excuteAction(act: Action) {
      const res = new FunctionResponse("succeeded");
      const t = act.type;
      switch (t) {
        case "add": {
          sceneData.elements.push(...act.newElements);
          break;
        }

        case "delete": {
          const deleteIds = act.oldElements.map((i) => i.id);
          const deletedEles = remove(sceneData.elements, (ele) =>
            deleteIds.includes(ele.id)
          );
          if (deletedEles.length === 0) {
            res.status = "failed";
            res.info = "delete nothing";
          }
          break;
        }

        case "update": {
          act.newElements.forEach((newEle) => {
            const id = newEle.id,
              foundIdx = sceneData.elements.findIndex((e) => e.id === id);
            if (foundIdx === -1) {
              res.status = "failed";
              res.info = "not found element needing update in SceneData";
            } else {
              sceneData.elements[foundIdx] = newEle;
            }
          });
          break;
        }
      }
      return res;
    }

    window.ipcRenderer?.on("Alt`", AltToggleHandler);
    window.ipcRenderer?.on("Alt1", alt1Handler);
    window.ipcRenderer?.on("Alt2", alt2Handler);
    window.ipcRenderer?.on("Alt3", alt3Handler);
    window.ipcRenderer?.on("Alt4", alt4Handler);
    window.ipcRenderer?.on("Alt5", alt5Handler);
    window.ipcRenderer?.on("Alt6", alt6Handler);
    window.ipcRenderer?.on("Alt7", alt7Handler);
    window.ipcRenderer?.on("Alt8", alt8Handler);
    window.ipcRenderer?.on("AltC", altCHandler);
    window.ipcRenderer?.on("AltQ", altQHandler);
    window.ipcRenderer?.on("back", () => moveHead("back"));
    window.ipcRenderer?.on("forward", () => moveHead("forward"));

    window.ipcRenderer?.on("changeWindow", changeWorkspace);
    // window.ipcRenderer?.on("mouseWheel", globalScrollEle);
    // window.ipcRenderer?.on("mousedrag", mousedragHandler);
    return () => {
      window.ipcRenderer?.on("Alt`", AltToggleHandler);
      window.ipcRenderer?.off("Alt1", alt1Handler);
      window.ipcRenderer?.off("Alt2", alt2Handler);
      window.ipcRenderer?.off("Alt3", alt3Handler);
      window.ipcRenderer?.off("Alt4", alt4Handler);
      window.ipcRenderer?.off("Alt5", alt5Handler);
      window.ipcRenderer?.off("Alt6", alt6Handler);
      window.ipcRenderer?.off("Alt7", alt7Handler);
      window.ipcRenderer?.off("Alt8", alt8Handler);
      window.ipcRenderer?.off("AltC", altCHandler);
      window.ipcRenderer?.off("AltQ", altQHandler);
      window.ipcRenderer?.off("changeWindow", changeWorkspace);
      // window.ipcRenderer?.off("mouseWheel", globalScrollEle);
      // window.ipcRenderer?.off("mousedrag", mousedragHandler);
    };
  }, [sceneData, selectedKey, setSceneData, setSeletedKey]);

  async function globalScrollEle(e: any, wheelData: any) {
    if (selectedKey !== -1) return;
    const els = sceneData.elements;

    const delta = wheelData.delta;
    if (currentFocusedWindow && confirmedScrollPage) {
      if (currentFocusedWindow.title.includes("Chrome")) {
      } else if (currentFocusedWindow.title.includes("Cursor")) {
        els.forEach((e) => {
          e.position.y += delta * 50;
          e.rotateOrigin.y += delta * 50;

          e.boundary = [getBoundryPoly(e)!];
          e.excludeArea = getExcludeBoundaryPoly(e) ?? [];
        });
      }
    }

    redrawAllEles(undefined, undefined, els);

    if (debugDrawAllAreas) globalSynchronizer.value?.drawAllAreas();
  }

  useEffect(() => {
    // clear Shot
    sceneData.updatingElements.forEach((u) => {
      if (u.ele.type === DrawingType.shot) {
        const shot = u.ele as unknown as Shot;
        if (!shot.pined && !(selectedKey === 2 && shot.width !== -1)) {
          const i = sceneData.elements.findIndex((e) => (e as any) === shot);
          sceneData.elements.splice(i, 1);
          redrawAllEles(undefined, undefined, sceneData.elements);
        }
      }
    });

    sceneData.updatingElements = [];
    setSceneData({ ...sceneData });

    redrawAllEles(undefined, undefined, sceneData.elements);

    change2DefaultCursor();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setCursorSvg, selectedKey, size, eraserSize, colorIdx, color]);
  useEffect(() => {
    setTriggerAtom(canvasEventTrigger.current);
  }, [setTriggerAtom]);

  const mousePos = useMousePosition();
  function updateMouseTipPosition(e: MouseEvent) {
    const el = document.getElementsByClassName("shiftTip")[0] as HTMLElement;
    if (el) {
      el.style.left = e.clientX + 15 + "px";
      el.style.top = e.clientY + 15 + "px";
    }
  }

  function updateBottomPos(pt: PointZ) {
    const el = document.getElementsByClassName("bottomPanel")[0] as HTMLElement;
    if (el) {
      el.style.left = pt.x + "px";
      el.style.top = pt.y + "px";
    }
  }

  // Do some functions start and terminate
  useEffect(() => {
    terminateText();

    if (selectedKey === 6) {
      startText();
    }

    if (selectedKey !== -1) {
      unsetTransparent();
    } else {
      setTransparent();
    }
  }, [selectedKey]);

  useEffect(() => {
    window.addEventListener("keydown", globalKeydown);
    return () => {
      window.removeEventListener("keydown", globalKeydown);
    };
  }, [globalKeydown]);

  useEffect(() => {
    const wrapper = canvasEventTrigger.current!;
    wrapper.addEventListener("mousedown", detectElesInterceted);
    wrapper.addEventListener("mousedown", dragStart);

    wrapper.addEventListener("mouseup", dragEnd);

    wrapper.addEventListener("mousemove", detectHandles);
    wrapper.addEventListener("mousemove", dragMove);
    wrapper.addEventListener("mousemove", updateMouseTipPosition);

    return () => {
      wrapper.removeEventListener("mousedown", detectElesInterceted);
      wrapper.removeEventListener("mousedown", dragStart);

      wrapper.removeEventListener("mouseup", dragEnd);

      wrapper.removeEventListener("mousemove", detectHandles);
      wrapper.removeEventListener("mousemove", dragMove);
      wrapper.removeEventListener("mousemove", updateMouseTipPosition);
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
  const domElements = useMemo(() => <DomElements />, []);

  function cropImage(image, x, y, width, height) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(image, x, y, width, height, 0, 0, width, height);
    const imageData = canvas.toDataURL("image/png"); // Encode image as base64

    return imageData;
  }

  const handleSaveImgFinish = () => {
    if (settingValue[0]) {
      setSeletedKey(2);
    } else {
      setSeletedKey(7);
    }
  };
  window.ipcRenderer.on("saveImgFinish", handleSaveImgFinish);

  function copyShot() {
    const shot = sceneData.updatingElements[0].ele as any as Shot;
    window.ipcRenderer.send(
      "copyShot",
      cropImage(
        shot.screen,
        shot.position.x,
        shot.position.y,
        shot.realWidth,
        shot.realHeight
      )
    );
    cancelShot();
  }

  function saveShot() {
    const shot = sceneData.updatingElements[0].ele as any as Shot;
    const img = cropImage(
      shot.screen,
      shot.position.x,
      shot.position.y,
      shot.realWidth,
      shot.realHeight
    );

    window.ipcRenderer.send("saveImg", img);
    cancelShot();
  }

  function cancelShot() {
    sceneData.updatingElements.forEach((u) => {
      const shot = u.ele as unknown as Shot;
      const i = sceneData.elements.findIndex((e) => (e as any) === shot);
      sceneData.elements.splice(i, 1);
    });
    sceneData.updatingElements = [];

    setSceneData({ ...sceneData });
    redrawAllEles(undefined, undefined, sceneData.elements);
    setSeletedKey(-1);
  }

  function pinShot() {
    const shot = sceneData.updatingElements[0].ele as any as Shot;
    shot.pin();

    sceneData.updatingElements.length = 0;

    redrawAllEles(undefined, undefined, sceneData.elements);
    setSceneData({ ...sceneData });
  }

  function deleteTransfroming() {
    sceneData.updatingElements.forEach((u) => {
      const el = u.ele;
      const i = sceneData.elements.findIndex((e) => e === el);
      sceneData.elements.splice(i, 1);
    });
    sceneData.updatingElements.length = 0;
    redrawAllEles(undefined, undefined, sceneData.elements);
    setSceneData({ ...sceneData });
  }

  useEffect(() => {
    const transforming = sceneData.updatingElements[0];
    if (transforming) {
      if (
        transforming.ele.type === DrawingType.shot &&
        (transforming.ele as any as Shot).width !== -1 &&
        !(transforming.ele as any as Shot).pined
      ) {
        setShowShotPanel(true);
      }
    } else {
      setShowShotPanel(false);
    }
  }, [sceneData]);

  useEffect(() => {
    if (showShotPanel) {
      const transforming = sceneData.updatingElements[0];
      const shot = transforming.ele as any as Shot;
      const pos = new PointZ(
        shot.position.x,
        shot.position.y + shot.realHeight + 20
      );
      updateBottomPos(pos);
    }
  }, [showShotPanel]);

  return (
    <>
      <div
        ref={canvasEventTrigger}
        style={{
          cursor: cursorSvg ?? "default",
        }}
      >
        <DrawCanvas />
        {domElements}
      </div>
      <MainMenu />
      {showDebugPanel && (
        <div
          style={{
            color: "red",
            backgroundColor: "#ffffff",
            display: "inline-block",
            padding: "15px",
          }}
        >
          <div>{`updatingElements: ${sceneData.updatingElements.length}`}</div>
          <div>{`updatingEle position: ${sceneData.updatingElements[0]?.ele.position.x}, ${sceneData.updatingElements[0]?.ele.position.y}`}</div>
          <div>{`updatingEle scale: ${sceneData.updatingElements[0]?.ele.scale.x}, ${sceneData.updatingElements[0]?.ele.scale.y}`}</div>
          <div>{`updatingEle rotation: ${
            ((sceneData.updatingElements[0]?.ele.rotation ?? 0) * 180) / Math.PI
          }`}</div>
          <div>{`updatingEle rotationOrigin: ${sceneData.updatingElements[0]?.ele.rotateOrigin.x}, ${sceneData.updatingElements[0]?.ele.rotateOrigin.y}`}</div>
          <div>{`updatingEle polygon[0] orientation: ${
            sceneData.updatingElements[0]?.ele.boundary[0] &&
            [
              ...sceneData.updatingElements[0]?.ele.boundary[0].faces,
            ][0].orientation()
          }`}</div>
          <div>{`elements: ${sceneData.elements.length}`}</div>
          <div>{`mouse position: ${mousePos.x}, ${mousePos.y}`}</div>
          <div>{`handleOperator: ${currentHandle.current?.[1]}`}</div>
          <Button
            variant="contained"
            style={{ zIndex: "999", marginRight: "10px" }}
            onClick={() => {
              // @ts-ignore
              window.snapshots = window.snapshots ? window.snapshots : [];
              // @ts-ignore
              window.snapshots.push(cloneDeep(sceneData.elements));
            }}
          >
            save to window.snapshots
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              sscreenLog("");
            }}
          >
            clear screenLog
          </Button>
          <div>{screenLog} </div>
        </div>
      )}
      <DraggableTransparent
        horizontal={true}
        needBorder={true}
        needPadding={true}
        customCls="shiftTip"
        style={isShowShiftTip.current ? {} : { display: "none" }}
      >
        按住Shift键锁定比例
      </DraggableTransparent>
      {showShotPanel && (
        <DraggableTransparent
          horizontal={false}
          needBorder={true}
          needPadding={true}
          customCls="bottomPanel"
        >
          <div style={{ display: "flex" }}>
            <div {...stylex.props(btn.btnArea, btn.horizontalGap)}>
              <div
                {...stylex.props(btn.center)}
                id="btn"
                onMouseDown={deleteTransfroming}
              >
                <ReactSVG
                  src={Cancel}
                  useRequestCache={true}
                  beforeInjection={(svg) => {}}
                />
              </div>
            </div>
            <div {...stylex.props(btn.btnArea, btn.horizontalGap)}>
              <div {...stylex.props(btn.center)} id="btn" onMouseDown={pinShot}>
                <ReactSVG
                  src={Pin}
                  useRequestCache={true}
                  beforeInjection={(svg) => {}}
                />
              </div>
            </div>
            <div {...stylex.props(btn.btnArea, btn.horizontalGap)}>
              <div
                {...stylex.props(btn.center)}
                id="btn"
                onMouseDown={saveShot}
              >
                <ReactSVG
                  src={Save}
                  useRequestCache={true}
                  beforeInjection={(svg) => {}}
                />
              </div>
            </div>
            <div {...stylex.props(btn.btnArea, btn.horizontalGap)}>
              <div
                {...stylex.props(btn.center)}
                id="btn"
                onMouseDown={copyShot}
              >
                <ReactSVG
                  src={Copy}
                  useRequestCache={true}
                  beforeInjection={(svg) => {}}
                />
              </div>
            </div>
          </div>
        </DraggableTransparent>
      )}
    </>
  );

  function scaleOnMove(
    el: DrawingElement,
    dir: TransformHandle,
    oriHandles: Transform2DOperator | Transform2DOperatorLine,
    updatedScale: { x: number; y: number },
    oriScale: Point,
    diffY: number,
    updatedPt: { x: number; y: number },
    diffX: number,
    lockScale: boolean
  ) {
    const img = el as ImageElement;
    const offset = new Vector(diffX, diffY);
    let deltaVec: Vector;
    let pts: PointZ[], obx: Polygon;

    switch (el.type) {
      case DrawingType.freeDraw: {
        obx = (oriHandles as Transform2DOperator).rect.getSimplifyPolygon();
        pts = obx.vertices;
        break;
      }

      default: {
        obx = dragInfo.current!.originalBoundary!;
        pts = obx.vertices;
      }
    }

    switch (dir) {
      case TransformHandle.n: {
        const thirdEdge = [...obx.edges][3] as Edge;
        const dir = new Vector(thirdEdge.start, thirdEdge.end).normalize();

        const delta = offset.dot(dir);
        deltaVec = dir.scale(delta, delta);

        pts[0] = pts[0].translate(deltaVec!);
        pts[1] = pts[1].translate(deltaVec!);
        break;
      }

      case TransformHandle.ne: {
        // change the boundary of scaling image.

        const zerothEdge = [...obx.edges][0] as Edge;

        if (!zerothEdge) return;

        const thirdEdge = [...obx.edges][3] as Edge;
        if (!thirdEdge) return;

        const zeroDir = new Vector(
          zerothEdge.start,
          zerothEdge.end
        ).normalize();
        const thirdDir = new Vector(thirdEdge.start, thirdEdge.end).normalize();

        const scalar3 = offset.dot(thirdDir);
        const scalar0 = offset.dot(zeroDir);

        if (lockScale) {
          const leftBottom = cloneDeep(pts[3]);
          const scaleX =
            (zeroDir.scale(scalar0, scalar0).length * Math.sign(scalar0) +
              zerothEdge.length) /
            zerothEdge.length;
          pts = pts
            .map((p) => p.translate(-leftBottom.x, -leftBottom.y))
            .map((p) => p.rotate(-img.rotation))
            .map((p) => p.scale(scaleX, scaleX))
            .map((p) => p.rotate(img.rotation))
            .map((p) => p.translate(leftBottom.x, leftBottom.y));
        } else {
          pts[1] = pts[1].translate(offset);
          pts[0] = pts[0].translate(thirdDir.scale(scalar3, scalar3));
          pts[2] = pts[2].translate(zeroDir.scale(scalar0, scalar0));
        }

        break;
      }

      case TransformHandle.e: {
        const zorothEdge = [...obx.edges][0] as Edge;
        const dir = new Vector(zorothEdge.start, zorothEdge.end).normalize();
        const delta = offset.dot(dir);
        deltaVec = dir.scale(delta, delta);

        // change the boundary of scaling image.
        pts[1] = pts[1].translate(deltaVec!);
        pts[2] = pts[2].translate(deltaVec!);
        break;
      }

      case TransformHandle.se: {
        // change the boundary of scaling image.

        const secondEdge = [...obx.edges][0] as Edge;
        const thirdEdge = [...obx.edges][3] as Edge;

        const zeroDir = new Vector(
          secondEdge.start,
          secondEdge.end
        ).normalize();
        const thirdDir = new Vector(thirdEdge.end, thirdEdge.start).normalize();

        const scalar0 = offset.dot(zeroDir);
        const scalar3 = offset.dot(thirdDir);
        if (lockScale) {
          const leftTopPt = cloneDeep(pts[0]);
          const scaleX =
            (zeroDir.scale(scalar0, scalar0).length * Math.sign(scalar0) +
              secondEdge.length) /
            secondEdge.length;
          pts = pts
            .map((p) => p.translate(-leftTopPt.x, -leftTopPt.y))
            .map((p) => p.rotate(-img.rotation))
            .map((p) => p.scale(scaleX, scaleX))
            .map((p) => p.rotate(img.rotation))
            .map((p) => p.translate(leftTopPt.x, leftTopPt.y));
        } else {
          pts[2] = pts[2].translate(offset);
          pts[1] = pts[1].translate(zeroDir.scale(scalar0, scalar0));
          pts[3] = pts[3].translate(thirdDir.scale(scalar3, scalar3));
        }
        break;
      }

      case TransformHandle.s: {
        const secondEdge = [...obx.edges][1] as Edge;
        const dir = new Vector(secondEdge.start, secondEdge.end).normalize();
        const delta = offset.dot(dir);
        deltaVec = dir.scale(delta, delta);

        pts[2] = pts[2].translate(deltaVec!);
        pts[3] = pts[3].translate(deltaVec!);
        break;
      }

      case TransformHandle.sw: {
        // change the boundary of scaling image.

        const firstEdge = [...obx.edges][1] as Edge;
        const secondEdge = [...obx.edges][2] as Edge;

        const firstDir = new Vector(firstEdge.start, firstEdge.end).normalize();
        const secondDir = new Vector(
          secondEdge.start,
          secondEdge.end
        ).normalize();

        const scalar1 = offset.dot(firstDir);
        const scalar2 = offset.dot(secondDir);

        if (lockScale) {
          const rightTop = cloneDeep(pts[1]);
          const scaleX =
            (secondDir.scale(scalar2, scalar2).length * Math.sign(scalar2) +
              secondEdge.length) /
            secondEdge.length;
          pts = pts
            .map((p) => p.translate(-rightTop.x, -rightTop.y))
            .map((p) => p.rotate(-img.rotation))
            .map((p) => p.scale(scaleX, scaleX))
            .map((p) => p.rotate(img.rotation))
            .map((p) => p.translate(rightTop.x, rightTop.y));
        } else {
          pts[0] = pts[0].translate(secondDir.scale(scalar2, scalar2));
          pts[2] = pts[2].translate(firstDir.scale(scalar1, scalar1));
          pts[3] = pts[3].translate(offset);
        }

        break;
      }

      case TransformHandle.w: {
        const secondEdge = [...obx.edges][2] as Edge;
        const dir = new Vector(secondEdge.start, secondEdge.end).normalize();
        const delta = offset.dot(dir);
        deltaVec = dir.scale(delta, delta);

        pts[0] = pts[0].translate(deltaVec!);
        pts[3] = pts[3].translate(deltaVec!);

        break;
      }

      case TransformHandle.nw: {
        // change the boundary of scaling image.

        const zeroEdge = [...obx.edges][0] as Edge;
        const thirdEdge = [...obx.edges][3] as Edge;

        const zeroDir = new Vector(zeroEdge.end, zeroEdge.start).normalize();
        const thirdDir = new Vector(thirdEdge.start, thirdEdge.end).normalize();

        const scalar0 = offset.dot(zeroDir);

        const scalar3 = offset.dot(thirdDir);

        if (lockScale) {
          const rightBottom = cloneDeep(pts[2]);
          const scaleX =
            (zeroDir.scale(scalar0, scalar0).length * Math.sign(scalar0) +
              zeroEdge.length) /
            zeroEdge.length;
          pts = pts
            .map((p) => p.translate(-rightBottom.x, -rightBottom.y))
            .map((p) => p.rotate(-img.rotation))
            .map((p) => p.scale(scaleX, scaleX))
            .map((p) => p.rotate(img.rotation))
            .map((p) => p.translate(rightBottom.x, rightBottom.y));
        } else {
          pts[0] = pts[0].translate(offset);
          pts[3] = pts[3].translate(zeroDir.scale(scalar0, scalar0));
          pts[1] = pts[1].translate(thirdDir.scale(scalar3, scalar3));
        }
        break;
      }
    }

    if (
      el.type === DrawingType.img ||
      el.type === DrawingType.circle ||
      el.type === DrawingType.rectangle ||
      el.type === DrawingType.text ||
      el.type === DrawingType.shot
    ) {
      img.boundary[0] = new Polygon(pts);

      const rightEdge = [...img.boundary[0].edges][1] as Edge;
      const bottomEdge = [...img.boundary[0].edges][2] as Edge;
      updatedScale.y =
        (rightEdge.length *
          Math.sign(
            rightEdge.end.rotate(-img.rotation).y -
              rightEdge.start.rotate(-img.rotation).y
          )) /
        img.height;

      updatedScale.x =
        (bottomEdge.length *
          Math.sign(
            bottomEdge.start.rotate(-img.rotation).x -
              bottomEdge.end.rotate(-img.rotation).x
          )) /
        img.width;

      const rotateOrigin = new PointZ(img.rotateOrigin.x, img.rotateOrigin.y);
      const finalPos = img.boundary[0].vertices[0].rotate(
        -img.rotation,
        rotateOrigin
      );
      updatedPt.x = finalPos.x;
      updatedPt.y = finalPos.y;

      img.position = { x: updatedPt!.x, y: updatedPt!.y };
      img.scale = updatedScale;
    } else if (el.type === DrawingType.freeDraw) {
      const free = el as FreeDrawing;

      const scaledBox = new Polygon(pts);
      const stableBBX = free.oriBoundary[0].box;

      const rightEdge = [...scaledBox.edges][1] as Edge;
      const bottomEdge = [...scaledBox.edges][2] as Edge;
      updatedScale.y =
        (rightEdge.length *
          Math.sign(
            rightEdge.end.rotate(-free.rotation).y -
              rightEdge.start.rotate(-free.rotation).y
          )) /
        stableBBX.height;
      updatedScale.x =
        (bottomEdge.length *
          Math.sign(
            bottomEdge.start.rotate(-free.rotation).x -
              bottomEdge.end.rotate(-free.rotation).x
          )) /
        stableBBX.width;

      free.scale = updatedScale;
      const relativeBox = new Polygon(stableBBX);

      // change the position
      const rotateOrigin = new PointZ(free.rotateOrigin.x, free.rotateOrigin.y);
      const finalPos = pts[0]
        .rotate(-free.rotation, rotateOrigin)
        .translate(
          new Vector(-relativeBox.vertices[0].x, -relativeBox.vertices[0].y)
        );
      updatedPt.x = finalPos.x;
      updatedPt.y = finalPos.y;

      free.position = { x: updatedPt!.x, y: updatedPt!.y };
      // drawPolygonPointIndex(undefined, new Polygon(pts), "yellow", 10);
    }
  }
}

export default App;
