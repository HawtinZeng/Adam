import React, { useEffect, useState } from "react";
import Draggable from "react-draggable";
import stylex from "@stylexjs/stylex";
import { unsetTransparent, setTransparent } from "../commonUtils";
import { Btn } from "../components/Btn";
import { DraggableTransparent } from "../components/DraggableTransparent";

export type BtnConfigs = Array<{
  label: string;
  svg: any;
  key: string;
  subMenu?: JSX.Element | null;
}>;
export const menuStyles = stylex.create({
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
    borderRadius: "50%",
    backgroundColor: {
      default: "#ffffff",
      ":hover": "#eaeaeb",
    },
  },
  verticalGap: {
    marginBottom: {
      default: "10px",
      ":last-child": "0px",
    },
  },
  horizontalGap: {
    marginRight: {
      default: "10px",
      ":last-child": "0px",
    },
  },
  selectedBtnArea: {
    backgroundColor: "#4b4f52",
  },
  selectedBtnAreaBk: {
    backgroundColor: "#eaeaeb",
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
  redCircle: {
    backgroundColor: 'red',
    borderRadius: '50%',
  }
});
export function Menu(props: {
  btnConfigs: BtnConfigs;
  setParentHoverKey: ((k: number) => void) | null;
  setParentSelectedKey: ((k: number) => void) | null;
  setBtnsRef: (node: HTMLDivElement[]) => void;
}) {
  const { setParentSelectedKey, setParentHoverKey, setBtnsRef } = props;
  const [selectedKey, setSelectedKey] = useState(-1);
  const [hoveredKey, setHoveredKey] = useState(-1);

  const { btnConfigs } = props;
  const btnsMark = Btn(
    setSelectedKey,
    selectedKey,
    btnConfigs,
    setBtnsRef,
    setHoveredKey,
    true
  );
  useEffect(() => {
    setParentSelectedKey?.(selectedKey);
  }, [selectedKey]);
  useEffect(() => setSelectedKey?.(selectedKey), [selectedKey]);
  useEffect(() => setParentHoverKey?.(hoveredKey), [hoveredKey]);
  return (
    <DraggableTransparent >
      {btnsMark}
    </DraggableTransparent>
  );
}
