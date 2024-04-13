import stylex from "@stylexjs/stylex";
import React, { useCallback, useRef, useState } from "react";
import { HexAlphaColorPicker, RgbaColorPicker } from "react-colorful";
import { useAtom, useSetAtom } from "jotai";
import { colorAtom, customColor } from "src/state/uiState";
import { colord } from "colord";
import styleX from "@stylexjs/stylex";
import { menuContainer } from "src/components/DraggableTransparent";
import colorPanel from "src/images/svgs/colorPanel.svg";
import { ReactSVG } from "react-svg";
import useClickOutside from "src/hooks/useClickOutside";
import { btn } from "src/components/Btn";
import customColorIcon from "src/images/svgs/customColorIcon.svg";

const colorPickerStyles = styleX.create({
  container: {
    width: "40px",
    height: "90px",
    boxSizing: "border-box",
    margin: "7px 0 0 10px",
    paddingTop: "4px",
    borderRadius: "23px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: {
      ":hover": "0 0 3px 2px rgba(255,0,0,0.5)",
    },
  },
  currentColor: {
    width: "28px",
    height: "28px",
    marginBottom: "4px",
  },
  pickerPanel: {
    position: "absolute",
    top: "110%",
    right: "0",
  },
  activeColor: {
    boxShadow: "0 0 3px 2px rgba(255,0,0,0.5)",
  },
});
export function ColorPicker() {
  const [color, setColor] = useAtom(customColor);

  const popover = useRef(null);
  const [isOpen, toggle] = useState(false);
  const [colorIdx, setColorIdx] = useAtom(colorAtom);

  const close = useCallback(() => toggle(false), []);
  useClickOutside(popover, close);
  const chooseCustomColor = () => {
    setColorIdx(-1);
    setColor("#000000");
    toggle(true);
  };

  return (
    <div
      id="btn"
      {...styleX.props(
        colorPickerStyles.container,
        menuContainer.areaBorder,
        colorIdx === -1 ? colorPickerStyles.activeColor : null
      )}
      onMouseDown={chooseCustomColor}
      ref={popover}
    >
      <ReactSVG src={colorPanel} />
      <div
        {...stylex.props(
          btn.circleStyle(color),
          colorPickerStyles.currentColor
        )}
      />
      {isOpen && (
        <div {...styleX.props(colorPickerStyles.pickerPanel)}>
          <HexAlphaColorPicker color={color} onChange={setColor} />
        </div>
      )}
      {color === "" && <ReactSVG src={customColorIcon} />}
    </div>
  );
}
