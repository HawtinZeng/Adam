import React, { useEffect, useState } from "react";
import stylex from "@stylexjs/stylex";
import { PrimitiveAtom, useAtom } from "jotai";
import { colorPickerStyles } from "src/PenPanel/colorPicker";

export const sizeSliderStyles = stylex.create({
  container: {
    display: "flex",
    justifyContent: "space-between",
    width: "200px",
    height: "15px",
    borderRadius: "8px",
    backgroundColor: "#ffffff",
    padding: "0 10px",
    boxSizing: "border-box",
    lineHeight: "15px",
    boxShadow:
      "rgba(0, 0, 0, 0.1) 0px 0px 5px 0px, rgba(0, 0, 0, 0.1) 0px 0px 1px 0px",
  },
  circle: (offset: number) => ({
    userDrag: "none",
    position: "absolute",
    width: `30px`,
    height: `30px`,
    borderRadius: "50%",
    backgroundColor: "rgb(234, 234, 235)",
    transform: `translate(${offset}px, calc(-50% + 7px))`,

    boxShadow: {
      ":hover": "0 0 3px 2px rgba(255,0,0,0.5)",
    },
  }),
  symbol: {
    userSelect: "none",
    color: "#4b4f52",
    fontWeight: "900",
    marginTop: "-1px",
  },
});

export function SizeSlider(props: { controledAtom: PrimitiveAtom<number> }) {
  const [isMouseDown, setIsMouseDown] = useState(false);
  const { controledAtom } = props;
  const [offset, setOffset] = useAtom(controledAtom);

  const mouseMove = (e) => {
    if (
      isMouseDown &&
      offset + e.movementX < 140 &&
      offset + e.movementX > 10
    ) {
      setOffset(e.movementX + offset);
    }
  };

  const mouseDown = (e) => {
    setIsMouseDown(true);
    e.preventDefault();
  };
  useEffect(() => {
    window.addEventListener("mousemove", mouseMove);
    return () => {
      window.removeEventListener("mousemove", mouseMove);
    };
  }, [isMouseDown, offset]);

  useEffect(() => {
    const cancelMouseDown = () => setIsMouseDown(false);
    window.addEventListener("mouseup", cancelMouseDown);
    return () => window.removeEventListener("mouseup", cancelMouseDown);
  });

  return (
    <div id="subMenu">
      <div {...stylex.props(sizeSliderStyles.container)}>
        <span {...stylex.props(sizeSliderStyles.symbol)}>-</span>
        <span {...stylex.props(sizeSliderStyles.symbol)}>+</span>
        <div
          {...stylex.props(
            sizeSliderStyles.circle(offset),
            isMouseDown ? colorPickerStyles.activeColor : null
          )}
          onMouseDown={mouseDown}
          id="btn"
        ></div>
      </div>
    </div>
  );
}
