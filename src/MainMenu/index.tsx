// import cancel from "../images/svgs/cancel.svg";
// import copy from "../images/svgs/copy.svg";
// import highlighterPen from "../images/svgs/copy.svg";
// import laser from "../images/svgs/laser.svg";
// import save from "../images/svgs/save.svg";
// import { setTranspanrent, unsetTranspanrent } from "../commonUtils";
import { computePosition, flip } from "@floating-ui/dom";
import React, {
  Component,
  EventHandler,
  createRef,
  useEffect,
  useRef,
  useState,
} from "react";
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
interface IMenu {
  selectedKey: number;
  activeSelectedKey: number;
}
const styles = stylex.create({
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
});
const btnConfigs = [
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

class MainMenu extends Component {
  isDragging = false;
  state: IMenu = {
    selectedKey: -1,
    activeSelectedKey: -1,
  };
  render() {
    const btnsMark: JSX.Element[] = [];
    for (let i = 0; i < btnConfigs.length; i++) {
      btnsMark.push(
        <div
          {...stylex.props(
            styles.btnArea,
            this.state.selectedKey === i ? styles.selectedBtnArea : null
          )}
          key={i}
          id="btn"
          onClick={() => {
            this.setState({
              selectedKey: i,
            });
          }}
          onMouseEnter={(evt) => {
            this.setState({
              activeSelectedKey: i,
            });
          }}
        >
          <div {...stylex.props(styles.center)} id={`btnGrp-${i}`}>
            <ReactSVG
              src={btnConfigs[i].svg}
              useRequestCache={true}
              beforeInjection={(svg) => {
                if (this.state.selectedKey === i) {
                  svg
                    .getElementsByTagName("path")[0]
                    .setAttribute("fill", "#ffffff");
                }
              }}
            />
          </div>
        </div>
      );
    }
    return (
      <>
        <Draggable
          cancel="#btn"
          onDrag={() => {
            this.isDragging = true;
          }}
          onStop={() => {
            if (this.isDragging) {
              this.isDragging = false;
            }
          }}
        >
          <div
            {...stylex.props(styles.root)}
            // onMouseEnter={unsetTranspanrent}
            // onMouseLeave={() => {
            //   if (!this.isDragging) {
            //     setTranspanrent();
            //   }
            // }}
          >
            {btnsMark}
          </div>
        </Draggable>
        <div {...stylex.props(styles.subMenu)} id="subMenu">
          {btnConfigs[this.state.activeSelectedKey]?.subMenu?.()}
        </div>
      </>
    );
  }
  componentDidUpdate(prevState: Readonly<IMenu>): void {
    if (prevState.activeSelectedKey !== this.state.activeSelectedKey) {
      const reference = document.getElementById(
        `btnGrp-${this.state.activeSelectedKey}`
      );
      const floating = document.getElementById("subMenu");
      if (!reference || !floating) return;
      computePosition(reference, floating, {
        placement: "left",
        middleware: [flip()],
      }).then(({ x, y }) => {
        Object.assign(floating.style, {
          top: `${y}px`,
          left: `${x - 20}px`,
        });
      });
    }
  }
}
export default MainMenu;
