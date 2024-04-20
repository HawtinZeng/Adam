import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import stylex from "@stylexjs/stylex";
import { renderDrawCanvas } from "src/CoreRenderer/DrawCanvas/core";
import {
  brushRadius,
  canvasAtom,
  colorAtom,
  customColor,
  eraserRadius,
  selectedKeyAtom,
} from "src/state/uiState";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { sceneAtom } from "src/state/sceneState";
import { colorConfigs } from "src/MainMenu";
import { hexToRgb } from "src/CoreRenderer/DrawCanvas/colorUtils";
import AnimatedCursor from "src/components/AnimationCursor";

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

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [selectedKey] = useAtom(selectedKeyAtom);

  const size = useAtomValue(brushRadius);

  // initialize canvas
  useEffect(() => {
    setCvsAtom(innerCvsRef.current);
    innerCvsRef.current!.height = innerCvsRef.current!.offsetHeight;
    innerCvsRef.current!.width = innerCvsRef.current!.offsetWidth;

    renderDrawCanvas(sceneData, innerCvsRef.current!);
  }, [sceneData]);

  useEffect(() => {
    const rgbArr = hexToRgb(
      colorIdx !== -1 ? colorConfigs[colorIdx].key : color
    );
    setRgbColor(`${rgbArr[0]}, ${rgbArr[1]}, ${rgbArr[2]}`);
  }, [colorIdx, color]);
  const setMousePosWrapper = (e) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };
  useEffect(() => {
    window.addEventListener("mousemove", setMousePosWrapper);
    return () => {
      window.removeEventListener("mousemove", setMousePosWrapper);
    };
  }, []);

  return (
    <div>
      <canvas ref={innerCvsRef} {...stylex.props(staticCvsSte.container)} />
      {selectedKey !== -1 && (
        <AnimatedCursor
          innerSize={5}
          color={rgbColor}
          outerAlpha={0.6}
          outerScale={1.1}
          trailingSpeed={1}
          controledAtom={selectedKey === 0 ? brushRadius : eraserRadius}
          type="pointer"
        />
      )}
    </div>
  );
}
