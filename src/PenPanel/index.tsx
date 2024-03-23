import React, { useState } from "react";
import Draggable from "react-draggable";
import { setTranspanrent, unsetTranspanrent } from "../commonUtils";
import { mainMenu } from "../MainMenu";
import { BtnConfigs, menuStyles } from "../components/Menu";
import stylex from "@stylexjs/stylex";
import { Btn } from "../components/Btn";
import pen from "../images/svgs/pen.svg"
import highlighterPen from "../images/svgs/highlighterPen.svg"
import brush from "../images/svgs/brush.svg"
import laser from "../images/svgs/laser.svg"

const penPanelStyles = stylex.create({
  horizontalPanel: {
    flexDirection: "row",
  }
})
const penConfigs: BtnConfigs = [
  {
  label: '铅笔',
  svg: pen,
  key: 'pen',
  },
  {
  label: '高光笔',
  svg: highlighterPen,
  key: 'highlighterPen',
  },
  {
  label: '笔刷',
  svg: brush,
  key: 'brush',
  },
  {
  label: '激光笔',
  svg: laser,
  key: 'laser',
  },
]
export function PenPanel() {
  const [selectedKey, setSelectedKey] = useState(-1);
  let isDragging = false;
  return (
  <Draggable
    onDrag={() => {
      isDragging = true;
    }}
    onStop={() => {
      if (isDragging) {
        isDragging = false;
      }
    }}
  >
    <div
      onMouseEnter={unsetTranspanrent}
      onMouseLeave={() => !isDragging && setTranspanrent()}
      {...stylex.props(menuStyles.root, penPanelStyles.horizontalPanel)}
    >
      {Btn(setSelectedKey, selectedKey, penConfigs, undefined, undefined, undefined, "horizontal")}
    </div>
  </Draggable>
  )
}
