import { Point as PointZ, Polygon } from "@zenghawtin/graph2d";
import { useAtom, useAtomValue } from "jotai";
import { cloneDeep, merge } from "lodash";
import mw from "magic-wand-tool";
import { nanoid } from "nanoid";
import { useCallback, useEffect, useRef } from "react";
import { drawingCanvasCache } from "src/CoreRenderer/DrawCanvas/canvasCache";
import {
  createDrawingCvs,
  redrawAllEles,
} from "src/CoreRenderer/DrawCanvas/core";
import { dist2 } from "src/CoreRenderer/DrawCanvas/vec";
import { Point } from "src/CoreRenderer/basicTypes";
import {
  FreeDrawing,
  newFreeDrawingElement,
} from "src/CoreRenderer/drawingElementsTemplate";
import { colorConfigs, menuConfigs } from "src/MainMenu";
import { BtnConfigs } from "src/MainMenu/Menu";
import { nextFrame } from "src/animations/requestAniThrottle";
import { UpdatingElement } from "src/drawingElements/data/scene";
import { sceneAtom } from "src/state/sceneState";
import {
  canvasAtom,
  canvasEventTriggerAtom,
  colorAtom,
  customColor,
  screenLogAtom,
  selectedKeyAtom,
  settings,
  sizeAtom,
  subMenuIdx,
} from "src/state/uiState";
import { Btn } from "../components/Btn";

type ImageInfo = {
  width: number;
  height: number;
  context: CanvasRenderingContext2D;
  imageData: ImageData;
};

export function PenPanel(props: { btnConfigs: BtnConfigs }) {
  const { btnConfigs } = props;
  // 全局状态
  const [selectedKey, setSelectedKey] = useAtom(subMenuIdx);
  const [cvsEle] = useAtom(canvasAtom);

  const [sceneState, setSceneAtom] = useAtom(sceneAtom);

  const settingsValue = useAtomValue(settings);

  const size = useAtomValue(sizeAtom);
  const color = useAtomValue(customColor);
  const colorIdx = useAtomValue(colorAtom);
  const cvsTrigger = useAtomValue(canvasEventTriggerAtom);

  const [menuKey, setMenuKey] = useAtom(selectedKeyAtom);

  const animationTasks = useRef<Function[]>([]);
  const isStop = useRef<boolean>(true);
  const leftPressed = useRef<boolean>(false);

  const openAnimation = () => {
    const traillingEle = sceneState.elements.length - 1;
    animationTasks.current.push(traillingEffect.bind(undefined, traillingEle));
    isStop.current = false;
    startAnimationLoop();
  };

  const penPanelMousedown = useCallback(
    (evt: MouseEvent) => {
      leftPressed.current = true;
      const newFreeElement = merge(cloneDeep(newFreeDrawingElement), {
        id: nanoid(),
        position: { x: 0, y: 0 },
        points: [{ x: evt.clientX, y: evt.clientY }],
      } as FreeDrawing);

      // default property
      const subMenuStrokeOption =
        menuConfigs[menuKey]?.btnConfigs?.[selectedKey]?.strokeOptions;
      newFreeElement.strokeOptions = cloneDeep(subMenuStrokeOption!);
      newFreeElement.strokeColor =
        colorIdx !== -1 ? colorConfigs[colorIdx].key : color;
      // updated property, size是ui控件的直径
      if (newFreeElement.strokeOptions)
        newFreeElement.strokeOptions.size = size / 4;

      // trigger DrawCanvas re-render
      sceneState.elements.push(newFreeElement);

      if (sceneState.updatingElements[0]) {
        const old = sceneState.updatingElements[0];
        const oldIdx = sceneState.elements.findIndex((e) => old.ele === e);
        if (oldIdx !== -1) sceneState.elements.splice(oldIdx, 1);
        redrawAllEles(undefined, undefined, sceneState.elements);
      }

      const newEleUpdating: UpdatingElement = {
        ele: newFreeElement,
        type: "addPoints",
        oriImageData: cvsEle!
          .getContext("2d", { willReadFrequently: true })!
          .getImageData(0, 0, cvsEle!.width, cvsEle!.height),
      };
      sceneState.updatingElements[0] = newEleUpdating;
      if (
        (
          sceneState.updatingElements[sceneState.updatingElements.length - 1]
            .ele as FreeDrawing
        )?.strokeOptions?.haveTrailling
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
    [
      menuKey,
      selectedKey,
      colorIdx,
      color,
      size,
      sceneState,
      cvsEle,
      openAnimation,
      setSceneAtom,
    ]
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
        if (accumulatedDis > 350) {
          accumulatedDis = 0;
          stage = "trailling";
        }
      } else if (stage === "trailling") {
        elePoints[i].pressure = Math.max(
          Math.min(
            1 - accumulatedDis / 100,
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
  }, [cvsTrigger, penPanelMousedown]); // [] 可用于仅执行一次逻辑, penPanelMousedown连续触发使用最新的值

  const [screenLog, sscreenLog] = useAtom(screenLogAtom);
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

      if (animationTasks.current.length === 0) {
        isStop.current = true;
      }
    }
  };

  const penPanelMousemove = (evt: MouseEvent) => {
    if (leftPressed.current === true) {
      const currentDrawing = sceneState.updatingElements[
        sceneState.updatingElements.length - 1
      ]?.ele as FreeDrawing;
      currentDrawing?.points.push({
        x: evt.clientX,
        y: evt.clientY,
        pressure: 1,
        timestamp: new Date().getTime(),
      });
      if (
        currentDrawing?.strokeOptions?.haveTrailling &&
        currentDrawing.points.length === 1 // 重新打开动画，防止点击之后，动画自动停止，再移动的话，需要重新打开动画
      ) {
        openAnimation();
      }

      setSceneAtom({ ...sceneState });
    }
  };

  const strokeOutlineStopCurrentDrawing = () => {
    leftPressed.current = false;
    if (sceneState.updatingElements.length > 0) {
      stopCurrentDrawing();
    }
  };

  const stopCurrentDrawing = () => {
    setTimeout(() => {
      const drawingEle = sceneState.updatingElements[
        sceneState.updatingElements.length - 1
      ]?.ele as FreeDrawing;
      if (!drawingEle) return;

      sceneState.elements.push(drawingEle);
      const cvs = createDrawingCvs(drawingEle, cvsEle!)!;
      drawingCanvasCache.ele2DrawingCanvas.set(drawingEle, cvs);

      if (!cvs) return; // for laser brush

      const ctx = cvs.getContext("2d", { willReadFrequently: true })!;
      const imgd = ctx.getImageData(0, 0, cvs.width, cvs.height);
      const theFirstPt = drawingEle.points[0];

      if (theFirstPt) {
        const allPols =
          getAntArea(theFirstPt.x, theFirstPt.y, {
            width: cvs.width,
            height: cvs.height,
            context: ctx,
            imageData: imgd,
          }) ?? [];

        // sscreenLog(JSON.stringify(allPols[1]));

        if (allPols[0]) {
          drawingEle.boundary = allPols[0];
          drawingEle.oriBoundary = cloneDeep(allPols[0]);
          drawingEle.rotateOrigin = drawingEle.boundary[0].box.center;
          drawingEle.scaleOrigin = new PointZ(
            drawingEle.boundary[0].box.xmin,
            drawingEle.boundary[0].box.ymin
          );
        }

        if (allPols[1]) {
          drawingEle.excludeArea = allPols[1];
          drawingEle.oriexcludeArea = allPols[1];
        }
      }
      if (
        !sceneState.updatingElements.find(
          (u) => (u.ele as FreeDrawing)?.strokeOptions?.haveTrailling
        )
      )
        sceneState.updatingElements.length = 0;
      // setSceneAtom({ ...sceneState });
      redrawAllEles(undefined, undefined, sceneState.elements);
      if (settingsValue[0]) {
        setMenuKey(2);
      }
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
  }>; // CW是外轮廓，CWW是洞

  const polygons: Polygon[] = [];
  const excludePols: Polygon[] = [];

  ptsGrp.forEach((pts) => {
    if (pts.points.length < 3) return; // TODO, 将点判空逻辑挪到Graph2D中去
    const poly = new Polygon(pts.points.map((pt) => new PointZ(pt.x, pt.y)));
    if (pts.inner) {
      excludePols.push(poly);
    } else {
      polygons.push(poly.reverse());
    }
  });

  return [polygons, excludePols];
}

function strokeTrace(mask: any, imageInfo: ImageInfo, needStroke: boolean) {
  var cs = mw.traceContours(mask);
  cs = mw.simplifyContours(cs, 4, 8);
  if (!needStroke) return cs;
  mask = null;
  // draw contours
  var ctx = imageInfo.context;
  ctx.clearRect(0, 0, imageInfo.width, imageInfo.height);
  // inner
  ctx.beginPath();
  for (let i = 0; i < cs.length; i++) {
    if (cs[i].inner) continue;

    var ps = cs[i].points;
    ctx.moveTo(ps[0].x, ps[0].y);
    for (let j = 1; j < ps.length; j++) {
      // drawCircle(null, new Circle(new PointZ(ps[j].x, ps[j].y), 3));
      ctx.lineTo(ps[j].x, ps[j].y);
    }
  }
  ctx.strokeStyle = "red";
  ctx.lineWidth = 2;
  ctx.stroke();
  //outer
  ctx.beginPath();
  for (let i = 0; i < cs.length; i++) {
    if (!cs[i].inner) continue;
    let ps = cs[i].points;
    ctx.moveTo(ps[0].x, ps[0].y);
    for (let j = 1; j < ps.length; j++) {
      ctx.lineTo(ps[j].x, ps[j].y);
    }
  }
  ctx.strokeStyle = "blue";
  ctx.stroke();

  return cs;
}
