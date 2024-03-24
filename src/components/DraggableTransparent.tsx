import React, { ReactNode, Ref, forwardRef, useEffect } from "react";
import { setTransparent, unsetTransparent } from "../commonUtils";
import stylex from "@stylexjs/stylex";
import Draggable from "react-draggable";
import { penPanelStyles } from "../PenPanel/index"
import { Point } from "../Utils/Data/geometry"
const menuContainer = stylex.create({
  flexContent: {
    backgroundColor: "#ffffff",
    borderRadius: "32px",
    border: "2px solid #898989",
    padding: "9px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    width: "min-content",
    position: "absolute",
  },
})
export const DraggableTransparent = forwardRef((props: {defaultPosition?: Point, onDrag?: ()=>void, children?: ReactNode, horizontal?: boolean}, ref: Ref<HTMLElement>) => {
  let isDragging = false;
  const isHorizontal = props.horizontal
  const defaultPosition = props.defaultPosition ?? new Point(0, 0);
  const onDrag = props.onDrag
  return (
    <Draggable
      cancel="#btn"
      onDrag={() => {
        isDragging = true;
        onDrag?.()
      }}
      onStop={() => {
        if (isDragging) {
          isDragging = false;
        }
      }}
      defaultPosition={defaultPosition}
    >
      
      <div
        onMouseEnter={unsetTransparent}
        onMouseLeave={() => !isDragging && setTransparent()}
        {...stylex.props(menuContainer.flexContent, isHorizontal && {...penPanelStyles.horizontalPanel, ...penPanelStyles.corner})}
        ref={ref as Ref<HTMLDivElement>}
      >
        {props.children}
      </div>
    </Draggable>)
})