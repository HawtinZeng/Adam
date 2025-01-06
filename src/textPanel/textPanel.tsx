import stylex from "@stylexjs/stylex";
import React from "react";
import { mainMenu } from "src/MainMenu";
import { ColorsSubPanel } from "src/PenPanel/color";
import { ColorPicker } from "src/PenPanel/colorPicker";
import { SizeSlider } from "src/SizeSlider";
import { colorAtom, fontSizeAtom } from "src/state/uiState";
export function TextPanel() {
  return (
    <div {...stylex.props(mainMenu.multilineLayout)}>
      <div {...stylex.props(mainMenu.onelineFlex)}>
        <ColorsSubPanel controlledAtom={colorAtom} />
        <ColorPicker />
        <div {...stylex.props(mainMenu.brushRadiusSlider)}>
          <SizeSlider controledAtom={fontSizeAtom} />
        </div>
      </div>
    </div>
  );
}
