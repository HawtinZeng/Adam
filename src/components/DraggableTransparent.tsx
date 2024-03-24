import React from "react";
import { setTransparent, unsetTransparent } from "../commonUtils";
import { menuStyles } from "../MainMenu/Menu";
import stylex from "@stylexjs/stylex";
import Draggable from "react-draggable";
import { penPanelStyles } from "../PenPanel/index"

export function DraggableTransparent(props: React.ComponentProps<any>) {
  let isDragging = false;
  const isHorizontal = props.horizontal
  return (
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
      
      <div
        onMouseEnter={unsetTransparent}
        onMouseLeave={() => !isDragging && setTransparent()}
        {...stylex.props(menuStyles.root, isHorizontal && {...penPanelStyles.horizontalPanel, ...penPanelStyles.corner})}
      >
        {props.children}
      </div>
    </Draggable>)
}