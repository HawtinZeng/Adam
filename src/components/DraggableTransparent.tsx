import React, { ReactNode, Ref, forwardRef } from "react";
import { setTransparent, unsetTransparent } from "../commonUtils";
import stylex from "@stylexjs/stylex";
import Draggable from "react-draggable";
import { penPanelStyles } from "src/PenPanel/index";
import { Point } from "src/Utils/Data/geometry";
import { useAtom } from "jotai";
import { selectedSubEffectAtom } from "src/state/uiState";
export const menuContainer = stylex.create({
  flexContent: {
    backgroundColor: "#ffffff",
    borderRadius: "32px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    width: "min-content",
    position: "absolute",
  },
  areaBorder: {
    border: "2px solid #898989",
  },
  menuPadding: {
    padding: "9px",
  },
});
export const DraggableTransparent = forwardRef(
  (
    props: {
      defaultPosition?: Point;
      onDrag?: () => void;
      children?: ReactNode;
      horizontal?: boolean;
      needBorder?: boolean;
      needPadding?: boolean;
    },
    ref: Ref<HTMLElement>
  ) => {
    let isDragging = false;
    const isHorizontal = props.horizontal;
    const needBorder = props.needBorder ?? true;
    const needPadding = props.needPadding ?? true;
    const defaultPosition = props.defaultPosition ?? new Point(0, 0);
    const onDrag = props.onDrag;
    useAtom(selectedSubEffectAtom);

    return (
      <Draggable
        cancel="#btn"
        onDrag={() => {
          isDragging = true;
          onDrag?.();
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
          {...stylex.props(
            menuContainer.flexContent,
            isHorizontal && {
              ...penPanelStyles.horizontalPanel,
              ...penPanelStyles.corner,
            },
            needBorder && {
              ...menuContainer.areaBorder,
            },
            needPadding && {
              ...menuContainer.menuPadding,
            }
          )}
          ref={ref as Ref<HTMLDivElement>}
        >
          {props.children}
        </div>
      </Draggable>
    );
  }
);
