import stylex from "@stylexjs/stylex";
import { useAtom } from "jotai";
import React, { useState } from "react";
import { ColorsSubPanel } from "src/PenPanel/color";
import { ColorPicker } from "src/PenPanel/colorPicker";
import { mainMenu, penConfigs } from "src/MainMenu";
import { PenPanel } from "src/PenPanel";
import { SizeSlider } from "src/SizeSlider";
import { brushRadius } from "src/state/uiState";
export function PenPanelComposal() {
  return (
    <div {...stylex.props(mainMenu.multilineLayout)}>
      <div {...stylex.props(mainMenu.onelineFlex)}>
        <PenPanel btnConfigs={penConfigs} />
      </div>
      <div {...stylex.props(mainMenu.onelineFlex)}>
        <ColorsSubPanel />
        <ColorPicker />
        <div {...stylex.props(mainMenu.brushRadiusSlider)}>
          <SizeSlider controledAtom={brushRadius} />
        </div>
      </div>
    </div>
  );
}
