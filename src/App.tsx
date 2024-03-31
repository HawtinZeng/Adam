import React, { useEffect } from "react";
import * as stylex from "@stylexjs/stylex";
import { setTransparent, unsetTransparent } from "./commonUtils";
import MainMenu from "src/mainMenu";
import { DrawCanvas } from "src/coreRenderer/drawCanvas";
import { useAtom } from "jotai";
import { sceneAtom } from "src/state/sceneState";
import { ControllersManager } from "src/drawingElements/controllers/controllersManager";
function App() {
  const [scene, updateSceneData] = useAtom(sceneAtom);
  setTransparent();
  return (
    <>
      <MainMenu />
      <DrawCanvas sceneData={scene} />
    </>
  );
}

export default App;
