import React from "react";
import * as stylex from "@stylexjs/stylex";
import { setTransparent, unsetTransparent } from "./commonUtils";
import MainMenu from "src/mainMenu";
import { DrawCanvas } from "src/coreRenderer/drawCanvas";
import { defaultScene } from "src/test/someDrawingData";
function App() {
  setTransparent();
  return (
      <>
        <MainMenu />
        <DrawCanvas sceneData={defaultScene} />
      </>
  );
}

export default App;
