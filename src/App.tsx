import React from "react";
import MainMenu from "./MainMenu";
import * as stylex from "@stylexjs/stylex";
import { setTransparent, unsetTransparent } from "./commonUtils";
import { StaticCanvas } from "./CoreRenderer/StaticCanvas"

const styles = stylex.create({
  root: {
    height: "100vh",
    border: "5px solid red",
    display: "flex",
    justifyContent: "right",
    alignItems: "center",
  },
});
function App() {
  setTransparent();
  return (
      <>
      <MainMenu></MainMenu>
      <StaticCanvas></StaticCanvas>
      </>
  );
}

export default App;
