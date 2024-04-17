import { useCallback, useEffect, useMemo, useRef } from "react";
import stylex from "@stylexjs/stylex";
import { Btn } from "../components/Btn";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useAtomCallback } from "jotai/utils";
import {
  brushRadius,
  canvasAtom,
  colorAtom,
  customColor,
  selectedKeyAtom,
  selectedKeyAtomSubMenu,
} from "src/state/uiState";
import { colorConfigs, menuConfigs } from "src/mainMenu";
import { sceneAtom } from "src/state/sceneState";
import {
  FreeDrawing,
  newFreeDrawingElement,
} from "src/coreRenderer/drawingElementsTypes";
import { cloneDeep, merge } from "lodash";
import { nanoid } from "nanoid";
import { dist2 } from "src/coreRenderer/drawCanvas/vec";
import { BtnConfigs } from "src/mainMenu/menu";
import { debug } from "debug";
var log = debug("comp:startAnimationLoop");

export const penPanelStyles = stylex.create({
  horizontalPanel: {
    flexDirection: "row",
  },
  corner: {
    borderRadius: "5px",
  },
});

async function* nextFrame(fps) {
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

  const setSceneAtom = useSetAtom(sceneAtom);
  const size = useAtomValue(brushRadius);
  const color = useAtomValue(customColor);
  const colorIdx = useAtomValue(colorAtom);

  const sceneState = useAtomCallback(
    useCallback((get) => {
      const scene = get(sceneAtom);

      return scene;
    }, [])
  )();
  const [menuKey] = useAtom(selectedKeyAtom);

  const animationTasks = useRef<Function[]>([]);
  const isStop = useRef<boolean>(true);
  const penPanelMousedown = useCallback(
    (evt: MouseEvent) => {
      console.log("penPanelMousedown");
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
      sceneState.updatingElements.push(newFreeElement);
      if (
        (sceneState.updatingElements[0] as FreeDrawing)?.strokeOptions
          ?.haveTrailling
      ) {
        // with pressure in point
        newFreeElement.strokeOptions.simulatePressure = false;
        openAnimation();
      }

      // after mouseClick, draw a point immediately.
      if (sceneState.updatingElements[0]) {
        sceneState.updatingElements[0].points[0] = {
          x: evt.clientX,
          y: evt.clientY,
          pressure: 1,
          timestamp: new Date().getTime(),
        };
        setSceneAtom({ ...sceneState });
      }
    },
    [selectedKey, colorIdx, color, size]
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
    cvsEle?.addEventListener("mousedown", penPanelMousedown);
    cvsEle?.addEventListener("mousemove", penPanelMousemove);
    cvsEle?.addEventListener("mouseup", stopCurrentDrawing);
    cvsEle?.addEventListener("mouseleave", stopCurrentDrawing);
    return () => {
      cvsEle?.removeEventListener("mousedown", penPanelMousedown);
      cvsEle?.removeEventListener("mousemove", penPanelMousemove);
      cvsEle?.removeEventListener("mouseup", stopCurrentDrawing);
      cvsEle?.removeEventListener("mouseleave", stopCurrentDrawing);
    };
  }, [penPanelMousedown]); // [] 可用于仅执行一次逻辑, penPanelMousedown连续触发使用最新的值

  const startAnimationLoop = async () => {
    for await (const _ of nextFrame(60 /* fps */)) {
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
      sceneState.updatingElements[0].points.push({
        x: evt.clientX,
        y: evt.clientY,
        pressure: 1,
        timestamp: new Date().getTime(),
      });
      if (
        (sceneState.updatingElements[0] as FreeDrawing)?.strokeOptions
          ?.haveTrailling &&
        sceneState.updatingElements[0].points.length === 1 // 重新打开动画，防止点击之后，动画自动停止，再移动的话，需要重新打开动画
      ) {
        openAnimation();
      }

      setSceneAtom({ ...sceneState });
    }
  };

  const stopCurrentDrawing = (evt: MouseEvent) => {
    console.log("stopCurrentDrawing");
    if (sceneState.updatingElements.length > 0) {
      sceneState.updatingElements.length = 0;
    }
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
