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
import { useAtom } from "jotai";
import {
  selectedKeyAtomSueMenu,
  selectedKeyEffectAtomSubMenu,
} from "src/state/uiState";

export const penPanelStyles = stylex.create({
  horizontalPanel: {
    flexDirection: "row",
  },
  corner: {
    borderRadius: "5px",
  },
});
export function PenPanel(props: { btnConfigs: BtnConfigs }) {
  // 全局状态
  const [selectedKey, setSelectedKey] = useAtom(selectedKeyAtomSueMenu);
  useAtom(selectedKeyEffectAtomSubMenu);
  return Btn(
    setSelectedKey,
    selectedKey,
    props.btnConfigs,
    undefined,
    undefined,
    undefined,
    "horizontal",
    true
  );
}
