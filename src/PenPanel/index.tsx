import { Point as PointZ, Polygon } from "@zenghawtin/graph2d";
import { useAtom, useAtomValue } from "jotai";
import { cloneDeep, merge } from "lodash";
import mw from "magic-wand-tool";
import { nanoid } from "nanoid";
import { useCallback, useEffect, useRef } from "react";
import { drawingCanvasCache } from "src/CoreRenderer/DrawCanvas/canvasCache";
import { createDrawingCvs } from "src/CoreRenderer/DrawCanvas/core";
import { dist2 } from "src/CoreRenderer/DrawCanvas/vec";
import { Point } from "src/CoreRenderer/basicTypes";
import {
  FreeDrawing,
  newFreeDrawingElement,
} from "src/CoreRenderer/drawingElementsTypes";
import { colorConfigs, menuConfigs } from "src/MainMenu";
import { BtnConfigs } from "src/MainMenu/Menu";
import { UpdatingElement } from "src/drawingElements/data/scene";
import { sceneAtom } from "src/state/sceneState";
import {
  brushRadius,
  canvasAtom,
  canvasEventTriggerAtom,
  colorAtom,
  customColor,
  disableDrawingAtom,
  selectedKeyAtom,
  selectedKeyAtomSubMenu,
} from "src/state/uiState";
import { Btn } from "../components/Btn";
type ImageInfo = {
  width: number;
  height: number;
  context: CanvasRenderingContext2D;
  imageData: ImageData;
};

async function* nextFrame(fps: number) {
  let then = performance.now();
  const interval = 1000 / fps;
  let delta = 0;

  while (true) {
    let now = await new Promise(requestAnimationFrame);

    if (now - then < interval - delta) continue;
    delta = Math.min(interval, delta + now - then - interval);
    then = now;

    yield now;
  }
}

export function PenPanel(props: { btnConfigs: BtnConfigs }) {
  const { btnConfigs } = props;
  // 全局状态
  const [selectedKey, setSelectedKey] = useAtom(selectedKeyAtomSubMenu);
  const [cvsEle] = useAtom(canvasAtom);

  const [sceneState, setSceneAtom] = useAtom(sceneAtom);
  const size = useAtomValue(brushRadius);
  const color = useAtomValue(customColor);
  const colorIdx = useAtomValue(colorAtom);
  const cvsTrigger = useAtomValue(canvasEventTriggerAtom);

  const [menuKey] = useAtom(selectedKeyAtom);

  const animationTasks = useRef<Function[]>([]);
  const isStop = useRef<boolean>(true);
  const disableDrawing = useAtomValue(disableDrawingAtom);

  const penPanelMousedown = useCallback(
    (evt: MouseEvent) => {
      if (disableDrawing) return;
      const newFreeElement = merge(cloneDeep(newFreeDrawingElement), {
        id: nanoid(),
        position: { x: 0, y: 0 },
        points: [{ x: evt.clientX, y: evt.clientY }],
      } as FreeDrawing);

      // default property
      const subMenuStrokeOption =
        menuConfigs[menuKey]?.btnConfigs?.[selectedKey]?.strokeOptions;
      newFreeElement.strokeOptions = cloneDeep(subMenuStrokeOption!);

      // updated property, size是ui控件的直径
      newFreeElement.strokeOptions.size = size / 4;
      newFreeElement.strokeOptions.strokeColor =
        colorIdx !== -1 ? colorConfigs[colorIdx].key : color;

      // trigger DrawCanvas re-render
      sceneState.elements.push(newFreeElement);

      const newEleUpdating: UpdatingElement = {
        ele: newFreeElement,
        type: "addPoints",
        oriImageData: cvsEle!
          .getContext("2d", { willReadFrequently: true })!
          .getImageData(0, 0, cvsEle!.width, cvsEle!.height),
      };
      sceneState.updatingElements.push(newEleUpdating);
      if (
        (sceneState.updatingElements[0].ele as FreeDrawing)?.strokeOptions
          ?.haveTrailling
      ) {
        // with pressure in point
        newFreeElement.strokeOptions.simulatePressure = false;
        openAnimation();
      }

      // after mouseClick, draw a point immediately.
      if (sceneState.updatingElements[0]) {
        sceneState.updatingElements[0].ele.points[0] = {
          x: evt.clientX,
          y: evt.clientY,
          pressure: 1,
          timestamp: new Date().getTime(),
        };
        setSceneAtom(sceneState);
      }
    },
    [selectedKey, colorIdx, color, size, disableDrawing]
  );
  const traillingEffect = (lastIdx: number) => {
    const currentTime = new Date().getTime();
    let elePoints = sceneState.elements[lastIdx]?.points;

    let accumulatedDis = 0,
      len = elePoints.length,
      i = len - 1,
      stage = "body";
    for (; i >= 0; i--) {
      accumulatedDis += Math.sqrt(
        dist2(
          [
            elePoints[i + 1]?.x ?? elePoints[i].x,
            elePoints[i + 1]?.y ?? elePoints[i].y,
          ],
          [elePoints[i].x, elePoints[i].y]
        )
      );
      if (stage === "body") {
        elePoints[i].pressure! = Math.max(
          elePoints[i].pressure! -
            0.0001 * (currentTime - elePoints[i].timestamp!),
          0
        );
        if (accumulatedDis > 50) {
          accumulatedDis = 0;
          stage = "trailling";
        }
      } else if (stage === "trailling") {
        elePoints[i].pressure = Math.max(
          Math.min(
            1 - accumulatedDis / 500,
            elePoints[i].pressure! -
              0.0001 * (currentTime - elePoints[i].timestamp!)
          ),
          0
        );
      }
    }
    if (elePoints.length === 1) elePoints = [];
    elePoints = elePoints.filter((pt) => pt.pressure! > 0);

    sceneState.elements[lastIdx]!.points = [...elePoints];
    setSceneAtom({ ...sceneState });

    if (sceneState.elements[lastIdx]!.points.length === 0) {
      return "terminated";
    }
  };

  useEffect(() => {
    cvsTrigger?.addEventListener("mousedown", penPanelMousedown);
    cvsTrigger?.addEventListener("mousemove", penPanelMousemove);
    cvsTrigger?.addEventListener("mouseup", strokeOutlineStopCurrentDrawing);
    cvsTrigger?.addEventListener("mouseleave", strokeOutlineStopCurrentDrawing);
    return () => {
      cvsTrigger?.removeEventListener("mousedown", penPanelMousedown);
      cvsTrigger?.removeEventListener("mousemove", penPanelMousemove);
      cvsTrigger?.removeEventListener(
        "mouseup",
        strokeOutlineStopCurrentDrawing
      );
      cvsTrigger?.removeEventListener(
        "mouseleave",
        strokeOutlineStopCurrentDrawing
      );
    };
  }, [penPanelMousedown]); // [] 可用于仅执行一次逻辑, penPanelMousedown连续触发使用最新的值

  const startAnimationLoop = async () => {
    // @ts-ignore
    for await (const _ of nextFrame(60)) {
      if (isStop.current) {
        break;
      }
      const terminatedIndices: number[] = [];
      animationTasks.current.forEach((task, idx) => {
        const res = task();

        if (res === "terminated") {
          terminatedIndices.push(idx);
        }
      });

      if (terminatedIndices.length > 0) {
        animationTasks.current = animationTasks.current.filter(
          (_, idx) => !terminatedIndices.includes(idx)
        );
      }

      if (animationTasks.current.length === 0) isStop.current = true;
    }
  };

  const openAnimation = () => {
    const traillingEle = sceneState.elements.length - 1;
    animationTasks.current.push(traillingEffect.bind(undefined, traillingEle));
    isStop.current = false;
    startAnimationLoop();
  };

  const penPanelMousemove = (evt: MouseEvent) => {
    if (sceneState.updatingElements[0]) {
      sceneState.updatingElements[0].ele.points.push({
        x: evt.clientX,
        y: evt.clientY,
        pressure: 1,
        timestamp: new Date().getTime(),
      });
      if (
        (sceneState.updatingElements[0].ele as FreeDrawing)?.strokeOptions
          ?.haveTrailling &&
        sceneState.updatingElements[0].ele.points.length === 1 // 重新打开动画，防止点击之后，动画自动停止，再移动的话，需要重新打开动画
      ) {
        openAnimation();
      }

      setSceneAtom({ ...sceneState });
    }
  };

  const strokeOutlineStopCurrentDrawing = () => {
    if (sceneState.updatingElements.length > 0) {
      const drawingEle = sceneState.updatingElements[0].ele as FreeDrawing;
      let cvs = drawingCanvasCache.ele2DrawingCanvas.get(drawingEle)!;

      if (!cvs) {
        cvs = createDrawingCvs(drawingEle, cvsEle!)!;
      }

      const ctx = cvs.getContext("2d", { willReadFrequently: true })!;
      const imgd = ctx.getImageData(0, 0, cvs.width, cvs.height);
      const theFirstPt = drawingEle.points[0];

      if (theFirstPt)
        drawingEle.polygons =
          getAntArea(theFirstPt.x, theFirstPt.y, {
            width: cvs.width,
            height: cvs.height,
            context: ctx,
            imageData: imgd,
          }) ?? [];

      stopCurrentDrawing();
    }
  };

  const stopCurrentDrawing = () => {
    setSceneAtom(sceneState);
    setTimeout(() => {
      sceneState.updatingElements.length = 0;
    });
  };

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

export function getAntArea(
  x: number,
  y: number,
  imageInfo: ImageInfo,
  needStroke = false
) {
  const image = {
    data: imageInfo.imageData.data,
    width: imageInfo.width,
    height: imageInfo.height,
    bytes: 4,
  };

  const mask = mw.floodFill(image, x, y, 8, null, true);
  const ptsGrp = strokeTrace(mask, imageInfo, needStroke) as Array<{
    inner: boolean;
    label: number;
    points: Point[];
    initialCount: number;
  }>; // CCW是外轮廓，CW是洞

  const polygons: Polygon[] = [];
  ptsGrp.forEach((pts) => {
    const poly = new Polygon(pts.points.map((pt) => new PointZ(pt.x, pt.y)));
    polygons.push(poly);
  });
  return polygons;
}

function strokeTrace(mask: any, imageInfo: ImageInfo, needStroke: boolean) {
  var cs = mw.traceContours(mask);
  cs = mw.simplifyContours(cs, 4, 8);
  if (!needStroke) return cs;
  mask = null;
  // draw contours
  var ctx = imageInfo.context;
  ctx.clearRect(0, 0, imageInfo.width, imageInfo.height);
  //inner
  ctx.beginPath();
  for (var i = 0; i < cs.length; i++) {
    if (!cs[i].inner) continue;
    var ps = cs[i].points;
    ctx.moveTo(ps[0].x, ps[0].y);
    for (var j = 1; j < ps.length; j++) {
      ctx.lineTo(ps[j].x, ps[j].y);
    }
  }
  ctx.strokeStyle = "red";
  ctx.lineWidth = 2;
  ctx.stroke();
  //outer
  ctx.beginPath();
  for (var i = 0; i < cs.length; i++) {
    if (cs[i].inner) continue;
    var ps = cs[i].points;
    ctx.moveTo(ps[0].x, ps[0].y);
    for (var j = 1; j < ps.length; j++) {
      ctx.lineTo(ps[j].x, ps[j].y);
    }
  }
  ctx.strokeStyle = "blue";
  ctx.stroke();

  return cs;
}
