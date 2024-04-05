import React, { useEffect, useRef } from "react";

import stylex from "@stylexjs/stylex";
import { renderDrawCanvas } from "src/coreRenderer/drawCanvas/core";
import {
  canvasAtom,
  selectedKeyAtom,
  selectedKeyAtomSubMenu,
} from "src/state/uiState";
import { useAtom } from "jotai";
import { sceneAtom } from "src/state/sceneState";
import { menuConfigs } from "src/mainMenu";

const staticCvsSte = stylex.create({
  container: {
    width: "100%",
    height: "100%",
  },
});

export function DrawCanvas() {
  const innerCvsRef = useRef<HTMLCanvasElement>(null);
  const [, setCvsAtom] = useAtom(canvasAtom);
  const [sceneData] = useAtom(sceneAtom);
  const [menuKey] = useAtom(selectedKeyAtom);
  const [subMenuKey] = useAtom(selectedKeyAtomSubMenu);
  // initialize canvas
  useEffect(() => {
    setCvsAtom(innerCvsRef.current);

    innerCvsRef.current!.height = innerCvsRef.current!.offsetHeight;
    innerCvsRef.current!.width = innerCvsRef.current!.offsetWidth;
    renderDrawCanvas(
      sceneData,
      innerCvsRef.current!,
      menuConfigs[menuKey]?.btnConfigs?.[subMenuKey]?.strokeOptions
    );
  });
  return <canvas ref={innerCvsRef} {...stylex.props(staticCvsSte.container)} />;
}
