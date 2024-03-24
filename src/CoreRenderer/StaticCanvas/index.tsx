import React, { useEffect, useRef } from "react";
import stylex from "@stylexjs/stylex"
const staticCvsSte = stylex.create({
  container: {
    width: "100%",
    height: "100%",
    backgroundColor: "green",
  }
})
export function StaticCanvas() {
  const cvsRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cvs = cvsRef.current!;
    const ctx = cvs.getContext('2d')!;
    ctx.lineWidth = 10;
    ctx.strokeRect(0, 0, 150, 110);
  });
  return <canvas ref={cvsRef} {...stylex.props(staticCvsSte.container)}></canvas>
}