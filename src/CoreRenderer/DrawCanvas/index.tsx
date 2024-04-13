import React, { useCallback, useEffect, useMemo, useRef } from "react";

import stylex from "@stylexjs/stylex";
import { renderDrawCanvas } from "src/coreRenderer/drawCanvas/core";
import { canvasAtom } from "src/state/uiState";
import { useAtom, useSetAtom } from "jotai";
import { sceneAtom } from "src/state/sceneState";

const staticCvsSte = stylex.create({
  container: {
    width: "100%",
    height: "100%",
  },
});

export function DrawCanvas() {
  const innerCvsRef = useRef<HTMLCanvasElement>(null);
  const setCvsAtom = useSetAtom(canvasAtom);
  const [sceneData] = useAtom(sceneAtom);

  // initialize canvas
  useEffect(() => {
    setCvsAtom(innerCvsRef.current);
    innerCvsRef.current!.height = innerCvsRef.current!.offsetHeight;
    innerCvsRef.current!.width = innerCvsRef.current!.offsetWidth;

    renderDrawCanvas(sceneData, innerCvsRef.current!);
  });

  return <canvas ref={innerCvsRef} {...stylex.props(staticCvsSte.container)} />;
}
