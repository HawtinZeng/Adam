import React, { MutableRefObject, useEffect, useRef, useState } from "react";
import { Component } from "react";
import Draggable from "react-draggable";
import stylex from "@stylexjs/stylex";
import { ReactSVG } from "react-svg";
import { unsetTranspanrent, setTranspanrent } from "../commonUtils";
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
    background: "#3c4043",
  },
  selectedArrow: (isShow) => ({
    position: "absolute",
    left: "-3%",
    width: "10px",
    height: "10px",
    borderTop: "5px solid transparent",
    borderBottom: "5px solid transparent",
    borderLeft: "5px solid transparent",
    borderRight: "5px solid #80868b",
    visibility: isShow ? "visible" : "hidden",
  }),
});
export function Menu(props: {
  btnConfigs: Array<{
    label: string;
    svg: any;
    key: string;
    subMenu: (() => JSX.Element) | null;
  }>;
  setParentHoverKey: ((k: number) => void) | null;
  setParentSelectedKey: ((k: number) => void) | null;
  setBtnsRef: (node: HTMLDivElement[]) => void;
}) {
  let isDragging = false;
  const { setParentSelectedKey, setParentHoverKey, setBtnsRef } = props;
  const [selectedKey, setSelectedKey] = useState(-1);
  const [hoveredKey, setHoveredKey] = useState(-1);

  const btnsMark: JSX.Element[] = [];
  const { btnConfigs } = props;
  useEffect(() => {
    setParentSelectedKey?.(selectedKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKey]);
  useEffect(() => setSelectedKey?.(selectedKey), [selectedKey]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setParentHoverKey?.(hoveredKey), [hoveredKey]);
  const nodes: HTMLDivElement[] = [];
  for (let i = 0; i < btnConfigs.length; i++) {
    btnsMark.push(
      <div
        {...stylex.props(
          mainStyles.btnArea,
          selectedKey === i ? mainStyles.selectedBtnArea : null
        )}
        key={i}
        id="btn"
        onClick={() => {
          setSelectedKey(i);
        }}
        onMouseEnter={(evt) => {
          setHoveredKey(i);
        }}
        ref={(node) => node && nodes.push(node)}
      >
        <div
          {...stylex.props(mainStyles.center)}
          onMouseEnter={unsetTranspanrent}
          onMouseLeave={setTranspanrent}
        >
          <ReactSVG
            src={btnConfigs[i].svg}
            useRequestCache={true}
            beforeInjection={(svg) => {
              if (selectedKey === i) {
                svg
                  .getElementsByTagName("path")[0]
                  .setAttribute("fill", "#ffffff");
              }
            }}
          />
          <span
            {...stylex.props(
              mainStyles.selectedArrow(btnConfigs[i].subMenu !== null)
            )}
            id="selectedArrow"
          ></span>
        </div>
      </div>
    );
  }
  setBtnsRef(nodes);
  return (
    <>
      <Draggable
        cancel="#btn"
        onDrag={() => {
          isDragging = true;
        }}
        onStop={() => {
          if (isDragging) {
            isDragging = false;
          }
        }}
      >
        <div {...stylex.props(mainStyles.root)}>{btnsMark}</div>
      </Draggable>
    </>
  );
}
