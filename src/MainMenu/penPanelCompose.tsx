import stylex from "@stylexjs/stylex";
import { useAtom } from "jotai";
import React, { useState } from "react";
import { ColorsSubPanel } from "src/PenPanel/color";
import { ColorPicker } from "src/PenPanel/colorPicker";
import { mainMenu, penConfigs } from "src/mainMenu";
import { PenPanel } from "src/penPanel";
import { SizeSlider } from "src/sizeSlider";
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
