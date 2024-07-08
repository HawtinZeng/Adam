import { computePosition, flip } from "@floating-ui/dom";
import stylex from "@stylexjs/stylex";
import { Point as PointZ } from "@zenghawtin/graph2d";
import { useAtom, useAtomValue } from "jotai";
import { nanoid } from "nanoid";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ptIsContained } from "src/CoreRenderer/basicTypes";
import { DrawingType } from "src/CoreRenderer/drawingElementsTypes";
import { BtnConfigs, Menu } from "src/MainMenu/Menu";
import { Eraser } from "src/MainMenu/eraser";
import { ImageInput } from "src/MainMenu/imageInput";
import { PenPanelComposal } from "src/MainMenu/penPanelCompose";
import { NotePanel } from "src/NotePanel/index";
import { SettingsPanel } from "src/SettingsPanel";
import { ShapePanelCompose } from "src/ShapePanel/shapePanelCompose";
import { DraggableTransparent } from "src/components/DraggableTransparent";
import { ScreenShotPanel } from "src/screenShot/ScreenShotPanel/index";
import { logger } from "src/setup";
import { sceneAtom } from "src/state/sceneState";
import { canvasEventTriggerAtom, selectedKeyAtom } from "src/state/uiState";
import { TextPanel } from "src/textPanel/textPanel";
import arrow from "../images/svgs/arrow.svg";
import brush from "../images/svgs/brush.svg";
import { default as circleShape } from "../images/svgs/circle.svg";
import eraser from "../images/svgs/eraser.svg";
import highlighterPen from "../images/svgs/highlighterPen.svg";
import image from "../images/svgs/iamge.svg";
import laser from "../images/svgs/laser.svg";
import note from "../images/svgs/note.svg";
import pen from "../images/svgs/pen.svg";
import screenShot from "../images/svgs/screenShot.svg";
import settings from "../images/svgs/settings.svg";
import arrowShape from "../images/svgs/shapeIcon/arrowShape.svg";
import lineShape from "../images/svgs/shapeIcon/lineShape.svg";
import squareShape from "../images/svgs/shapeIcon/squareShape.svg";
import textArea from "../images/svgs/textArea.svg";

export const mainMenu = stylex.create({
  subMenu: {
    position: "absolute",
  },
  multilineLayout: {
    display: "flex",
    flexDirection: "column",
  },
  brushRadiusSlider: {
    position: "absolute",
    right: "0",
    top: "-25%",
  },
  onelineFlex: {
    display: "flex",
  },
  selectedArrow: (isShow) => ({
    position: "absolute",
    width: "10px",
    height: "10px",
    borderTop: "5px solid transparent",
    borderBottom: "5px solid transparent",
    borderLeft: "5px solid transparent",
    borderRight: "5px solid #00a82f",
    visibility: isShow ? "visible" : "hidden",
  }),
});
export const colorLabel2Key = {
  橙色: "#f3b32a",
  黑色: "#3c4043",
};
export const colorConfigs: BtnConfigs = [
  {
    label: "黑色",
    key: colorLabel2Key["黑色"],
  },
  {
    label: "青色",
    key: "#238e9d",
  },
  {
    label: "绿色",
    key: "#699e3e",
  },
  {
    label: "橙色",
    key: colorLabel2Key["橙色"],
  },
  {
    label: "红色",
    key: "#d9453c",
  },
  {
    label: "黄色",
    key: "#fff385",
  },
];

export const penConfigs: BtnConfigs = [
  {
    label: "铅笔",
    svg: pen,
    key: "pen",
    strokeOptions: {
      size: 20,
      thinning: 0.7,
      start: {
        cap: true,
      },
      end: {
        cap: true,
      },
      isCtxStroke: false,
      smoothing: 0.9,
      streamline: 0.9,
      strokeColor: "#000000",
    },
  },
  {
    label: "高光笔",
    svg: highlighterPen,
    key: "highlighterPen",
    strokeOptions: {
      thinning: 1,
      size: 20,
      simulatePressure: false,
      start: {
        cap: true,
      },
      end: {
        cap: true,
      },
      isCtxStroke: false,
      smoothing: 0.9,
      streamline: 0.9,
      strokeColor: "#000000",
    },
  },
  {
    label: "毛笔",
    svg: brush,
    key: "brush",
    strokeOptions: {
      thinning: 0.7,
      size: 20,
      isCtxStroke: true,
      smoothing: 0.9,
      streamline: 0.9,
      strokeColor: "#000000",
    },
  },
  {
    label: "激光笔",
    svg: laser,
    key: "laser",
    strokeOptions: {
      thinning: 0.7,
      size: 20,
      smoothing: 0.8,
      streamline: 0.6,
      haveTrailling: true,
      strokeColor: "#000000",
    },
  },
];

export const shapeConfigs: BtnConfigs = [
  {
    label: "箭头",
    svg: arrowShape,
    key: DrawingType.arrow,
  },
  {
    label: "直线",
    svg: lineShape,
    key: DrawingType.polyline,
  },
  {
    label: "圆形",
    svg: circleShape,
    key: DrawingType.circle,
  },
  {
    label: "矩形",
    svg: squareShape,
    key: DrawingType.rectangle,
  },
];
export const menuConfigs: BtnConfigs = [
  {
    label: "画笔",
    svg: pen,
    key: "pen",
    subMenu: <PenPanelComposal />,
    btnConfigs: penConfigs,
  },
  {
    label: "橡皮",
    svg: eraser,
    key: "eraser",
    subMenu: <Eraser />,
    needBorder: false,
    needPadding: false,
  },
  {
    label: "选择",
    svg: arrow,
    key: "arrow",
  },
  {
    label: "便签",
    svg: note,
    key: "note",
    subMenu: <NotePanel />,
  },
  {
    label: "图片",
    svg: image,
    key: "image",
    subMenu: <ImageInput />,
  },
  {
    label: "形状",
    svg: arrowShape,
    key: "shape",
    subMenu: <ShapePanelCompose />,
    btnConfigs: shapeConfigs,
  },
  {
    label: "文字",
    svg: textArea,
    key: "textArea",
    subMenu: <TextPanel />,
  },
  {
    label: "截屏",
    svg: screenShot,
    key: "screenShot",
    subMenu: <ScreenShotPanel />,
  },
  {
    label: "设置",
    svg: settings,
    key: "settings",
    subMenu: <SettingsPanel />,
  },
];

function MainMenu() {
  const btnRefs = useRef<Array<HTMLDivElement>>([]);
  // console.log("re-render main menu");
  const canvasTrigger = useAtomValue(canvasEventTriggerAtom);
  const sceneState = useAtomValue(sceneAtom);

  const subMenuRef = useRef<HTMLElement>(null);
  // 全局状态
  const [selectedKey, setSelectedKey] = useAtom(selectedKeyAtom);
  const [hoveredKey, setHoveredKey] = useState(-1);
  // 当主菜单移动位置之后，需要清空子菜单draggable state, 这里接重新生成一遍子菜单组件，合理的方式应该需要暴露子菜单的state，但draggalbe-react这个库并未提供这个功能
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, setSubMenuDragCtrl] = useState("");
  const updateSubMenuPosition = useCallback(() => {
    if (hoveredKey === -1 || selectedKey === -1) return;
    const reference = btnRefs.current[selectedKey];
    if (!reference || !subMenuRef?.current) return;
    computePosition(reference, subMenuRef.current, {
      placement: "left",
      middleware: [flip()],
    }).then(({ x, y, placement }) => {
      Object.assign(subMenuRef.current!.style, {
        top: `${y}px`,
        left: placement === "right" ? `${x + 20}px` : `${x - 20}px`,
      });
    });
  }, [hoveredKey, selectedKey, btnRefs, subMenuRef]);

  const checkHit = useCallback(
    (e: MouseEvent) => {
      for (let i = sceneState.elements.length - 1; i >= 0; i--) {
        const ele = sceneState.elements[i];
        const isHit = ptIsContained(
          ele.boundary,
          ele.excludeArea,
          new PointZ(e.clientX, e.clientY)
        );
        if (isHit) {
          logger.log("hit");
          return true;
        }
      }
      // console.timeEnd("hit stroke...");
    },
    [sceneState.elements]
  );

  useEffect(() => {
    setSubMenuDragCtrl(nanoid());
  }, [selectedKey]);

  useEffect(() => {
    updateSubMenuPosition();
  }, [updateSubMenuPosition]);

  useEffect(() => {
    if (selectedKey === 2) {
      canvasTrigger?.addEventListener("mousedown", checkHit);
    }

    return () => {
      canvasTrigger?.removeEventListener("mousedown", checkHit);
    };
  }, [canvasTrigger, checkHit, sceneState, selectedKey]);

  return (
    <>
      <Menu
        btnConfigs={menuConfigs}
        setParentHoverKey={setHoveredKey}
        setParentSelectedKey={setSelectedKey}
        setBtnsRef={(nodes: HTMLDivElement[]) => (btnRefs.current = nodes)}
        onDrag={() => {
          setSubMenuDragCtrl(nanoid());
        }}
      />
      {selectedKey !== -1 && menuConfigs[selectedKey].subMenu !== undefined ? (
        <DraggableTransparent
          horizontal={true}
          ref={subMenuRef}
          needBorder={menuConfigs[selectedKey].needBorder ?? true}
          needPadding={menuConfigs[selectedKey].needPadding ?? true}
        >
          {menuConfigs[selectedKey].subMenu}
        </DraggableTransparent>
      ) : null}
    </>
  );
}
export default MainMenu;
