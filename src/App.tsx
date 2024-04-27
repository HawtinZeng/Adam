import React from "react";
import { DrawCanvas } from "src/CoreRenderer/DrawCanvas";
import MainMenu from "src/MainMenu";
import { useDrawingOperator } from "src/hooks/useDrawingOperator";
import { setTransparent } from "./commonUtils";

function App() {
  console.log("rerender...");
  setTransparent();
  useDrawingOperator();
  return (
    <>
      <MainMenu />
      <DrawCanvas />
    </>
  );
}

export default App;
