import { Box, Point, Polygon } from "@zenghawtin/graph2d";
import { useAtomValue } from "jotai";
import { useEffect, useRef } from "react";
import { Transform2DOperator } from "src/CoreRenderer/DrawCanvas/Transform2DOperator";
import { ScreenShotter } from "src/screenShot/screenShotter";
import { logger } from "src/setup";
import { bgCanvasAtom } from "src/state/uiState";

export function useScreenShot() {
  const bg = useAtomValue(bgCanvasAtom)!;
  const status = useRef<"preparing" | "creating" | "afterCreating" | "ending">(
    "ending"
  );
  const startPt = useRef<Point>();
  const creatingScreenShot = useRef<ScreenShotter>();
  const imgData = useRef<ImageData>();

  async function startScreenShot() {
    if (status.current === "preparing") return;
    status.current = "preparing";

    bg?.addEventListener("mousemove", transformOperatorHandlers);
    bg?.addEventListener("mousedown", addPoint);

    imgData.current = bg!
      .getContext("2d", { willReadFrequently: true })!
      .getImageData(0, 0, bg!.width, bg!.height);

    const ctx = bg?.getContext("2d")!;
    if (!ctx) return;
    ctx.save();
    const source = (window as any).sourceId;
    // debug
    // ctx.fillStyle = "red";
    // ctx.fillRect(bg.width - 10, bg.height - 10, 10, 10);
    if (source) {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          // @ts-ignore
          mandatory: {
            chromeMediaSource: "desktop",
            chromeMediaSourceId: source,
            minWidth: bg!.width,
            minHeight: bg!.height,
          },
        },
      });

      const track = stream.getVideoTracks()[0];
      const imageCapture = new ImageCapture(track);
      const img = await imageCapture.grabFrame();
      // Debug
      ctx.scale(1, 0.4);

      ctx.drawImage(img, 0, 0, bg.width, bg.height, 0, 0, bg.width, bg.height);
      ctx.restore();
    }
  }

  function terminateScreenShot() {
    status.current = "ending";

    const ctx = bg?.getContext("2d")!;
    if (!ctx) return;
    ctx.clearRect(0, 0, bg.width, bg.height);
    bg?.removeEventListener("mousemove", transformOperatorHandlers);
    bg?.removeEventListener("mousedown", addPoint);
  }

  function transformOperatorHandlers(e: MouseEvent) {
    const ctx = bg?.getContext("2d")!;
    if (status.current !== "creating" || !startPt.current || !ctx) return;
    const pt = { x: e.clientX, y: e.clientY };
    if (!creatingScreenShot.current) {
      const pol = new Polygon(
        new Box(startPt.current.x, startPt.current.y, pt.x, pt.y)
      );
      creatingScreenShot.current = new ScreenShotter(
        new Transform2DOperator(pol, 0, ctx, false, false),
        imgData.current!
      );
    } else {
      creatingScreenShot.current.updateRightBottom({
        x: e.clientX,
        y: e.clientY,
      });
    }
  }
  useEffect(() => {
    return () => {
      bg?.removeEventListener("mousemove", transformOperatorHandlers);
      bg?.removeEventListener("mousedown", addPoint);
    };
  }, []);

  function addPoint(e: MouseEvent) {
    logger.log("addPoint");
    if (status.current === "ending") return;
    else if (status.current === "preparing") {
      status.current = "creating";
      startPt.current = new Point(e.clientX, e.clientY);
    } else if (status.current === "creating") status.current = "afterCreating";
  }
  return { startScreenShot, terminateScreenShot };
}
