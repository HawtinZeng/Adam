import React, { useEffect, useRef } from "react";
import * as stylex from "@stylexjs/stylex";
import { setTransparent, unsetTransparent } from "./commonUtils";
import MainMenu from "src/mainMenu";
import { DrawCanvas } from "src/coreRenderer/drawCanvas";
import { useAtom } from "jotai";
import { sceneAtom } from "src/state/sceneState";
function App() {
  setTransparent();
  return (
    <>
      <MainMenu />
      <DrawCanvas />
    </>
  );
}

export default App;
