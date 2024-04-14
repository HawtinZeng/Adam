import { useCallback, useEffect, useRef } from "react";
import stylex from "@stylexjs/stylex";
import { Btn } from "../components/Btn";
import { useAtom, useAtomValue } from "jotai";
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
  const [sceneState, setSceneAtom] = useAtom(sceneAtom);

  // useAtomCallback to retrive new atom value, but don't trigger re-excution of component function.
  const size = useAtomValue(brushRadius);
  const color = useAtomValue(customColor);
  const colorIdx = useAtomValue(colorAtom);

  const [menuKey] = useAtom(selectedKeyAtom);

  const animationTasks = useRef<Function[]>([]);
  const isStop = useRef<boolean>(true);

  const penPanelMousedown = useCallback(
    (evt: MouseEvent) => {
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
          ?.needFadeOut
      ) {
        const fadeoutEle = sceneState.elements.length - 1;
        let timer: NodeJS.Timeout | null = setTimeout(() => {
          animationTasks.current.push(fadeout.bind(undefined, fadeoutEle));
          if (isStop.current) {
            isStop.current = false;
            startAnimationLoop();
          }
          clearTimeout(timer!);
          timer = null;
        }, 500);
      }
    },
    [selectedKey, colorIdx, color, size]
  );
  const fadeout = useCallback(
    (lastIdx: number) => {
      const elePoints = sceneState.elements[lastIdx]?.points;
      if (elePoints === undefined || elePoints.length === 0) {
        return "terminated";
      }

      if (sceneState.elements[lastIdx].opacity < 0.05) {
        setSceneAtom({ ...sceneState });
        elePoints.length = 0;
        return "terminated";
      }
      let distance = 0,
        cutPointIdx = 0;
      while (distance < 100 && cutPointIdx + 1 < elePoints.length) {
        distance += dist2(
          [elePoints[cutPointIdx].x, elePoints[cutPointIdx].y],
          [elePoints[cutPointIdx + 1].x, elePoints[cutPointIdx + 1].y]
        );
        cutPointIdx++;
      }
      if (cutPointIdx + 1 >= elePoints.length) elePoints.length = 0;
      else elePoints.splice(0, cutPointIdx);
      setSceneAtom({ ...sceneState });
      sceneState.elements[lastIdx].opacity *= 0.9;
    },
    [sceneState]
  );

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

  useEffect(() => {
    if (selectedKey !== 3) {
      isStop.current = true;
      animationTasks.current.length = 0;
      sceneState.elements = sceneState.elements.filter(
        (ele) => !(ele as FreeDrawing).strokeOptions.needFadeOut
      );
      setSceneAtom({ ...sceneState });
    }
  }, [selectedKey]);

  const startAnimationLoop = async () => {
    for await (const _ of nextFrame(8 /* fps */)) {
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

  const penPanelMousemove = (evt: MouseEvent) => {
    if (sceneState.updatingElements[0]) {
      sceneState.updatingElements[0].points.push({
        x: evt.clientX,
        y: evt.clientY,
      });
      setSceneAtom({ ...sceneState });
    }
  };

  const stopCurrentDrawing = (evt: MouseEvent) => {
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
