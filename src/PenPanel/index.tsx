import React, { useState } from "react";
import Draggable from "react-draggable";
import { setTransparent, unsetTransparent } from "../commonUtils";
import { BtnConfigs } from "../mainMenu/menu";
import stylex from "@stylexjs/stylex";
import { Btn } from "../components/Btn";
import pen from "../images/svgs/pen.svg";
import highlighterPen from "../images/svgs/highlighterPen.svg";
import brush from "../images/svgs/brush.svg";
import laser from "../images/svgs/laser.svg";

export const penPanelStyles = stylex.create({
  horizontalPanel: {
    flexDirection: "row",
  },
  corner: {
    borderRadius: "5px",
  },
});
const penConfigs: BtnConfigs = [
  {
    label: "铅笔",
    svg: pen,
    key: "pen",
  },
  {
    label: "高光笔",
    svg: highlighterPen,
    key: "highlighterPen",
  },
  {
    label: "笔刷",
    svg: brush,
    key: "brush",
  },
  {
    label: "激光笔",
    svg: laser,
    key: "laser",
  },
];
export function PenPanel() {
  const [selectedKey, setSelectedKey] = useState(-1);

  return Btn(
    setSelectedKey,
    selectedKey,
    penConfigs,
    undefined,
    undefined,
    undefined,
    "horizontal",
    "trunGrey"
  );
}
