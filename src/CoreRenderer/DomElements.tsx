import styleX from "@stylexjs/stylex";
import { useAtomValue } from "jotai";
import React from "react";
import { NotePanel } from "src/NotePanel";
import { sceneAtom } from "src/state/sceneState";
const dom = styleX.create({
  fixed: {
    position: "fixed",
  },
});
export function DomElements() {
  const scene = useAtomValue(sceneAtom);

  return (
    <div {...styleX.props(dom.fixed)}>
      {scene.domElements.map((d, i) => (
        <NotePanel
          status="sticking"
          text={d.text}
          key={i}
          ele={d}
          color={d.color}
        />
      ))}
    </div>
  );
}
