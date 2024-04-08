import React, { useCallback, useEffect, useMemo, useRef } from "react";

import stylex from "@stylexjs/stylex";
import { renderDrawCanvas } from "src/coreRenderer/drawCanvas/core";
import {
  brushRadius,
  canvasAtom,
  selectedKeyAtom,
  selectedKeyAtomSubMenu,
} from "src/state/uiState";
import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";
import { sceneAtom } from "src/state/sceneState";
import { menuConfigs } from "src/mainMenu";
import { useAtomCallback } from "jotai/utils";

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

  const menuKey = useAtomCallback(
    useCallback((get) => {
      const mek = get(selectedKeyAtom);

      return mek;
    }, [])
  )();

  const subMenuKey = useAtomCallback(
    useCallback((get) => {
      const subKey = get(selectedKeyAtomSubMenu);

      return subKey;
    }, [])
  )();

  // useAtomCallback to retrive new atom value, but don't trigger re-excution of component function.
  const size = useAtomCallback(
    useCallback((get) => {
      const size = get(brushRadius);

      return size;
    }, [])
  )();
  // initialize canvas
  useEffect(() => {
    setCvsAtom(innerCvsRef.current);
    innerCvsRef.current!.height = innerCvsRef.current!.offsetHeight;
    innerCvsRef.current!.width = innerCvsRef.current!.offsetWidth;
    // 这里的menuKey，size，suMenu均使用了最新的Atom值，但atom值发生改变不会re-render
    const strokeOptions =
      menuConfigs[menuKey]?.btnConfigs?.[subMenuKey]?.strokeOptions;
    if (!strokeOptions) return;
    strokeOptions.size = size / 3;
    renderDrawCanvas(sceneData, innerCvsRef.current!, strokeOptions);
  });

  return <canvas ref={innerCvsRef} {...stylex.props(staticCvsSte.container)} />;
}
