import React from "react";
import MainMenu from "./MainMenu";
import * as stylex from "@stylexjs/stylex";
import { setTransparent, unsetTransparent } from "./commonUtils";
import { DrawCanvas } from "./coreRenderer/DrawCanvas"

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
