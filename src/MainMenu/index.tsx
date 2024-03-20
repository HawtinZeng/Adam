// import cancel from "../images/svgs/cancel.svg";
// import copy from "../images/svgs/copy.svg";
// import highlighterPen from "../images/svgs/copy.svg";
// import laser from "../images/svgs/laser.svg";
// import save from "../images/svgs/save.svg";
// import { setTranspanrent, unsetTranspanrent } from "../commonUtils";
import { computePosition, flip } from "@floating-ui/dom";
import React, { Component, useRef, useState } from "react";
import { ReactSVG } from "react-svg";
import stylex from "@stylexjs/stylex";
import Draggable from "react-draggable";
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
import { SizeSlider } from "../SizeSlider";
import { ShapePanel } from "../ShapePanel";
import { ScreenShotPanel } from "../ScreenShotPanel";
import { SettingsPanel } from "../SettingsPanel";
import { Menu } from "../components/Menu";
export const mainStyles = stylex.create({
  root: {
    backgroundColor: "#ffffff",
    borderRadius: "32px",
    border: "2px solid #898989",
    padding: "9px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  center: {
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  btnArea: {
    height: "46px",
    width: "46px",
    marginBottom: {
      default: "10px",
      ":last-child": "0px",
    },
    borderRadius: "50%",
    backgroundColor: {
      default: "#ffffff",
      ":hover": "#eaeaeb",
    },
  },
  selectedBtnArea: {
    backgroundColor: "#4b4f52",
  },
  subMenu: {
    position: "absolute",
    background: "gray",
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
const configs = [
  {
    label: "画笔",
    svg: pen,
    key: "pen",
    subMenu: NotePanel,
  },
  {
    label: "橡皮",
    svg: eraser,
    key: "eraser",
    subMenu: SizeSlider,
  },
  {
    label: "选择",
    svg: arrow,
    key: "arrow",
    subMenu: null,
  },
  {
    label: "便签",
    svg: note,
    key: "note",
    subMenu: NotePanel,
  },
  {
    label: "图片",
    svg: image,
    key: "image",
    subMenu: null,
  },
  {
    label: "圆圈",
    svg: circle,
    key: "circle",
    subMenu: ShapePanel,
  },
  {
    label: "文字",
    svg: textArea,
    key: "textArea",
    subMenu: null,
  },
  {
    label: "截屏",
    svg: screenShot,
    key: "screenShot",
    subMenu: ScreenShotPanel,
  },
  {
    label: "设置",
    svg: settings,
    key: "settings",
    subMenu: SettingsPanel,
  },
];

export function MainMenu() {
  const isDragging = false;
  const btnRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [selectedKey, setSelectedKey] = useState(-1);
  const [hoveredKey, setHoveredKey] = useState(-1);
  return (
    <>
      <Menu
        btnConfigs={configs}
        setParentHoverKey={setHoveredKey}
        setParentSelectedKey={setSelectedKey}
        genBtnRef={(node: HTMLDivElement | null) =>
          (btnRefs.current[btnRefs.current.length] = node)
        }
      />
      <div {...stylex.props(mainStyles.subMenu)} id="subMenu">
        {/* {configs[this.state.hoveredKey]?.subMenu?.()} */}
      </div>
    </>
  );
  // componentDidUpdate(prevState: Readonly<IMenu>): void {
  // if (prevState.hoveredKey !== this.state.hoveredKey) {
  //   const reference = document.getElementById(
  //     `btnGrp-${this.state.hoveredKey}`
  //   );
  //   const subMenu = document.getElementById("subMenu");
  //   const arrow = document.getElementById("selectedArrow");
  //   if (!reference || !subMenu) return;
  //   computePosition(reference, subMenu, {
  //     placement: "left",
  //     middleware: [flip()],
  //   }).then(({ x, y }) => {
  //     Object.assign(subMenu.style, {
  //       top: `${y}px`,
  //       left: `${x - 20}px`,
  //     });
  //   });
  //   if (!arrow) return;
  //   computePosition(reference, arrow, {
  //     placement: "left",
  //   }).then(({ x, y }) => {
  //     if (this.state.hoveredKey === this.state.selectedKey)
  //       Object.assign(arrow.style, {
  //         top: `${y}px`,
  //         left: `${x - 2}px`,
  //       });
  //   });
  // }
  // }
}
export default MainMenu;
