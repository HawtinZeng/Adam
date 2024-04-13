import React, { useRef, useState } from "react";
import stylex from "@stylexjs/stylex";
import { PrimitiveAtom, useAtom } from "jotai";
import { brushRadius } from "src/state/uiState";

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
  circle: (size: number) => ({
    position: "absolute",
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: "50%",
    backgroundColor: "#a7cbc1",
    transform: `translate(${size / 2}px, calc(-50% + 7px))`,
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
  const [size, setSize] = useAtom(controledAtom);

  return (
    <div
      id="subMenu"
      onMouseMove={(e) => {
        if (isMouseDown && size + e.movementX < 115 && size + e.movementX > 20)
          setSize(e.movementX + size);
      }}
      onMouseUp={() => setIsMouseDown(false)}
      onMouseLeave={() => setIsMouseDown(false)}
    >
      <div {...stylex.props(sizeSliderStyles.container)}>
        <span {...stylex.props(sizeSliderStyles.symbol)}>-</span>
        <span {...stylex.props(sizeSliderStyles.symbol)}>+</span>
        <div
          {...stylex.props(sizeSliderStyles.circle(size))}
          id="btn"
          onMouseDown={(e) => setIsMouseDown(true)}
        ></div>
      </div>
    </div>
  );
}
