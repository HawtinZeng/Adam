import { useSetAtom } from "jotai";
import React, { useEffect, useRef } from "react";
import { DrawCanvas } from "src/CoreRenderer/DrawCanvas";
import { DynamicCanvas } from "src/CoreRenderer/DynamicCanvas";
import MainMenu from "src/MainMenu";
import { useMousePosition } from "src/hooks/mouseHooks";
import { useDrawingOperator } from "src/hooks/useDrawingOperator";
import { canvasEventTriggerAtom, mousePosition } from "src/state/uiState";
import { setTransparent } from "./commonUtils";
export const showEleId = false;
function App() {
  const canvasEventTrigger = useRef<HTMLDivElement>(null);
  const setTriggerAtom = useSetAtom(canvasEventTriggerAtom);
  setTransparent();
  useDrawingOperator();

  const pos = useMousePosition();
  const setPosAtom = useSetAtom(mousePosition);
  setPosAtom(pos);

  useEffect(() => {
    setTriggerAtom(canvasEventTrigger.current);
  }, []);
  return (
    <>
      <div ref={canvasEventTrigger}>
        <DrawCanvas />
        <DynamicCanvas />
      </div>
      <MainMenu />
    </>
  );
}

export default App;
