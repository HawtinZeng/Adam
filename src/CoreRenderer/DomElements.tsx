import styleX from "@stylexjs/stylex";
import { useAtomValue } from "jotai";
import React from "react";
import { NotePanel } from "src/NotePanel";
import { sceneAtom } from "src/state/sceneState";
export const dom = styleX.create({
  fixed: {
    position: "fixed",
    display: "flex",
    flexWrap: "wrap",
  },
});
export function DomElements() {
  const scene = useAtomValue(sceneAtom);

  return (
    <div {...styleX.props(dom.fixed)}>
      {scene.domElements.map((d, i) => (
        <NotePanel status="sticking" key={i} ele={d} color={d.color} />
      ))}
    </div>
  );
}
