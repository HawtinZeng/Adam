import { hexToRgb } from "@mui/material";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { DomElements } from "src/CoreRenderer/DomElements";
import { DrawCanvas } from "src/CoreRenderer/DrawCanvas";
import { DynamicCanvas } from "src/CoreRenderer/DynamicCanvas";
import MainMenu, { colorConfigs } from "src/MainMenu";
import AnimatedCursor from "src/components/AnimationCursor";
import { useMousePosition } from "src/hooks/mouseHooks";
import { useDrawingOperator } from "src/hooks/useDrawingOperator";
import { setup } from "src/setup";
import {
  brushRadius,
  canvasEventTriggerAtom,
  colorAtom,
  customColor,
  eraserRadius,
  selectedKeyAtom,
} from "src/state/uiState";
import { setTransparent } from "./commonUtils";
export const debugShowEleId = false;
function App() {
  const colorIdx = useAtomValue(colorAtom);
  const color = useAtomValue(customColor);
  const rgbArr = hexToRgb(colorIdx !== -1 ? colorConfigs[colorIdx].key : color);
  const [rgbColor, setRgbColor] = useState(
    `${rgbArr[0]}, ${rgbArr[1]}, ${rgbArr[2]}`
  );
  const [selectedKey] = useAtom(selectedKeyAtom);

  useEffect(() => {
    const rgbArr = hexToRgb(
      colorIdx !== -1 ? colorConfigs[colorIdx].key : color
    );
    setRgbColor(`${rgbArr[0]}, ${rgbArr[1]}, ${rgbArr[2]}`);
  }, [colorIdx, color]);

  const canvasEventTrigger = useRef<HTMLDivElement>(null);
  const setTriggerAtom = useSetAtom(canvasEventTriggerAtom);
  setTransparent();
  useDrawingOperator();
  const m = useMousePosition();

  // initialize
  useEffect(() => {
    setTriggerAtom(canvasEventTrigger.current);
    setup();
  }, []);
  return (
    <>
      {useMemo(
        () => (
          <>
            <div ref={canvasEventTrigger}>
              <DrawCanvas />
              <DynamicCanvas />
              <DomElements />
            </div>
            <MainMenu />
          </>
        ),
        []
      )}

      {selectedKey !== -1 && (
        <AnimatedCursor
          innerSize={5}
          color={rgbColor}
          outerAlpha={0.6}
          // todo: move the mouse...
          outerScale={1.1}
          trailingSpeed={1}
          controledAtom={selectedKey === 0 ? brushRadius : eraserRadius}
          type={selectedKey === 0 || selectedKey === 1 ? "circle" : "pointer"}
          initialPosition={m}
        />
      )}
    </>
  );
}

export default App;
