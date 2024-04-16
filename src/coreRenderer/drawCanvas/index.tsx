import React, { useEffect, useRef, useState } from "react";

import stylex from "@stylexjs/stylex";
import { throttledRenderDC } from "src/coreRenderer/drawCanvas/core";
import {
  brushRadius,
  canvasAtom,
  colorAtom,
  customColor,
} from "src/state/uiState";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { sceneAtom } from "src/state/sceneState";
import AnimatedCursor from "react-animated-cursor";
import { colorConfigs } from "src/mainMenu";
import { hexToRgb } from "src/coreRenderer/drawCanvas/colorUtils";

const staticCvsSte = stylex.create({
  container: {
    width: "100%",
    height: "100%",
  },
});
export function DrawCanvas() {
  const innerCvsRef = useRef<HTMLCanvasElement>(null);
  const setCvsAtom = useSetAtom(canvasAtom);
  const [sceneData] = useAtom(sceneAtom);

  const colorIdx = useAtomValue(colorAtom);
  const color = useAtomValue(customColor);
  const rgbArr = hexToRgb(colorIdx !== -1 ? colorConfigs[colorIdx].key : color);
  const [rgbColor, setRgbColor] = useState(
    `${rgbArr[0]}, ${rgbArr[1]}, ${rgbArr[2]}`
  );

  const size = useAtomValue(brushRadius);

  // initialize canvas
  useEffect(() => {
    setCvsAtom(innerCvsRef.current);

    innerCvsRef.current!.height = innerCvsRef.current!.offsetHeight;
    innerCvsRef.current!.width = innerCvsRef.current!.offsetWidth;

    throttledRenderDC(sceneData, innerCvsRef.current!);
  }, [sceneData]);

  useEffect(() => {
    const rgbArr = hexToRgb(
      colorIdx !== -1 ? colorConfigs[colorIdx].key : color
    );
    setRgbColor(`${rgbArr[0]}, ${rgbArr[1]}, ${rgbArr[2]}`);
  }, [colorIdx, color]);

  return (
    <div>
      <canvas
        ref={innerCvsRef}
        {...stylex.props(staticCvsSte.container)}
        onMouseDown={() => console.log("mouse down...")}
      />
      (
      <AnimatedCursor
        innerSize={0}
        outerSize={size / 4}
        color={rgbColor}
        outerAlpha={0.6}
        outerScale={1.6}
        trailingSpeed={1}
        key={rgbColor + size}
      />
      );
    </div>
  );
}
