// import cancel from "../images/svgs/cancel.svg";
// import copy from "../images/svgs/copy.svg";
// import highlighterPen from "../images/svgs/copy.svg";
// import laser from "../images/svgs/laser.svg";
// import save from "../images/svgs/save.svg";
// import { setTransparent, unsetTransparent } from "../commonUtils";
import { computePosition } from "@floating-ui/dom";
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
import { NotePanel } from "../NotePanel";
import { PenPanel } from "../PenPanel";
import { SizeSlider } from "../SizeSlider";
import { ShapePanel } from "../ShapePanel";
import { ScreenShotPanel } from "../ScreenShotPanel";
import { SettingsPanel } from "../SettingsPanel";
import { BtnConfigs, Menu } from "./Menu";
import { DraggableTransparent } from "../components/DraggableTransparent";
import { nanoid } from "nanoid";
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
const configs: BtnConfigs = [
  {
    label: "画笔",
    svg: pen,
    key: "pen",
    subMenu: <PenPanel />,
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
  const [selectedKey, setSelectedKey] = useState(-1);
  const [hoveredKey, setHoveredKey] = useState(-1);


  // 当主菜单移动位置之后，需要清空子菜单draggable state, 这里直接重新生成一遍子菜单组件，合理的方式应该需要暴露子菜单的state，但draggalbe-react这个库并未提供这个功能
  const [subMenuDragCtrl, setSubMenuDragCtrl] = useState('');
  function updateSubMenuPosition() {
    if (hoveredKey === -1 || selectedKey === -1) return;
    const reference = btnRefs.current[selectedKey];
    if (!reference || !subMenuRef?.current) return;

    computePosition(reference, subMenuRef.current, {
      placement: "left",
      middleware: [],
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
      btnConfigs={configs}
      setParentHoverKey={setHoveredKey}
      setParentSelectedKey={setSelectedKey}
      setBtnsRef={(nodes: HTMLDivElement[]) => (btnRefs.current = nodes)}
      onDrag={() => {
        setSubMenuDragCtrl(nanoid())
      }}
    />{
      selectedKey !== -1 && configs[selectedKey].subMenu !== undefined
      ? (<DraggableTransparent horizontal={true} ref={subMenuRef} key={subMenuDragCtrl}>
            {configs[selectedKey].subMenu}
        </DraggableTransparent>)
      : null
    }
    </>
  );
}
export default MainMenu;
