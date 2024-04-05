// import cancel from "../images/svgs/cancel.svg";
// import copy from "../images/svgs/copy.svg";
// import highlighterPen from "../images/svgs/copy.svg";
// import laser from "../images/svgs/laser.svg";
// import save from "../images/svgs/save.svg";
// import { setTransparent, unsetTransparent } from "../commonUtils";
import { computePosition, flip } from "@floating-ui/dom";
import React, { useEffect, useRef, useState } from "react";
import stylex from "@stylexjs/stylex";
import pen from "../images/svgs/pen.svg";
import eraser from "../images/svgs/eraser.svg";
import arrow from "../images/svgs/arrow.svg";
import circle from "../images/svgs/circle.svg";
import image from "../images/svgs/iamge.svg";
import note from "../images/svgs/note.svg";
import screenShot from "../images/svgs/screenShot.svg";
import settings from "../images/svgs/settings.svg";
import textArea from "../images/svgs/textArea.svg";
import { setTransparent, unsetTransparent } from "../commonUtils";
import { BtnConfigs } from "../mainMenu/menu";
import highlighterPen from "../images/svgs/highlighterPen.svg";
import brush from "../images/svgs/brush.svg";
import laser from "../images/svgs/laser.svg";
import { nanoid } from "nanoid";
import { SizeSlider } from "src/sizeSlider/index";
import { PenPanel } from "src/penPanel/index";
import { Menu } from "src/mainMenu/menu";
import { NotePanel } from "src/notePanel/index";
import { ShapePanel } from "src/shapePanel/index";
import { ScreenShotPanel } from "src/screenShotPanel/index";
import { DraggableTransparent } from "src/components/DraggableTransparent";
import { SettingsPanel } from "src/settingsPanel";
import { selectedKeyAtom } from "src/state/uiState";
import { useAtom } from "jotai";
export const mainMenu = stylex.create({
  subMenu: {
    position: "absolute",
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
export const penConfigs: BtnConfigs = [
  {
    label: "铅笔",
    svg: pen,
    key: "pen",
    strokeOptions: {
      size: 20,
      thinning: 0.7,
      start: {
        taper: 49,
        cap: true,
      },
      end: {
        taper: 55,
        cap: true,
      },
      isCustom: false,
      smoothing: 0.9,
      streamline: 0.9,
    },
  },
  {
    label: "高光笔",
    svg: highlighterPen,
    key: "highlighterPen",
    strokeOptions: {
      size: 20,
      simulatePressure: false,
      start: {
        cap: true,
        easing: () => 1,
      },
      end: {
        cap: true,
        easing: () => 1,
      },
      isCustom: false,
      smoothing: 0.9,
      streamline: 0.9,
    },
  },
  {
    label: "毛笔",
    svg: brush,
    key: "brush",
    strokeOptions: {
      size: 20,
      isCustom: true,
      smoothing: 0.9,
      streamline: 0.9,
    },
  },
  {
    label: "激光笔",
    svg: laser,
    key: "laser",
    strokeOptions: {
      size: 20,
      smoothing: 0.9,
      streamline: 0.9,
      needFadeOut: true,
    },
  },
];
export const menuConfigs: BtnConfigs = [
  {
    label: "画笔",
    svg: pen,
    key: "pen",
    subMenu: <PenPanel btnConfigs={penConfigs} />,
    btnConfigs: penConfigs,
  },
  {
    label: "橡皮",
    svg: eraser,
    key: "eraser",
    subMenu: <SizeSlider />,
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
  },
  {
    label: "圆圈",
    svg: circle,
    key: "circle",
    subMenu: <ShapePanel />,
  },
  {
    label: "文字",
    svg: textArea,
    key: "textArea",
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

export function MainMenu() {
  const btnRefs = useRef<Array<HTMLDivElement>>([]);
  const subMenuRef = useRef<HTMLElement>(null);
  // 全局状态
  const [selectedKey, setSelectedKey] = useAtom(selectedKeyAtom);

  const [hoveredKey, setHoveredKey] = useState(-1);
  // 当主菜单移动位置之后，需要清空子菜单draggable state, 这里直接重新生成一遍子菜单组件，合理的方式应该需要暴露子菜单的state，但draggalbe-react这个库并未提供这个功能
  const [subMenuDragCtrl, setSubMenuDragCtrl] = useState("");
  function updateSubMenuPosition() {
    if (hoveredKey === -1 || selectedKey === -1) return;
    const reference = btnRefs.current[selectedKey];
    if (!reference || !subMenuRef?.current) return;

    computePosition(reference, subMenuRef.current, {
      placement: "left",
      middleware: [flip()],
    }).then(({ x, y }) => {
      Object.assign(subMenuRef!.current!.style, {
        top: `${y}px`,
        left: `${x - 20}px`,
      });
    });
  }
  useEffect(() => {
    setSubMenuDragCtrl(nanoid());
  }, [selectedKey]);
  useEffect(() => {
    updateSubMenuPosition();
  }, [subMenuDragCtrl]);
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
          key={subMenuDragCtrl}
        >
          {menuConfigs[selectedKey].subMenu}
        </DraggableTransparent>
      ) : null}
    </>
  );
}
export default MainMenu;
