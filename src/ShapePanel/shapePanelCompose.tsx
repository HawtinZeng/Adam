import stylex from "@stylexjs/stylex";
import React from "react";
import { mainMenu, shapeConfigs } from "src/MainMenu";
import { ColorsSubPanel } from "src/PenPanel/color";
import { ColorPicker } from "src/PenPanel/colorPicker";
import { ShapePanel } from "src/ShapePanel/core";
import { colorAtom } from "src/state/uiState";
export function ShapePanelCompose() {
  return (
    <div {...stylex.props(mainMenu.multilineLayout)}>
      <div {...stylex.props(mainMenu.onelineFlex)}>
        <ShapePanel btnConfigs={shapeConfigs} />
      </div>
      <div {...stylex.props(mainMenu.onelineFlex)}>
        <ColorsSubPanel controlledAtom={colorAtom} />
        <ColorPicker />
      </div>
    </div>
  );
}
