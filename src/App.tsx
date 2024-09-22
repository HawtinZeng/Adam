import { Button } from "@mui/material";
import {
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
import { cloneDeep, merge, remove, throttle } from "lodash";
import { nanoid } from "nanoid";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { DomElements } from "src/CoreRenderer/DomElements";
import { DrawCanvas } from "src/CoreRenderer/DrawCanvas";
import {
  Transform2DOperator,
  TransformHandle,
} from "src/CoreRenderer/DrawCanvas/Transform2DOperator";
import {
  clearMainCanvas,
  drawCircle,
  redrawAllEles,
} from "src/CoreRenderer/DrawCanvas/core";
import { BackgroundCanvas } from "src/CoreRenderer/backgroundCanvas";
import { DrawingElement, ptIsContained } from "src/CoreRenderer/basicTypes";
import {
  CircleShapeElement,
  DrawingType,
  FreeDrawing,
  ImageElement,
  RectangleShapeElement,
  newFreeDrawingElement,
} from "src/CoreRenderer/drawingElementsTypes";
import MainMenu, { colorConfigs, menuConfigs } from "src/MainMenu";
import {
  getBoundryPoly,
  getExcludeBoundaryPoly,
} from "src/MainMenu/imageInput";
import { Point } from "src/Utils/Data/geometry";
import { setTransparent, unsetTransparent } from "src/commonUtils";
import { DraggableTransparent } from "src/components/DraggableTransparent";
import { Scene, UpdatingElement } from "src/drawingElements/data/scene";
import { useKeyboard } from "src/hooks/keyboardHooks";
import { useMousePosition } from "src/hooks/mouseHooks";
import { useDrawingOperator } from "src/hooks/useDrawingOperator";
import pointer from "src/images/svgs/mouse/pointer.svg";
import { ScreenShotter } from "src/screenShot/screenShotter";
import { logger } from "src/setup";
import { Action, History } from "src/state/history";
import {
  multipleScenes,
  multipleSynchronizer,
  sceneAtom,
} from "src/state/sceneState";
import { Synchronizer, globalSynchronizer } from "src/state/synchronizer";
import {
  bgCanvasAtom,
  brushRadius,
  canvasEventTriggerAtom,
  colorAtom,
  cursorSvgAtom,
  customColor,
  eraserRadius,
  selectedKeyAtom,
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

  const bg = useAtomValue(bgCanvasAtom)!;
  const [cursorSvg, setCursorSvg] = useAtom(cursorSvgAtom);
  const [selectedKey, setSeletedKey] = useAtom(selectedKeyAtom);

  const [sceneData, setSceneData] = useAtom(sceneAtom);

  const history = useRef<History>(new History());

  const currentHandle = useRef<[DrawingElement, TransformHandle] | null>(null);
  const isShowShiftTip = useRef<boolean>(false);
  const [currentKeyboard] = useKeyboard();
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
  useDrawingOperator();
  const size = useAtomValue(brushRadius) / 4;
  const eraserSize = useAtomValue(eraserRadius) / 4;

  const { startText, terminateText } = useTextFunction();

  const screenShotter = useRef<ScreenShotter>();

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

      // drag  itself
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
          originalBoundary: cloneDeep(img.boundary[0]),
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
          ele.boundary,
          ele.excludeArea,
          new PointZ(e.clientX, e.clientY)
        );
        if (isHit) {
          logger.log(isHit);
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
    throttle((e: MouseEvent) => {
      if (selectedKey !== 2) return;
      if (dragInfo.current) return;
      for (let i = 0; i < sceneData.updatingElements.length; i++) {
        const u = sceneData.updatingElements[i];
        const operator = u.handleOperator;
        if (operator) {
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
              currentHandle.current = [u.ele, handleOperator[handleIdx]];
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
        logger.log(isHit);
        if (isHit) {
          setCursorSvg("move");
        } else {
          change2DefaultCursor();
        }
      }
    }, 50),
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
        const ele = u!.ele;
        const offset = {
          x: e.clientX - startPos.x,
          y: e.clientY - startPos.y,
        };
        ele.position = {
          x: originalPt!.x + offset.x,
          y: originalPt!.y + offset.y,
        };

        ele.rotateOrigin = {
          x: originalRotateOrigin!.x + offset.x,
          y: originalRotateOrigin!.y + offset.y,
        };

        ele.boundary = getBoundryPoly(ele) ? [getBoundryPoly(ele)!] : [];

        ele.excludeArea = getExcludeBoundaryPoly(ele) ?? [];

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
        const lockScale = isShowShiftTip.current && currentKeyboard === "Shift";
        if (dir !== TransformHandle.ro) {
          if (
            el.type === DrawingType.img ||
            el.type === DrawingType.rectangle ||
            el.type === DrawingType.circle
          ) {
            scalingImg(
              el,
              dir,
              oriHandles,
              updatedScale,
              oriScale,
              diffY,
              updatedPt,
              diffX,
              lockScale
            );
          } else {
            // FreeDrawing
          }
        } else {
          if (
            el.type === DrawingType.img ||
            el.type === DrawingType.rectangle ||
            el.type === DrawingType.circle ||
            el.type === DrawingType.freeDraw
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

            const deltaRotation = originalLine.norm.angleTo(currentLine.norm);
            el.rotation = deltaRotation + originalRotation;

            el.boundary[0] = getBoundryPoly(el)!;
          }
        }
        setSceneData({ ...sceneData });
      }
    },
    [sceneData, setSceneData, currentKeyboard]
  );
  const drawAPoint = (p: Point) => {
    const newFreeElement = merge(cloneDeep(newFreeDrawingElement), {
      id: nanoid(),
      position: { x: 0, y: 0 },
      points: [{ x: p.x, y: p.y }],
    } as FreeDrawing);
    // default property
    const subMenuStrokeOption =
      menuConfigs[0]?.btnConfigs?.[selectedKey]?.strokeOptions;
    newFreeElement.strokeOptions = cloneDeep(subMenuStrokeOption!);

    // updated property, size是ui控件的直径
    if (newFreeElement.strokeOptions !== undefined) {
      newFreeElement.strokeOptions.size = size / 4;
      newFreeElement.strokeOptions.strokeColor =
        colorIdx !== -1 ? colorConfigs[colorIdx].key : color;
    }

    sceneData.elements.push(newFreeElement);
  };

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
          u.ele.type === DrawingType.circle) &&
        dragInfo.current.type === "resize"
      ) {
        const el = u.ele as
          | ImageElement
          | RectangleShapeElement
          | CircleShapeElement;
        const oldOrigin = dragInfo.current.originalHandles!.rect.center;
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
      }
      // resize & move
      setSceneData({ ...sceneData });
      dragInfo.current = null;
    }
  }, [sceneData, setSceneData]);

  // initialize adam
  useEffect(() => {
    // 第一次运行，会聚焦到 terminal 中，导致后续存放的 windowId 放到了 terminal 对应的 window 中
    setTransparent();
  }, []);
  useEffect(() => {
    function extensionScrollElementHandler(e, areaInfos: string) {
      console.log("extensionScrollElementHandler");
      const areaInfo = JSON.parse(areaInfos) as ElementRect;
      const b = new Box(
        areaInfo.offsetX,
        areaInfo.offsetY,
        areaInfo.offsetX + areaInfo.width,
        areaInfo.offsetY + areaInfo.height
      );

      try {
        if (!globalSynchronizer.value) return;
        globalSynchronizer.value.partition(sceneData, b);
      } catch (e) {}

      if (!globalSynchronizer.value) return;
      const needUpdating = globalSynchronizer.value.scrollTop(
        b,
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
    }
    window.ipcRenderer?.on("scrollElement", extensionScrollElementHandler);
    return () => {
      window.ipcRenderer?.off("scrollElement", extensionScrollElementHandler);
    };
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
        // initialize the window box, which will control all eles without area
        const b = new Box(
          currentFocusedWindow.bounds.x,
          currentFocusedWindow.bounds.y,
          currentFocusedWindow.bounds.x + currentFocusedWindow.bounds.width,
          currentFocusedWindow.bounds.y + currentFocusedWindow.bounds.height
        );
        globalSynchronizer.value.partition(
          {
            elements:
              multipleScenes.get(currentFocusedWindow.id)?.elements || [],
          },
          b
        );
      } else {
        globalSynchronizer.value = existSynchronizer;
      }

      const exist = multipleScenes.get(currentFocusedWindow.id);
      if (!exist) {
        const createdScene = new Scene([], [], []);
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
      (currentFocusedWindow?.containedWin === windowInfo.id ||
        !currentFocusedWindow?.title.includes("Chrome"))
    ) {
      globalSynchronizer.value.updateArea(
        new Box(
          windowInfo.bounds.x,
          windowInfo.bounds.y,
          windowInfo.bounds.x + windowInfo.bounds.width,
          windowInfo.bounds.y + windowInfo.bounds.height
        )
      );
      globalSynchronizer.value?.partition(sceneData);
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
    }
  }

  useEffect(() => {
    if (bg) screenShotter.current = new ScreenShotter(bg);
  }, [bg]);

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
     * 清理场景
     */
    const altCHandler = () => {
      sceneData.domElements.length = 0;
      sceneData.elements.length = 0;
      sceneData.frames.length = 0;
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
    window.ipcRenderer?.on("mouseWheel", globalScrollEles);
    window.ipcRenderer?.on("mousedrag", mousedragHandler);
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
      window.ipcRenderer?.off("mouseWheel", globalScrollEles);
      window.ipcRenderer?.off("mousedrag", mousedragHandler);
    };
  }, [sceneData, selectedKey, setSceneData, setSeletedKey]);

  async function globalScrollEles(e: any, wheelData: any) {
    if (selectedKey !== -1) return;
    const els = sceneData.elements;

    const delta = wheelData.delta;
    if (currentFocusedWindow && confirmedScrollPage) {
      if (currentFocusedWindow.title.includes("Chrome")) {
      } else if (currentFocusedWindow.title.includes("Cursor")) {
        els.forEach((e) => (e.position.y += delta * 50));
      }
    }

    redrawAllEles(undefined, undefined, els);
    if (debugDrawAllAreas) globalSynchronizer.value?.drawAllAreas();
  }
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
  function updateMouseTipPosition(e: MouseEvent) {
    const el = document.getElementsByClassName("shiftTip")[0] as HTMLElement;
    if (el) {
      el.style.left = e.clientX + 15 + "px";
      el.style.top = e.clientY + 15 + "px";
    }
  }

  // Do some functions start and terminate
  useEffect(() => {
    terminateText();
    if (screenShotter.current?.status !== "ending")
      screenShotter.current?.terminateScreenShot();

    if (selectedKey !== -1) {
      window.ipcRenderer.send("blurAdamWindow");
      window.ipcRenderer.send("checkWindow");
    }

    if (selectedKey === 6) {
      startText(colorIdx);
    } else if (selectedKey === 7) {
      screenShotter.current?.startScreenShot();
    }

    if (selectedKey !== -1) {
      unsetTransparent();
    } else {
      setTransparent();
    }
  }, [selectedKey, colorIdx]); // 不能依赖于start...terminate...
  useEffect(() => {
    window.addEventListener("keydown", globalKeydown);
    return () => window.removeEventListener("keydown", globalKeydown);
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
    globalKeydown,
  ]);
  const domElements = useMemo(() => <DomElements />, []);

  return (
    <>
      {useMemo(
        () => (
          <>
            <div
              ref={canvasEventTrigger}
              style={{
                cursor: cursorSvg ?? "default",
              }}
            >
              <BackgroundCanvas />
              <DrawCanvas />
              {domElements}
            </div>
            <MainMenu />
            {showDebugPanel && (
              <div style={{ color: "red" }}>
                <div>{`updatingElements: ${sceneData.updatingElements.length}`}</div>
                <div>{`updatingElements: ${JSON.stringify(
                  sceneData.updatingElements[0]
                )}`}</div>
                <div>{`updatingEle position: ${sceneData.updatingElements[0]?.ele.position.x}, ${sceneData.updatingElements[0]?.ele.position.y}`}</div>
                <div>{`updatingEle scale: ${sceneData.updatingElements[0]?.ele.scale.x}, ${sceneData.updatingElements[0]?.ele.scale.y}`}</div>
                <div>{`updatingEle rotation: ${sceneData.updatingElements[0]?.ele.rotation}`}</div>
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
                <div>{`height: ${bg?.height}`}</div>
                <Button
                  variant="contained"
                  size="large"
                  style={{ zIndex: "999" }}
                  onClick={() => {
                    // @ts-ignore

                    window.snapshots = window.snapshots ? window.snapshots : [];
                    // @ts-ignore
                    window.snapshots.push(cloneDeep(sceneData.elements));
                  }}
                >
                  保存到window.snapshots
                </Button>
              </div>
            )}
            {isShowShiftTip.current && (
              <DraggableTransparent
                horizontal={true}
                needBorder={true}
                needPadding={true}
                customCls="shiftTip"
              >
                按住Shift键锁定比例
              </DraggableTransparent>
            )}
          </>
        ),
        [cursorSvg, sceneData.elements, sceneData.updatingElements] // append mousePos to check real-time mouse position
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
    diffX: number,
    lockScale: boolean
  ) {
    const img = el as ImageElement;
    const offset = new Vector(diffX, diffY);
    let deltaVec: Vector;
    let pts = dragInfo.current!.originalBoundary!.vertices;
    switch (dir) {
      case TransformHandle.n: {
        const thirdEdge = [
          ...dragInfo.current!.originalBoundary!.edges,
        ][3] as Edge;
        const dir = new Vector(thirdEdge.start, thirdEdge.end).normalize();
        const delta = offset.dot(dir);
        deltaVec = dir.scale(delta, delta);

        pts[0] = pts[0].translate(deltaVec!);
        pts[1] = pts[1].translate(deltaVec!);

        break;
      }

      case TransformHandle.ne: {
        // change the boundary of scaling image.

        const zerothEdge = [
          ...dragInfo.current!.originalBoundary!.edges,
        ][0] as Edge;

        if (!zerothEdge) return;

        const thirdEdge = [
          ...dragInfo.current!.originalBoundary!.edges,
        ][3] as Edge;
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
        const zorothEdge = [
          ...dragInfo.current!.originalBoundary!.edges,
        ][0] as Edge;
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
        const secondEdge = [
          ...dragInfo.current!.originalBoundary!.edges,
        ][1] as Edge;
        const dir = new Vector(secondEdge.start, secondEdge.end).normalize();
        const delta = offset.dot(dir);
        deltaVec = dir.scale(delta, delta);

        pts[2] = pts[2].translate(deltaVec!);
        pts[3] = pts[3].translate(deltaVec!);
        break;
      }

      case TransformHandle.sw: {
        // change the boundary of scaling image.

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
        const secondEdge = [
          ...dragInfo.current!.originalBoundary!.edges,
        ][2] as Edge;
        const dir = new Vector(secondEdge.start, secondEdge.end).normalize();
        const delta = offset.dot(dir);
        deltaVec = dir.scale(delta, delta);

        pts[0] = pts[0].translate(deltaVec!);
        pts[3] = pts[3].translate(deltaVec!);

        break;
      }

      case TransformHandle.nw: {
        // change the boundary of scaling image.

        const zeroEdge = [
          ...dragInfo.current!.originalBoundary!.edges,
        ][0] as Edge;
        const thirdEdge = [
          ...dragInfo.current!.originalBoundary!.edges,
        ][3] as Edge;

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
  }
}

export default App;
