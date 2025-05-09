import stylex from "@stylexjs/stylex";
import React, { ReactNode, Ref, forwardRef, useEffect, useState } from "react";
import Draggable from "react-draggable";
import { setTransparentOption } from "src/commonUtils";
import { Point } from "src/Utils/Data/geometry";
export const menuContainer = stylex.create({
  flexContent: {
    backgroundColor: "#ffffff",
    borderRadius: "32px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    zIndex: "999",
  },
  areaBorder: {
    border: "2px solid #898989",
  },
  menuPadding: {
    padding: "9px",
  },
});

export const draggableTrans = stylex.create({
  horizontalPanel: {
    flexDirection: "row",
  },
  corner: {
    borderRadius: "5px",
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
      customCls?: string;
      style?: Object;
      position?: Point;
    },
    ref: Ref<HTMLElement>
  ) => {
    let isDragging = false;
    const isHorizontal = props.horizontal;
    const needBorder = props.needBorder ?? true;
    const needPadding = props.needPadding ?? true;
    const [defaultPosition, setdefaultPosition] = useState(
      props.defaultPosition ?? new Point(0, 0)
    );

    const onDrag = props.onDrag;
    const [hasIni, setHasIni] = useState(false);
    useEffect(() => {
      if (!hasIni) setTimeout(() => setHasIni(true), 10);
    }, [hasIni]);

    useEffect(() => {
      if (props.position) setdefaultPosition(props.position);
    }, [props.position]);

    return (
      <div style={props.style}>
        <Draggable
          cancel="#btn"
          onDrag={() => {
            isDragging = true;
            setTransparentOption.enabled = false;
            onDrag?.();
          }}
          onStop={() => {
            setTransparentOption.enabled = true;
            if (isDragging) {
              isDragging = false;
            }
          }}
          defaultClassName={props.customCls ?? "draggable"}
          defaultPosition={defaultPosition}
        >
          <div
            {...stylex.props(
              menuContainer.flexContent,
              isHorizontal && {
                ...draggableTrans.horizontalPanel,
                ...draggableTrans.corner,
              },
              needBorder && {
                ...menuContainer.areaBorder,
              },
              needPadding && {
                ...menuContainer.menuPadding,
              }
            )}
            ref={ref as Ref<HTMLDivElement>}
            style={
              hasIni ? { visibility: "visible" } : { visibility: "hidden" }
            }
          >
            {props.children}
          </div>
        </Draggable>
      </div>
    );
  }
);
