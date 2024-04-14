import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import stylex from "@stylexjs/stylex";
import { renderDrawCanvas } from "src/coreRenderer/drawCanvas/core";
import {
  canvasAtom,
  colorAtom,
  customColor,
  simulatePressureSize,
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
  const [size, setSize] = useAtom(simulatePressureSize);

  const colorIdx = useAtomValue(colorAtom);
  const color = useAtomValue(customColor);
  const [rgbColor, setRgbColor] = useState("");

  // initialize canvas
  useEffect(() => {
    setCvsAtom(innerCvsRef.current);
    innerCvsRef.current!.height = innerCvsRef.current!.offsetHeight;
    innerCvsRef.current!.width = innerCvsRef.current!.offsetWidth;

    renderDrawCanvas(sceneData, innerCvsRef.current!, setSize);
  }, [sceneData]);

  useEffect(() => {
    const rgbArr = hexToRgb(
      colorIdx !== -1 ? colorConfigs[colorIdx].key : color
    );
    setRgbColor(`${rgbArr[0]},${rgbArr[1]},${rgbArr[2]}`);
    console.log(`${rgbArr[0]},${rgbArr[1]},${rgbArr[2]}`);
  }, [colorIdx, color]);

  return (
    <div>
      <canvas ref={innerCvsRef} {...stylex.props(staticCvsSte.container)} />
      <AnimatedCursor
        innerSize={0}
        outerSize={8}
        color="193, 11, 111"
        outerAlpha={1}
        outerScale={1.4}
        trailingSpeed={1}
      />
    </div>
  );
}
