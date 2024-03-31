import React, {
  ForwardedRef,
  Ref,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";

import useDeepCompareEffect from "use-deep-compare-effect";
import stylex from "@stylexjs/stylex";
import { renderDrawCanvas } from "src/coreRenderer/drawCanvas/core";
import { Scene } from "src/drawingElements/data/scene";
import { canvasAtom } from "src/state/uiState";
import { useAtom } from "jotai";
import { sceneAtom } from "src/state/sceneState";
import { atomEffect } from "jotai-effect";
const staticCvsSte = stylex.create({
  container: {
    width: "100%",
    height: "100%",
    backgroundColor: "green",
  },
});

export function DrawCanvas() {
  const innerCvsRef = useRef<HTMLCanvasElement>(null);
  const [, setCvsAtom] = useAtom(canvasAtom);
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
