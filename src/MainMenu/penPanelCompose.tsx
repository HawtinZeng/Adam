import stylex from "@stylexjs/stylex";
import React from "react";
import { mainMenu, penConfigs } from "src/MainMenu";
import { PenPanel } from "src/PenPanel";
import { ColorsSubPanel } from "src/PenPanel/color";
import { ColorPicker } from "src/PenPanel/colorPicker";
import { SizeSlider } from "src/SizeSlider";
import { colorAtom, sizeAtom } from "src/state/uiState";
export function PenPanelComposal() {
  return (
    <div {...stylex.props(mainMenu.multilineLayout)}>
      <div {...stylex.props(mainMenu.onelineFlex)}>
        <PenPanel btnConfigs={penConfigs} />
      </div>
      <div {...stylex.props(mainMenu.onelineFlex)}>
        <ColorsSubPanel controlledAtom={colorAtom} />
        <ColorPicker />
        <div {...stylex.props(mainMenu.brushRadiusSlider)}>
          <SizeSlider controledAtom={sizeAtom} />
        </div>
      </div>
    </div>
  );
}
