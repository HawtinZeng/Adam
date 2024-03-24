import React from "react";
import MainMenu from "./MainMenu";
import * as stylex from "@stylexjs/stylex";
import { setTransparent, unsetTransparent } from "./commonUtils";

const styles = stylex.create({
  root: {
    height: "100vh",
    border: "5px solid red",
    display: "flex",
    justifyContent: "right",
    alignItems: "center",
    paddingRight: "20px",
  },
});
function App() {
  setTransparent();
  return (
    <div {...stylex.props(styles.root)}>
      <MainMenu></MainMenu>
    </div>
  );
}

export default App;
