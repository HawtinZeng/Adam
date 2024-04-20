import React, { useEffect, useRef } from "react";
import * as stylex from "@stylexjs/stylex";
import {
  setTransparent,
  setTransparentOption,
  unsetTransparent,
} from "./commonUtils";
import MainMenu from "src/MainMenu";
import { DrawCanvas } from "src/CoreRenderer/DrawCanvas";
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
