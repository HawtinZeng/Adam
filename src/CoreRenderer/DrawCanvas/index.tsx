import React, { useEffect, useRef } from "react";
import stylex from "@stylexjs/stylex"
const staticCvsSte = stylex.create({
  container: {
    width: "100%",
    height: "100%",
    backgroundColor: "green",
  }
})
type InteractiveCanvasProps = {

}
export function DrawCanvas() {
  const cvsRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cvs = cvsRef.current!;
    const ctx = cvs.getContext('2d')!;
  });
  return <canvas ref={props.tranferCvs} {...stylex.props(staticCvsSte.container)}></canvas>
}